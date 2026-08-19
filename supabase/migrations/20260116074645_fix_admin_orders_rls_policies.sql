/*
  # Fix Admin Orders RLS Policies

  1. Security Updates
    - Add SELECT policy for admins to view all orders
    - Add DELETE policy for admins to delete orders
    - Update existing policies to check both app_metadata and user_metadata for role

  2. Changes
    - New policy: "Admins can view all orders" (SELECT)
    - New policy: "Admins can delete orders" (DELETE)
    - Update: "Users can view own orders" to also check for admin role
*/

-- Drop existing policies to recreate them with better logic
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- Allow users to view their own orders OR admins to view all orders
CREATE POLICY "Users can view own orders or admins view all"
  ON orders FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    COALESCE(
      (auth.jwt()->>'app_metadata')::jsonb->>'role',
      (auth.jwt()->>'user_metadata')::jsonb->>'role'
    ) = 'admin'
  );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
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

-- Admins can delete orders
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'app_metadata')::jsonb->>'role',
      (auth.jwt()->>'user_metadata')::jsonb->>'role'
    ) = 'admin'
  );

-- Same for order_items
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;

CREATE POLICY "Users can view own order items or admins view all"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid() OR
        COALESCE(
          (auth.jwt()->>'app_metadata')::jsonb->>'role',
          (auth.jwt()->>'user_metadata')::jsonb->>'role'
        ) = 'admin'
      )
    )
  );

CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE
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

CREATE POLICY "Admins can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'app_metadata')::jsonb->>'role',
      (auth.jwt()->>'user_metadata')::jsonb->>'role'
    ) = 'admin'
  );

-- Same for order_status_history
DROP POLICY IF EXISTS "Users can view own order history" ON order_status_history;

CREATE POLICY "Users can view own order history or admins view all"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND (
        orders.user_id = auth.uid() OR
        COALESCE(
          (auth.jwt()->>'app_metadata')::jsonb->>'role',
          (auth.jwt()->>'user_metadata')::jsonb->>'role'
        ) = 'admin'
      )
    )
  );
