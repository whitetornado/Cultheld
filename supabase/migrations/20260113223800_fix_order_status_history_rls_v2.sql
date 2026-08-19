/*
  # Fix Order Status History RLS Policies v2
  
  ## Changes
  - Drop old admin role-based policies
  - Create new policies matching the admin pattern used elsewhere
  - Check for admin@cultheld.nl email or admin role in JWT
  
  ## Security
  - Only admin users can access order status history
  - Matches existing admin policy pattern in the system
*/

-- Drop old policies
DROP POLICY IF EXISTS "Admins can view order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can insert order status history" ON order_status_history;

-- Create new admin-based policies matching system pattern
CREATE POLICY "Admins can view order status history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can insert order status history"
  ON order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can update order status history"
  ON order_status_history FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can delete order status history"
  ON order_status_history FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );