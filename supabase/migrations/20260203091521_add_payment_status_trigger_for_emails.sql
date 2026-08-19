/*
  # Add automatic email sending on payment status change

  1. New Function
    - `send_order_emails_on_payment_paid()` - Trigger function that sends order confirmation emails when a payment is marked as paid

  2. New Trigger
    - Automatically sends order confirmation and admin notification emails when payment status changes to 'paid'

  3. Changes
    - Adds a backup mechanism to send emails even if Mollie webhook fails
    - Ensures customers always receive order confirmations

  ## Security
    - Uses service role to call edge functions
    - Only triggers on paid status
*/

-- Create function to send order emails when payment is marked as paid
CREATE OR REPLACE FUNCTION send_order_emails_on_payment_paid()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_purchase RECORD;
  v_metadata JSONB;
  v_order_data JSONB;
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Only proceed if status changed to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    
    -- Get purchase details
    SELECT * INTO v_purchase
    FROM purchases
    WHERE id = NEW.purchase_id;

    IF v_purchase IS NULL THEN
      RAISE WARNING 'Purchase not found for payment %', NEW.id;
      RETURN NEW;
    END IF;

    -- Get metadata
    v_metadata := COALESCE(v_purchase.metadata, '{}'::jsonb);

    -- Build order data for email
    v_order_data := jsonb_build_object(
      'order_number', UPPER(substring(v_purchase.id::text, 1, 8)),
      'customer_email', v_purchase.customer_email,
      'customer_name', v_purchase.customer_name,
      'customer_phone', COALESCE(v_metadata->>'customer_phone', ''),
      'shipping_address', COALESCE(v_metadata->'shipping_address', '{}'::jsonb),
      'subtotal', COALESCE((v_metadata->>'subtotal')::decimal, 0),
      'shipping_cost', COALESCE((v_metadata->>'shipping_cost')::decimal, 0),
      'total', COALESCE((v_metadata->>'total')::decimal, v_purchase.amount_value::decimal),
      'items', COALESCE(v_metadata->'items', '[]'::jsonb)
    );

    -- Get Supabase URL from env
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.service_role_key', true);

    -- If not set via app.settings, use default patterns
    IF v_supabase_url IS NULL THEN
      v_supabase_url := 'https://kraszqrhydhhkknyapxa.supabase.co';
    END IF;

    -- Send order confirmation via pg_net (async HTTP request)
    PERFORM
      net.http_post(
        url := v_supabase_url || '/functions/v1/send-order-confirmation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(v_service_key, current_setting('app.settings.supabase_service_role_key', true))
        ),
        body := v_order_data::jsonb
      );

    -- Send admin notification
    PERFORM
      net.http_post(
        url := v_supabase_url || '/functions/v1/send-admin-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(v_service_key, current_setting('app.settings.supabase_service_role_key', true))
        ),
        body := jsonb_build_object(
          'type', 'new_order'
        ) || v_order_data
      );

    RAISE LOG 'Order emails triggered for payment % (purchase %)', NEW.id, v_purchase.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on payments table
DROP TRIGGER IF EXISTS trigger_send_order_emails_on_paid ON payments;
CREATE TRIGGER trigger_send_order_emails_on_paid
  AFTER UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION send_order_emails_on_payment_paid();

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
