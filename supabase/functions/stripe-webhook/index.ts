import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let webhookLogId: string | null = null;

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Stripe secrets not configured');
      return new Response('Configuration error', { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

    const signature = req.headers.get('stripe-signature');
    const rawBody = await req.text();

    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response('Bad request', { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    const { data: logEntry } = await supabase
      .from('webhook_logs')
      .insert({
        stripe_event_id: event.id,
        stripe_event_type: event.type,
        payload: event as unknown as Record<string, unknown>,
        status: 'received',
        received_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logEntry) {
      webhookLogId = logEntry.id;
    }

    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.async_payment_succeeded' &&
      event.type !== 'checkout.session.async_payment_failed' &&
      event.type !== 'checkout.session.expired'
    ) {
      if (webhookLogId) {
        await supabase.from('webhook_logs').update({ status: 'ignored' }).eq('id', webhookLogId);
      }
      return new Response('OK', { status: 200 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseId = session.metadata?.purchase_id;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, purchases(*)')
      .eq('stripe_checkout_session_id', session.id)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('Payment not found for Stripe session:', session.id, purchaseId);
      if (webhookLogId) {
        await supabase.from('webhook_logs').update({ status: 'failed', purchase_id: purchaseId }).eq('id', webhookLogId);
      }
      return new Response('Payment not found', { status: 404 });
    }

    let paymentStatus = 'open';
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      paymentStatus = session.payment_status === 'paid' ? 'paid' : 'pending';
    } else if (event.type === 'checkout.session.async_payment_failed') {
      paymentStatus = 'failed';
    } else if (event.type === 'checkout.session.expired') {
      paymentStatus = 'expired';
    }

    const updateData: Record<string, unknown> = {
      status: paymentStatus,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      webhook_called_at: new Date().toISOString(),
    };

    if (paymentStatus === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    await supabase.from('payments').update(updateData).eq('id', payment.id);

    let purchaseStatus = 'pending_payment';
    if (paymentStatus === 'paid') {
      purchaseStatus = 'paid';
    } else if (['failed', 'expired'].includes(paymentStatus)) {
      purchaseStatus = 'failed';
    }

    await supabase.from('purchases').update({ status: purchaseStatus }).eq('id', payment.purchase_id);

    if (webhookLogId) {
      await supabase
        .from('webhook_logs')
        .update({ status: 'processed', purchase_id: payment.purchase_id })
        .eq('id', webhookLogId);
    }

    if (paymentStatus === 'paid') {
      console.log('Payment completed successfully:', session.id);

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

      try {
        console.log('Sending order confirmation email...');
        const confirmationRes = await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify(orderData),
        });
        console.log('Order confirmation response status:', confirmationRes.status);

        console.log('Sending admin notification email...');
        const adminRes = await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ type: 'new_order', ...orderData }),
        });
        console.log('Admin notification response status:', adminRes.status);

        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        if (!userError && userData?.users) {
          const user = userData.users.find((u) => u.email === payment.purchases.customer_email);

          if (user && user.created_at) {
            const userCreatedAt = new Date(user.created_at).getTime();
            const purchaseCreatedAt = new Date(payment.purchases.created_at).getTime();
            const timeDiffMinutes = (purchaseCreatedAt - userCreatedAt) / 1000 / 60;

            if (timeDiffMinutes < 10 && user.last_sign_in_at === null) {
              console.log('Sending welcome email to new user...');
              await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  email: payment.purchases.customer_email,
                  name: payment.purchases.customer_name,
                  order_number: orderData.order_number,
                }),
              });
            }
          }
        }
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        await supabase.from('webhook_logs').insert({
          stripe_event_id: event.id,
          stripe_event_type: event.type,
          purchase_id: payment.purchase_id,
          payload: { error: emailError instanceof Error ? emailError.message : 'Unknown error', type: 'email_error' },
          status: 'failed',
          received_at: new Date().toISOString(),
        });
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);

    if (webhookLogId) {
      await supabase
        .from('webhook_logs')
        .update({
          status: 'failed',
        })
        .eq('id', webhookLogId);
    }

    return new Response('Internal server error', { status: 500 });
  }
});
