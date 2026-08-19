/*
  # Add Webhook Logging System

  1. New Tables
    - `webhook_logs` - Logs all webhook calls from Mollie
      - `id` (uuid, primary key)
      - `mollie_payment_id` (text) - Mollie payment ID from webhook
      - `event_type` (text) - Type of event (payment.paid, payment.failed, etc.)
      - `payload` (jsonb) - Full webhook payload
      - `status` (text) - Processing status (received, processed, failed)
      - `error_message` (text, nullable) - Error message if processing failed
      - `processed_at` (timestamptz, nullable) - When the webhook was processed
      - `created_at` (timestamptz) - When webhook was received

  2. Security
    - Enable RLS on webhook_logs table
    - Only admins can view webhook logs
    - Service role can insert logs (for webhook processing)

  3. Indexes
    - Index on mollie_payment_id for quick lookups
    - Index on created_at for chronological queries
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mollie_payment_id text,
  event_type text,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'app_metadata')::jsonb->>'role',
      (auth.jwt()->>'user_metadata')::jsonb->>'role'
    ) = 'admin'
  );

CREATE INDEX IF NOT EXISTS idx_webhook_logs_mollie_payment_id ON webhook_logs(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
