/*
  # Enhance Orders Table for Email System

  ## Changes Made
  
  1. Add missing fields to `orders` table:
     - `customer_phone` - Customer phone number
     - `billing_address` - Billing address (if different from shipping)
     - `tax` - Tax amount
     - `payment_status` - Separate from order status
     - `payment_method` - Payment method used
     - `notes` - Order notes
     - `updated_at` - Track updates
  
  2. Add missing fields to `order_items` table:
     - `legend_id` - Reference to legend
     - `product_variant_id` - Reference to variant
     - `product_type_name` - Snapshot of product type
     - `mockup_preview_url` - Generated preview URL
  
  3. Update functions:
     - Add order number generator if not exists
     - Add updated_at trigger
*/

-- Add missing columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'billing_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN billing_address jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tax'
  ) THEN
    ALTER TABLE orders ADD COLUMN tax numeric(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add missing columns to order_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'legend_id'
  ) THEN
    ALTER TABLE order_items ADD COLUMN legend_id uuid REFERENCES legends(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'product_variant_id'
  ) THEN
    ALTER TABLE order_items ADD COLUMN product_variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'product_type_name'
  ) THEN
    ALTER TABLE order_items ADD COLUMN product_type_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'mockup_preview_url'
  ) THEN
    ALTER TABLE order_items ADD COLUMN mockup_preview_url text;
  END IF;
END $$;

-- Create order number generator function if not exists
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  today_date text;
  order_count integer;
  new_order_number text;
BEGIN
  today_date := to_char(now(), 'YYYYMMDD');
  
  SELECT COUNT(*) INTO order_count
  FROM orders
  WHERE order_number LIKE 'ORD-' || today_date || '-%';
  
  new_order_number := 'ORD-' || today_date || '-' || LPAD((order_count + 1)::text, 4, '0');
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
