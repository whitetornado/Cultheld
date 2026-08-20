import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ShippingData {
  order_number: string;
  customer_email: string;
  customer_name: string;
  tracking_number: string;
  carrier: string;
  tracking_url?: string;
}

function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const carriers: { [key: string]: string } = {
    'PostNL': `https://jouw.postnl.nl/track-and-trace/${trackingNumber}`,
    'DHL': `https://www.dhl.com/nl-nl/home/tracking/tracking-parcel.html?submit=1&tracking-id=${trackingNumber}`,
    'DPD': `https://www.dpd.com/nl/nl/ontvangen/track-trace/?parcelNumber=${trackingNumber}`,
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
  };
  
  return carriers[carrier] || `#tracking:${trackingNumber}`;
}

function generateShippingNotificationHTML(data: ShippingData): string {
  const logoUrl = 'https://cultheld.nl/logo-met-kader.jpg';
  const trackingUrl = data.tracking_url || getTrackingUrl(data.carrier, data.tracking_number);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Je bestelling is onderweg!</title>
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
          
          <!-- Success Banner -->
          <tr>
            <td style="background-color: #10b981; padding: 20px 32px; text-align: center;">
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                📦 Je bestelling is onderweg!
              </h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Beste ${data.customer_name},
              </p>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Geweldig nieuws! Je bestelling <strong>${data.order_number}</strong> is verzonden en onderweg naar je toe.
              </p>
              
              <!-- Tracking Info -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 14px; color: #065f46; font-weight: 600; margin-bottom: 12px;">Verzendgegevens</div>
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="padding: 6px 0; color: #065f46; font-size: 14px;">Vervoerder:</td>
                    <td style="padding: 6px 0; color: #065f46; font-size: 14px; font-weight: 600;">${data.carrier}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #065f46; font-size: 14px;">Track & Trace:</td>
                    <td style="padding: 6px 0; color: #065f46; font-size: 14px; font-weight: 600;">${data.tracking_number}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${trackingUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  📍 Volg je bestelling
                </a>
              </div>
              
              <!-- Delivery Info -->
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #111827; font-weight: 600; font-size: 14px;">Verwachte levertijd</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Je bestelling wordt normaal binnen 1-3 werkdagen bezorgd.
                </p>
              </div>
              
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Je kunt je bestelling volgen via bovenstaande link. Je ontvangt mogelijk ook updates van de vervoerder.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Vragen over je bestelling? Neem contact met ons op via info@cultheld.nl
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2026 Cultheld. We all love football.
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
    const shippingData: ShippingData = await req.json();

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email system not configured. Shipping notification would be sent in production.' 
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

    const emailHTML = generateShippingNotificationHTML(shippingData);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Cultheld <orders@cultheld.nl>',
        to: [shippingData.customer_email],
        subject: `📦 Je bestelling ${shippingData.order_number} is onderweg!`,
        html: emailHTML,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending shipping notification:', error);
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