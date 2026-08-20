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

    // A PaymentIntent's client_secret stays valid for the lifetime of the
    // intent — re-fetch it from Stripe on every resume instead of storing it,
    // so it always reflects the intent's current (possibly updated) state.
    // If the intent has since succeeded/canceled, fall through and create a
    // fresh one below.
    if (existingPayment && existingPayment.stripe_payment_intent_id) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(
          existingPayment.stripe_payment_intent_id
        );

        if (
          (existingIntent.status === 'requires_payment_method' ||
            existingIntent.status === 'requires_confirmation' ||
            existingIntent.status === 'requires_action') &&
          existingIntent.client_secret
        ) {
          return new Response(
            JSON.stringify({
              payment: existingPayment,
              client_secret: existingIntent.client_secret,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (err) {
        console.warn('Could not retrieve existing Stripe payment intent, creating a new one:', err);
      }
    }

    await supabase.from('purchases').update({ status: 'pending_payment' }).eq('id', purchase_id);

    const metadata = purchase.metadata || {};
    const items: any[] = Array.isArray(metadata.items) ? metadata.items : [];
    const currency = (purchase.currency || 'EUR').toLowerCase();

    // The Payment Element needs a single total amount rather than Checkout's
    // per-line-item list — the per-item math is kept identical to before,
    // just summed instead of turned into Stripe line items.
    const itemsAmount = items.length > 0
      ? items.reduce((sum, item) => {
          const unitAmount = Math.round(parseFloat(item.unit_price || '0') * 100);
          const quantity = item.quantity || 1;
          return sum + unitAmount * quantity;
        }, 0)
      : Math.round(parseFloat(purchase.amount_value || '0') * 100);

    const shippingCost = parseFloat(metadata.shipping_cost || '0');
    const shippingAmount = shippingCost > 0 ? Math.round(shippingCost * 100) : 0;
    const amount = itemsAmount + shippingAmount;

    // Payment Element renders and confirms entirely on cultheld.nl — no
    // cancel_url or hosted-page redirect. return_url is only used for
    // redirect-based methods (iDEAL, Bancontact) once the bank hop completes,
    // and is built client-side from window.location.origin so it naturally
    // matches whichever environment (localhost or production) started the
    // checkout.
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      receipt_email: purchase.customer_email || undefined,
      metadata: { purchase_id },
    });

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        purchase_id,
        stripe_payment_intent_id: paymentIntent.id,
        // checkout_url is NOT NULL in the payments table — Payment Element
        // has no separate hosted page, so '' is stored instead of a real URL.
        checkout_url: '',
        amount_value: purchase.amount_value,
        currency: purchase.currency,
        status: paymentIntent.status === 'succeeded' ? 'paid' : 'open',
        metadata: { stripe_payment_intent_id: paymentIntent.id },
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
      JSON.stringify({ payment, client_secret: paymentIntent.client_secret }),
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
