import { Resend } from 'npm:resend@4.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string; // Honeypot field
}

// Calculate spam score based on message content
function calculateSpamScore(message: ContactMessage): number {
  let score = 0;
  const text = `${message.name} ${message.email} ${message.subject} ${message.message}`.toLowerCase();

  // Honeypot check
  if (message.website && message.website.trim().length > 0) {
    score += 100; // Instant spam
    return score;
  }

  // Check for excessive links
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urlMatches = text.match(urlPattern);
  if (urlMatches) {
    score += urlMatches.length * 20; // 20 points per URL
  }

  // Common spam keywords
  const spamKeywords = [
    'viagra', 'cialis', 'casino', 'lottery', 'winner', 'congratulations',
    'claim your', 'click here', 'limited time', 'act now', 'free money',
    'make money fast', 'work from home', 'bitcoin', 'crypto', 'investment opportunity',
    'seo service', 'increase traffic', 'buy followers', 'backlinks'
  ];

  spamKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 15;
    }
  });

  // Check for excessive caps (more than 30%)
  const capsCount = (message.message.match(/[A-Z]/g) || []).length;
  const totalLetters = (message.message.match(/[a-zA-Z]/g) || []).length;
  if (totalLetters > 0 && capsCount / totalLetters > 0.3) {
    score += 10;
  }

  // Check message length
  if (message.message.length < 20) {
    score += 10; // Too short
  }
  if (message.message.length > 5000) {
    score += 20; // Suspiciously long
  }

  // Check for repeated characters (like 'aaaaaaa')
  if (/(.)\1{6,}/.test(message.message)) {
    score += 15;
  }

  return score;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const contactData: ContactMessage = await req.json();
    const { name, email, subject, message, website } = contactData;

    // Get client IP and user agent
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Basic validation
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Alle velden zijn verplicht' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Honeypot check
    if (website && website.trim().length > 0) {
      console.log('Honeypot triggered:', { email, ip });
      return new Response(
        JSON.stringify({ error: 'Invalid submission' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Check rate limits
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_contact_rate_limit', {
        p_ip_address: ip,
        p_email: email
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      // Continue anyway, don't block on rate limit errors
    } else if (rateLimitData && rateLimitData.length > 0) {
      const result = rateLimitData[0];
      if (!result.is_allowed) {
        return new Response(
          JSON.stringify({
            error: result.reason,
            waitTime: result.wait_time
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Calculate spam score
    const spamScore = calculateSpamScore(contactData);
    const isSpam = spamScore >= 50;

    // Record the submission
    await supabase.rpc('record_contact_submission', {
      p_ip_address: ip,
      p_email: email
    });

    // Store in database with spam info
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        subject,
        message,
        ip_address: ip,
        user_agent: userAgent,
        is_spam: isSpam,
        spam_score: spamScore
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store message');
    }

    // Only send email if not spam
    if (isSpam) {
      console.log('Spam detected, not sending email:', { email, ip, spamScore });
      // Return success to avoid revealing spam detection
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #666; }
            .value { margin-top: 5px; }
            .message-box { background: #fff; padding: 15px; border-left: 4px solid #000; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nieuw Contactbericht</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Van:</div>
                <div class="value">${name} (${email})</div>
              </div>
              <div class="field">
                <div class="label">Onderwerp:</div>
                <div class="value">${subject}</div>
              </div>
              <div class="field">
                <div class="label">Bericht:</div>
                <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Cultheld Contact <noreply@cultheld.nl>',
      to: ['info@cultheld.nl'],
      replyTo: email,
      subject: `Contact formulier: ${subject}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ error: 'Fout bij verzenden van email' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});