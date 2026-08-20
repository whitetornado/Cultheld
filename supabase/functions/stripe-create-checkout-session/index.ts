import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || supabaseUrl.replace('.supabase.co', '.vercel.app');

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let user = null;

    if (authHeader) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();

      if (!authError && authUser) {
        user = authUser;
        console.log('Authenticated user payment:', user.id);
      } else {
        console.log('Auth header present but invalid, proceeding as guest');
      }
    } else {
      console.log('No auth header, proceeding as guest payment');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { purchase_id, return_token } = body;

    if (!purchase_id) {
      return new Response(
        JSON.stringify({ error: 'Missing purchase_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!return_token) {
      return new Response(
        JSON.stringify({ error: 'Missing return_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(return_token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const returnTokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    let purchaseQuery = supabase
      .from('purchases')
      .select('*')
      .eq('id', purchase_id)
      .eq('return_token_hash', returnTokenHash);

    if (user) {
      purchaseQuery = purchaseQuery.eq('user_id', user.id);
    }

    const { data: purchase, error: purchaseError } = await purchaseQuery.single();

    if (purchaseError || !purchase) {
      return new Response(
        JSON.stringify({ error: 'Purchase not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('purchase_id', purchase_id)
      .in('status', ['open', 'pending', 'unpaid'])
      .maybeSingle();

    if (existingPayment && existingPayment.checkout_url) {
      return new Response(
        JSON.stringify({
          payment: existingPayment,
          checkout_url: existingPayment.checkout_url,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('purchases').update({ status: 'pending_payment' }).eq('id', purchase_id);

    const metadata = purchase.metadata || {};
    const items: any[] = Array.isArray(metadata.items) ? metadata.items : [];
    const currency = (purchase.currency || 'EUR').toLowerCase();

    const lineItems = items.length > 0
      ? items.map((item) => {
          const unitAmount = Math.round(parseFloat(item.unit_price || '0') * 100);
          const name = [item.legend_name, item.product_type_name].filter(Boolean).join(' — ') || 'Cultheld product';
          const descriptionParts = [item.color_name, item.size].filter(Boolean);
          return {
            price_data: {
              currency,
              unit_amount: unitAmount,
              product_data: {
                name,
                description: descriptionParts.length ? descriptionParts.join(' / ') : undefined,
              },
            },
            quantity: item.quantity || 1,
          };
        })
      : [
          {
            price_data: {
              currency,
              unit_amount: Math.round(parseFloat(purchase.amount_value || '0') * 100),
              product_data: { name: purchase.product_name || 'Cultheld bestelling' },
            },
            quantity: 1,
          },
        ];

    const shippingCost = parseFloat(metadata.shipping_cost || '0');
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency,
          unit_amount: Math.round(shippingCost * 100),
          product_data: { name: 'Verzendkosten' },
        },
        quantity: 1,
      });
    }

    const successUrl = `${appBaseUrl}/payment/return?purchase_id=${purchase_id}&token=${return_token}&session_id={CHECKOUT_SESSION_ID}`;
    // Send a cancelled checkout to the same status page (instead of back to
    // an empty /checkout) so the customer sees a clear "cancelled" state and
    // can pick up their still-filled cart from there.
    const cancelUrl = `${appBaseUrl}/payment/return?purchase_id=${purchase_id}&token=${return_token}&canceled=true`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: purchase.customer_email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { purchase_id },
      payment_intent_data: { metadata: { purchase_id } },
    });

    await supabase
      .from('purchases')
      .update({ status: 'pending_payment' })
      .eq('id', purchase_id);

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        purchase_id,
        stripe_checkout_session_id: session.id,
        checkout_url: session.url,
        amount_value: purchase.amount_value,
        currency: purchase.currency,
        status: session.payment_status === 'paid' ? 'paid' : 'open',
        metadata: { stripe_session_id: session.id },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ payment, checkout_url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
