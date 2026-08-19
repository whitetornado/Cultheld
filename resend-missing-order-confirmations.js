import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resendOrderConfirmations() {
  console.log('Finding paid payments without order confirmation emails...\n');

  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, purchase_id, mollie_payment_id, status')
    .eq('status', 'paid')
    .is('webhook_called_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    return;
  }

  if (!payments || payments.length === 0) {
    console.log('No payments found that need order confirmation emails.');
    return;
  }

  console.log(`Found ${payments.length} payment(s) that need order confirmation emails:\n`);

  for (const payment of payments) {
    console.log(`Processing payment ${payment.id}...`);
    console.log(`  - Mollie Payment ID: ${payment.mollie_payment_id}`);
    console.log(`  - Purchase ID: ${payment.purchase_id}`);

    try {
      const { data, error } = await supabase.functions.invoke('resend-order-confirmation', {
        body: { payment_id: payment.id }
      });

      if (error) {
        console.error(`  ✗ Failed: ${error.message}\n`);
      } else {
        console.log(`  ✓ Success: Order confirmation emails sent\n`);
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}\n`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('Done!');
}

resendOrderConfirmations();
