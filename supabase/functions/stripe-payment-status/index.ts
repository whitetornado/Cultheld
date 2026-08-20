import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function syncPaymentWithStripe(stripe: Stripe, supabase: any, payment: any) {
  if (!payment || !payment.stripe_payment_intent_id) {
    return { synced: false, error: 'No payment or stripe_payment_intent_id' };
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
    const currentStatus = payment.status;

    let newStatus = currentStatus;
    if (intent.status === 'succeeded') {
      newStatus = 'paid';
    } else if (intent.status === 'canceled') {
      newStatus = 'canceled';
    } else if (intent.status === 'processing') {
      newStatus = 'pending';
    } else if (
      intent.status === 'requires_payment_method' ||
      intent.status === 'requires_confirmation' ||
      intent.status === 'requires_action'
    ) {
      newStatus = 'open';
    }

    if (newStatus !== currentStatus) {
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      await supabase.from('payments').update(updates).eq('id', payment.id);

      const purchaseStatus =
        newStatus === 'paid' ? 'paid' : newStatus === 'canceled' ? 'failed' : 'pending_payment';

      await supabase
        .from('purchases')
        .update({ status: purchaseStatus, updated_at: new Date().toISOString() })
        .eq('id', payment.purchase_id);

      console.log(`Payment ${payment.id} synced: ${currentStatus} -> ${newStatus}`);
    }

    return {
      synced: true,
      payment_status: newStatus,
      status_changed: newStatus !== currentStatus,
    };
  } catch (error) {
    console.error('Error syncing with Stripe:', error);
    return { synced: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

    const url = new URL(req.url);
    const purchaseId = url.searchParams.get('purchase_id');
    const returnToken = url.searchParams.get('token');

    if (!purchaseId) {
      return new Response(
        JSON.stringify({ error: 'Missing purchase_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let purchase;

    if (returnToken) {
      const encoder = new TextEncoder();
      const data = encoder.encode(returnToken);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const returnTokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const { data: tokenPurchase } = await supabase
        .from('purchases')
        .select('id, status, amount_value, currency, customer_email, created_at')
        .eq('id', purchaseId)
        .eq('return_token_hash', returnTokenHash)
        .single();

      if (tokenPurchase) {
        const createdAt = new Date(tokenPurchase.created_at);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        if (timeDiffMinutes <= 60) {
          purchase = tokenPurchase;
        }
      }
    }

    if (!purchase) {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'No authorization header or invalid token', error_code: 'auth_missing' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', error_code: 'auth_invalid', details: authError?.message }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: userPurchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', purchaseId)
        .eq('user_id', user.id)
        .single();

      if (purchaseError || !userPurchase) {
        return new Response(
          JSON.stringify({ error: 'Purchase not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      purchase = userPurchase;
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('purchase_id', purchaseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let syncResult = null;
    if (payment) {
      syncResult = await syncPaymentWithStripe(stripe, supabase, payment);

      if (syncResult.synced && syncResult.status_changed) {
        const { data: updatedPayment } = await supabase.from('payments').select('*').eq('id', payment.id).single();
        if (updatedPayment) Object.assign(payment, updatedPayment);

        const { data: updatedPurchase } = await supabase.from('purchases').select('*').eq('id', purchaseId).single();
        if (updatedPurchase) Object.assign(purchase, updatedPurchase);
      }
    }

    return new Response(
      JSON.stringify({
        purchase,
        payment: payment || null,
        payment_status: syncResult?.payment_status || payment?.status || null,
        last_synced_at: new Date().toISOString(),
        sync_result: syncResult,
      }),
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
