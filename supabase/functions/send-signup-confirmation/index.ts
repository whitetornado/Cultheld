import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Creates the new auth user server-side via the admin API and emails the
// confirmation link ourselves through Resend, using the same branded
// template as the other Cultheld account emails. This deliberately avoids
// the client-side `supabase.auth.signUp()` call, which would trigger
// Supabase's own default "Confirm your email address" email — the generic,
// unbranded one from noreply@mail.app.supabase.io.
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SignupConfirmationData {
  email: string;
  password: string;
  name?: string;
}

function generateSignupConfirmationHTML(confirmLink: string, name: string, email: string): string {
  const logoUrl = 'https://kraszqrhydhhkknyapxa.supabase.co/storage/v1/object/public/assets/logo-met-kader.jpg';
  const greeting = name ? `Beste ${name},` : 'Welkom,';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bevestig je e-mailadres</title>
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
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #111827;">Bevestig je e-mailadres</h1>
              <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Bedankt voor het aanmaken van een account bij Cultheld. Bevestig je e-mailadres om je account te activeren:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${confirmLink}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  E-mailadres bevestigen
                </a>
              </div>

              <!-- Alternative Link -->
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #111827; font-weight: 600; font-size: 14px;">Of kopieer deze link:</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px; word-break: break-all;">
                  ${confirmLink}
                </p>
              </div>

              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Heb je dit account niet aangemaakt? Dan kun je deze email negeren.
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
    const { email, password, name }: SignupConfirmationData = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email en wachtwoord zijn verplicht' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://cultheld.nl';

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

    const { data, error: signupError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: name ? { full_name: name } : undefined,
        redirectTo: `${appBaseUrl}/login`,
      },
    });

    if (signupError) {
      // Returned as a 200 with success: false (instead of a 4xx) so the
      // frontend can read the friendly message straight off the response
      // body — supabase-js's functions.invoke() doesn't expose a non-2xx
      // response's JSON body without extra plumbing.
      const alreadyRegistered = /already.*registered|already.*exists/i.test(signupError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: alreadyRegistered
            ? 'Dit e-mailadres is al geregistreerd. Probeer in te loggen.'
            : signupError.message,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.properties?.action_link) {
      throw new Error('Failed to generate confirmation link');
    }

    const confirmLink = data.properties.action_link;

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email system not configured. Confirmation email would be sent in production.',
          confirmLink,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailHTML = generateSignupConfirmationHTML(confirmLink, name || '', email);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Cultheld <noreply@cultheld.nl>',
        to: [email],
        subject: 'Bevestig je e-mailadres - Cultheld',
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
        message: 'Confirmation email sent successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending signup confirmation email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
