import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { payment_id, purchase_id } = await req.json();

    if (!payment_id && !purchase_id) {
      return new Response(
        JSON.stringify({ error: 'payment_id or purchase_id required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let query = supabase
      .from('payments')
      .select('*, purchases(*)');

    if (payment_id) {
      query = query.eq('id', payment_id);
    } else {
      query = query.eq('purchase_id', purchase_id);
    }

    const { data: payment, error: paymentError } = await query.single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (payment.status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Payment is not paid yet' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const metadata = payment.purchases?.metadata || {};
    const items = metadata.items || [];

    const orderData = {
      order_number: payment.purchase_id.substring(0, 8).toUpperCase(),
      customer_email: payment.purchases.customer_email,
      customer_name: payment.purchases.customer_name,
      customer_phone: metadata.customer_phone || '',
      shipping_address: metadata.shipping_address || {},
      subtotal: parseFloat(metadata.subtotal || '0'),
      shipping_cost: parseFloat(metadata.shipping_cost || '0'),
      total: parseFloat(metadata.total || payment.purchases.amount_value || '0'),
      items: items.map((item: any) => ({
        legend_name: item.legend_name || '',
        product_type_name: item.product_type_name || '',
        color_name: item.color_name || '',
        size: item.size || '',
        quantity: item.quantity || 1,
        unit_price: parseFloat(item.unit_price || '0'),
        total_price: parseFloat(item.total_price || '0'),
        mockup_preview_url: item.mockup_preview_url || '',
      })),
    };

    console.log('Sending order confirmation email for payment:', payment.id);

    const confirmationRes = await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(orderData),
    });

    const confirmationData = await confirmationRes.json();
    console.log('Order confirmation response:', confirmationData);

    console.log('Sending admin notification email...');

    const adminRes = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        type: 'new_order',
        ...orderData,
      }),
    });

    const adminData = await adminRes.json();
    console.log('Admin notification response:', adminData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order confirmation emails sent',
        confirmation: confirmationData,
        admin: adminData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
