import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'order@cultheld.nl';

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

function generateAdminNotificationHTML(order: OrderData): string {
  const logoUrl = 'https://cultheld.nl/logo-met-kader.jpg';
  
  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px;">
        <div style="font-weight: 600; margin-bottom: 4px;">${item.legend_name}</div>
        <div style="color: #6b7280; font-size: 13px;">
          ${item.product_type_name} • ${item.color_name} • ${item.size}
        </div>
      </td>
      <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right;">€${item.unit_price.toFixed(2)}</td>
      <td style="padding: 12px 8px; text-align: right; font-weight: 600;">€${item.total_price.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuwe Bestelling</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 24px 32px;">
              <img src="${logoUrl}" alt="Cultheld" style="max-width: 150px; height: auto;" />
            </td>
          </tr>
          
          <!-- Alert Banner -->
          <tr>
            <td style="background-color: #10b981; padding: 16px 32px;">
              <h2 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                ✅ Nieuwe Bestelling Ontvangen!
              </h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Order Number -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Ordernummer</div>
                <div style="font-size: 24px; font-weight: bold; color: #92400e;">${order.order_number}</div>
              </div>
              
              <!-- Customer Info -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 600;">Klantgegevens</div>
                  <div style="color: #111827; font-size: 14px; line-height: 1.6;">
                    <strong>${order.customer_name}</strong><br/>
                    ${order.customer_email}<br/>
                    ${order.customer_phone || 'Geen telefoon'}
                  </div>
                </div>
                
                <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 600;">Verzendadres</div>
                  <div style="color: #111827; font-size: 14px; line-height: 1.6;">
                    ${order.shipping_address.street}<br/>
                    ${order.shipping_address.postal_code} ${order.shipping_address.city}<br/>
                    ${order.shipping_address.country}
                  </div>
                </div>
              </div>
              
              <!-- Order Items -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Bestelde Producten</h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                      <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Product</th>
                      <th style="padding: 12px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Aantal</th>
                      <th style="padding: 12px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Prijs</th>
                      <th style="padding: 12px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                </table>
              </div>
              
              <!-- Totals -->
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; text-align: right; color: #6b7280; font-size: 14px;">Subtotaal:</td>
                    <td style="padding: 6px 0; text-align: right; width: 120px; color: #111827; font-size: 14px;">€${order.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; text-align: right; color: #6b7280; font-size: 14px;">Verzendkosten:</td>
                    <td style="padding: 6px 0; text-align: right; color: #111827; font-size: 14px;">€${order.shipping_cost.toFixed(2)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 12px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #111827;">Totaal (incl. BTW):</td>
                    <td style="padding: 12px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #10b981;">€${order.total.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Action Required -->
              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin-top: 24px;">
                <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">Actie vereist</div>
                <div style="color: #1e40af; font-size: 14px; line-height: 1.5;">
                  Log in op het admin dashboard om deze bestelling te verwerken en de klant op de hoogte te houden.
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                Dit is een automatische notificatie van het Cultheld Order Systeem
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
          message: 'Email system not configured. Admin notification would be sent in production.' 
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

    const emailHTML = generateAdminNotificationHTML(orderData);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Cultheld Order System <orders@cultheld.nl>',
        to: [ADMIN_EMAIL],
        subject: `📦 Nieuwe Bestelling: ${orderData.order_number}`,
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
    console.error('Error sending admin notification:', error);
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