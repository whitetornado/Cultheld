import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderItem {
  legend_name: string;
  product_type_name: string;
  color_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  mockup_preview_url?: string;
}

interface OrderData {
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  subtotal: number;
  shipping_cost: number;
  total: number;
  items: OrderItem[];
}

function generateOrderConfirmationHTML(order: OrderData): string {
  const logoUrl = 'https://kraszqrhydhhkknyapxa.supabase.co/storage/v1/object/public/assets/logo-met-kader.jpg';
  
  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px 0;">
        <div style="font-weight: 600; margin-bottom: 4px;">${item.legend_name}</div>
        <div style="color: #6b7280; font-size: 14px;">
          ${item.product_type_name} • ${item.color_name} • Maat ${item.size}
        </div>
      </td>
      <td style="padding: 16px 0; text-align: center;">${item.quantity}</td>
      <td style="padding: 16px 0; text-align: right;">€${item.total_price.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orderbevestiging</title>
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
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #111827;">Bedankt voor je bestelling!</h1>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                Beste ${order.customer_name},
              </p>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                We hebben je bestelling succesvol ontvangen en gaan direct voor je aan de slag!
              </p>
              
              <!-- Order Info -->
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Ordernummer</div>
                <div style="font-size: 18px; font-weight: 600; color: #111827;">${order.order_number}</div>
              </div>
              
              <!-- Order Items -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px 0; text-align: left; font-size: 14px; font-weight: 600; color: #6b7280;">Product</th>
                    <th style="padding: 12px 0; text-align: center; font-size: 14px; font-weight: 600; color: #6b7280;">Aantal</th>
                    <th style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: 600; color: #6b7280;">Prijs</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
              
              <!-- Totals -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; text-align: right; color: #6b7280;">Subtotaal:</td>
                  <td style="padding: 8px 0; text-align: right; width: 100px; color: #111827;">€${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; text-align: right; color: #6b7280;">Verzendkosten:</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827;">€${order.shipping_cost.toFixed(2)}</td>
                </tr>
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 600; color: #111827;">Totaal (incl. BTW):</td>
                  <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: 600; color: #111827;">€${order.total.toFixed(2)}</td>
                </tr>
              </table>
              
              <!-- Shipping Address -->
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">Verzendadres</div>
                <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  ${order.customer_name}<br/>
                  ${order.shipping_address.street}<br/>
                  ${order.shipping_address.postal_code} ${order.shipping_address.city}<br/>
                  ${order.shipping_address.country}
                </div>
              </div>
              
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Je ontvangt een verzendbevestiging zodra je bestelling onderweg is.
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
    const orderData: OrderData = await req.json();

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email system not configured. Order confirmation email would be sent in production.' 
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

    const emailHTML = generateOrderConfirmationHTML(orderData);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Cultheld <orders@cultheld.nl>',
        to: [orderData.customer_email],
        subject: `Orderbevestiging ${orderData.order_number}`,
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
    console.error('Error sending email:', error);
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