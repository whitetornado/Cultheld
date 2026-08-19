/*
  # Complete Order & Payment System Schema

  ## Nieuwe tabellen
  - `webhook_logs` - Voor diagnose van Mollie webhook calls
  
  ## Updates aan purchases tabel
  - `product_slug` - Slug van het product
  - `product_name` - Naam van het product (denormalized voor order history)
  - `mollie_payment_id` - Direct link naar Mollie payment
  
  ## RLS Policies
  - Customers kunnen eigen purchases en payments bekijken
  - Admins kunnen alles bekijken
  - Webhook logs zijn alleen voor admins
*/

-- Create webhook_logs table for diagnostics
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mollie_payment_id text,
  purchase_id uuid REFERENCES purchases(id),
  received_at timestamptz DEFAULT now(),
  status text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to purchases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'product_slug'
  ) THEN
    ALTER TABLE purchases ADD COLUMN product_slug text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'product_name'
  ) THEN
    ALTER TABLE purchases ADD COLUMN product_name text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'mollie_payment_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN mollie_payment_id text;
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_mollie_payment_id ON webhook_logs(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_purchase_id ON webhook_logs(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchases_mollie_payment_id ON purchases(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_logs (admin only)
DROP POLICY IF EXISTS "Admins can view all webhook logs" ON webhook_logs;
CREATE POLICY "Admins can view all webhook logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_app_meta_data->>'is_admin' = 'true' FROM auth.users WHERE id = auth.uid())
    OR
    (SELECT email = 'admin@cultheld.nl' FROM auth.users WHERE id = auth.uid())
  );

-- Update existing purchases RLS policies to include admins
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (SELECT raw_app_meta_data->>'is_admin' = 'true' FROM auth.users WHERE id = auth.uid())
    OR
    (SELECT email = 'admin@cultheld.nl' FROM auth.users WHERE id = auth.uid())
  );

-- Update payments RLS to include admins  
DROP POLICY IF EXISTS "Users can view related payments" ON payments;
CREATE POLICY "Users can view related payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    purchase_id IN (SELECT id FROM purchases WHERE user_id = auth.uid())
    OR
    (SELECT raw_app_meta_data->>'is_admin' = 'true' FROM auth.users WHERE id = auth.uid())
    OR
    (SELECT email = 'admin@cultheld.nl' FROM auth.users WHERE id = auth.uid())
  );

-- Update customer_profiles RLS to include admins (view)
DROP POLICY IF EXISTS "Users can view own profile" ON customer_profiles;
CREATE POLICY "Users can view own profile"
  ON customer_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (SELECT raw_app_meta_data->>'is_admin' = 'true' FROM auth.users WHERE id = auth.uid())
    OR
    (SELECT email = 'admin@cultheld.nl' FROM auth.users WHERE id = auth.uid())
  );
