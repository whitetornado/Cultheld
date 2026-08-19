/*
  # Mollie Payment System

  1. New Tables
    - `products` - Products available for purchase
      - `id` (uuid, primary key)
      - `slug` (text, unique) - Product identifier
      - `name` (text) - Product name
      - `description` (text) - Product description
      - `amount_value` (text) - Price as "xx.xx" string format
      - `currency` (text) - Currency code (EUR)
      - `metadata` (jsonb) - Additional product data
      - `active` (boolean) - Whether product is available
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `purchases` - Customer purchases/orders
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable) - Reference to auth.users
      - `product_id` (uuid) - Reference to products
      - `customer_email` (text) - Customer email
      - `customer_name` (text) - Customer name
      - `amount_value` (text) - Purchase amount as "xx.xx"
      - `currency` (text) - Currency code
      - `status` (text) - Purchase status (created, pending_payment, paid, failed, cancelled)
      - `metadata` (jsonb) - Additional purchase data (legend, size, color, etc)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payments` - Mollie payment records
      - `id` (uuid, primary key)
      - `purchase_id` (uuid) - Reference to purchases
      - `mollie_payment_id` (text, unique) - Mollie payment ID
      - `checkout_url` (text) - Mollie checkout URL
      - `amount_value` (text) - Payment amount as "xx.xx"
      - `currency` (text) - Currency code
      - `status` (text) - Payment status (open, paid, failed, cancelled, expired)
      - `method` (text, nullable) - Payment method used
      - `webhook_called_at` (timestamptz, nullable) - When webhook was called
      - `paid_at` (timestamptz, nullable) - When payment was completed
      - `metadata` (jsonb) - Additional payment data
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can view their own purchases and payments
    - Admins can view all purchases and payments
    - Only authenticated users can create purchases
    - Only service role can update payments (via webhook)

  3. Indexes
    - Index on purchases.user_id for faster queries
    - Index on purchases.status for filtering
    - Index on payments.mollie_payment_id for webhook lookups
    - Index on payments.purchase_id for joins
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  amount_value text NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  metadata jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'app_metadata')::jsonb->>'role',
      (auth.jwt()->>'user_metadata')::jsonb->>'role'
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt()->>'app_metadata')::jsonb->>'role',
      (auth.jwt()->>'user_metadata')::jsonb->>'role'
    ) = 'admin'
  );

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  amount_value text NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'created',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    COALESCE(
      (auth.jwt()->>'app_metadata')::jsonb->>'role',
      (auth.jwt()->>'user_metadata')::jsonb->>'role'
    ) = 'admin'
  );

CREATE POLICY "Authenticated users can create purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

CREATE POLICY "Admins can update purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'app_metadata')::jsonb->>'role',
      (auth.jwt()->>'user_metadata')::jsonb->>'role'
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt()->>'app_metadata')::jsonb->>'role',
      (auth.jwt()->>'user_metadata')::jsonb->>'role'
    ) = 'admin'
  );

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  mollie_payment_id text UNIQUE NOT NULL,
  checkout_url text NOT NULL,
  amount_value text NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'open',
  method text,
  webhook_called_at timestamptz,
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments for own purchases"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = payments.purchase_id
      AND (
        purchases.user_id = auth.uid() OR
        COALESCE(
          (auth.jwt()->>'app_metadata')::jsonb->>'role',
          (auth.jwt()->>'user_metadata')::jsonb->>'role'
        ) = 'admin'
      )
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_payments_mollie_id ON payments(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
