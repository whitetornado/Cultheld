/*
  # Enhanced Order Management System

  ## 1. Tables Enhancements
  
  ### `orders` table additions:
  - `tracking_number` - Shipping carrier tracking number
  - `carrier` - Shipping carrier name (PostNL, DHL, etc.)
  - `shipped_at` - Timestamp when order was shipped
  - `delivered_at` - Timestamp when order was delivered
  - `cancelled_at` - Timestamp when order was cancelled
  - `cancelled_reason` - Reason for cancellation
  - `admin_notes` - Internal notes for admins
  
  ### New `order_status_history` table:
  - Track all status changes with timestamps
  - Store who made the change
  - Store notes/reasons for changes
  
  ### New `customers` view:
  - Virtual view aggregating customer data from orders
  
  ## 2. Security
  - RLS policies for order status history
  - Admin-only access to management features

  ## 3. Functions
  - Function to update order status with history logging
  - Function to get customer order history
*/

-- Add tracking and status fields to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'carrier'
  ) THEN
    ALTER TABLE orders ADD COLUMN carrier text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipped_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipped_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivered_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN cancelled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'cancelled_reason'
  ) THEN
    ALTER TABLE orders ADD COLUMN cancelled_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN admin_notes text;
  END IF;
END $$;

-- Create order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create index for fast order history lookup
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- Enable RLS on order status history
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Admin policies for order status history
CREATE POLICY "Admins can view order status history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Admins can insert order status history"
  ON order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
  );

-- Create customers view
CREATE OR REPLACE VIEW customers_summary AS
SELECT 
  customer_email,
  customer_name,
  COUNT(DISTINCT id) as total_orders,
  SUM(total) as total_spent,
  MAX(created_at) as last_order_date,
  MIN(created_at) as first_order_date
FROM orders
GROUP BY customer_email, customer_name;

-- Function to update order status with history
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_notes text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_old_status text;
  v_user_id uuid;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status
  FROM orders
  WHERE id = p_order_id;
  
  -- Get current user
  v_user_id := auth.uid();
  
  -- Update order status
  UPDATE orders
  SET status = p_new_status,
      updated_at = now(),
      shipped_at = CASE WHEN p_new_status = 'shipped' AND shipped_at IS NULL THEN now() ELSE shipped_at END,
      delivered_at = CASE WHEN p_new_status = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END,
      cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN now() ELSE cancelled_at END
  WHERE id = p_order_id;
  
  -- Log status change
  INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
  VALUES (p_order_id, v_old_status, p_new_status, v_user_id, p_notes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer order history
CREATE OR REPLACE FUNCTION get_customer_orders(p_customer_email text)
RETURNS TABLE (
  order_id uuid,
  order_number text,
  order_date timestamptz,
  status text,
  total numeric,
  item_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.created_at,
    o.status,
    o.total,
    COUNT(oi.id) as item_count
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE o.customer_email = p_customer_email
  GROUP BY o.id, o.order_number, o.created_at, o.status, o.total
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add tracking number index for quick lookup
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);

-- Add carrier index
CREATE INDEX IF NOT EXISTS idx_orders_carrier ON orders(carrier);
