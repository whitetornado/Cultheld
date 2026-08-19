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

interface PasswordResetData {
  email: string;
  redirect_url: string;
}

function generatePasswordResetHTML(resetLink: string, email: string): string {
  const logoUrl = 'https://kraszqrhydhhkknyapxa.supabase.co/storage/v1/object/public/assets/logo-met-kader.jpg';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wachtwoord Resetten</title>
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

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #111827;">Wachtwoord Resetten</h1>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Je ontvangt deze email omdat er een verzoek is gedaan om het wachtwoord van je Cultheld account te resetten.
              </p>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Klik op onderstaande knop om een nieuw wachtwoord in te stellen:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  🔒 Wachtwoord Resetten
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
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600; font-size: 14px;">⚠️ Belangrijk</p>
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                  Deze link is <strong>1 uur geldig</strong>. Als je deze tijd hebt, moet je een nieuw resetverzoek indienen.
                </p>
              </div>

              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Heb je deze reset niet aangevraagd? Dan kun je deze email veilig negeren. Je wachtwoord blijft ongewijzigd.
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
    const { email, redirect_url }: PasswordResetData = await req.json();

    if (!email) {
      throw new Error('Email is required');
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

    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirect_url,
      }
    });

    if (resetError) {
      console.log(`Password reset requested for ${email}: ${resetError.message}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent'
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

    if (!data.properties?.action_link) {
      throw new Error('Failed to generate reset link');
    }

    const resetLink = data.properties.action_link;

    if (RESEND_API_KEY) {
      const emailHTML = generatePasswordResetHTML(resetLink, email);

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Cultheld <noreply@cultheld.nl>',
          to: [email],
          subject: '🔒 Wachtwoord Resetten - Cultheld',
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
          message: 'Password reset email sent successfully'
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      console.warn('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: true,
          resetLink: resetLink,
          message: 'Reset link generated (email not sent - no email service configured)'
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
  } catch (error) {
    console.error('Error sending password reset email:', error);
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