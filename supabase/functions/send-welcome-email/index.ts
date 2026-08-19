import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WelcomeEmailData {
  email: string;
  name: string;
  order_number: string;
}

function generateWelcomeEmailHTML(resetLink: string, name: string, orderNumber: string, email: string): string {
  const logoUrl = 'https://kraszqrhydhhkknyapxa.supabase.co/storage/v1/object/public/assets/logo-met-kader.jpg';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welkom bij Cultheld</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 32px; text-align: center;">
              <img src="${logoUrl}" alt="Cultheld" style="max-width: 200px; height: auto;" />
            </td>
          </tr>

          <!-- Welcome Banner -->
          <tr>
            <td style="background-color: #10b981; padding: 24px 32px; text-align: center;">
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                Welkom bij Cultheld!
              </h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 24px 0; color: #111827; font-size: 18px; font-weight: 600;">
                Beste ${name},
              </p>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Bedankt voor je bestelling bij Cultheld! We hebben automatisch een account voor je aangemaakt, zodat je:
              </p>

              <!-- Benefits List -->
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
                  <li>Je bestelling kunt volgen</li>
                  <li>Gemakkelijk opnieuw kunt bestellen</li>
                  <li>Je bestelgeschiedenis kunt bekijken</li>
                  <li>Je adresgegevens kunt opslaan</li>
                </ul>
              </div>

              <!-- Order Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 13px; color: #92400e; margin-bottom: 4px;">Je eerste bestelling</div>
                <div style="font-size: 18px; font-weight: bold; color: #92400e;">${orderNumber}</div>
              </div>

              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Om je account te activeren en een eigen wachtwoord in te stellen, klik je op onderstaande knop:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Wachtwoord Instellen
                </a>
              </div>

              <!-- Alternative Link -->
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #111827; font-weight: 600; font-size: 14px;">Of kopieer deze link:</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px; word-break: break-all;">
                  ${resetLink}
                </p>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #1e40af; font-weight: 600; font-size: 14px;">Belangrijk</p>
                <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5;">
                  Deze link is <strong>1 uur geldig</strong>. Daarna kun je via "Wachtwoord vergeten" op de inlogpagina een nieuwe link aanvragen.
                </p>
              </div>

              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Je kunt altijd inloggen met je emailadres: <strong>${email}</strong>
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Vragen? Neem contact met ons op via <a href="mailto:info@cultheld.nl" style="color: #000000; text-decoration: underline;">info@cultheld.nl</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                © 2026 Cultheld. We all love football.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                Deze email is verstuurd naar ${email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, name, order_number }: WelcomeEmailData = await req.json();

    if (!email || !name) {
      throw new Error('Email and name are required');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const redirectUrl = `${SUPABASE_URL.replace('.supabase.co', '')}/reset-password`;

    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (resetError) {
      console.error(`Failed to generate reset link for ${email}: ${resetError.message}`);
      throw resetError;
    }

    if (!data.properties?.action_link) {
      throw new Error('Failed to generate reset link');
    }

    const resetLink = data.properties.action_link;

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email system not configured. Welcome email would be sent in production.',
          resetLink: resetLink
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const emailHTML = generateWelcomeEmailHTML(resetLink, name, order_number, email);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Cultheld <noreply@cultheld.nl>',
        to: [email],
        subject: 'Welkom bij Cultheld - Activeer je account',
        html: emailHTML,
      }),
    });

    const resendData = await res.json();

    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        message: 'Welcome email sent successfully'
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
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
