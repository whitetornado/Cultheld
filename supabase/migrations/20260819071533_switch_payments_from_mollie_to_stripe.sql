/*
  # Switch payment provider from Mollie to Stripe

  1. Changes to `payments`
    - Add `stripe_checkout_session_id` (text, unique) — Stripe Checkout Session ID
    - Add `stripe_payment_intent_id` (text) — Stripe PaymentIntent ID, set once payment succeeds
    - Make `mollie_payment_id` nullable (kept for historical orders, no longer written to)
    - Add index on `stripe_checkout_session_id` for webhook lookups

  2. Notes
    - Existing rows are untouched; `mollie_payment_id` stays populated for old orders.
    - New orders are created exclusively through the Stripe edge functions and will have
      `stripe_checkout_session_id` / `stripe_payment_intent_id` set instead.
*/

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'mollie_payment_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE payments ALTER COLUMN mollie_payment_id DROP NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id
  ON payments(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id
  ON payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- webhook_logs: log Stripe events (event id + type) alongside the legacy Mollie column
ALTER TABLE webhook_logs
  ADD COLUMN IF NOT EXISTS stripe_event_id text,
  ADD COLUMN IF NOT EXISTS stripe_event_type text;

CREATE INDEX IF NOT EXISTS idx_webhook_logs_stripe_event_id ON webhook_logs(stripe_event_id);
