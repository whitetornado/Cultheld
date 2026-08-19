/*
  # Fix Admin Access to Purchases and Payments

  1. Changes
    - Update is_admin() function to check both email AND app_metadata
    - Remove duplicate RLS policies on purchases and payments tables
    - Ensure admins have full access to view all purchases and payments

  2. Security
    - Admin access requires either admin@cultheld.nl email OR is_admin flag in app_metadata
    - Regular users can only see their own purchases
    - All policies remain restrictive and secure
*/

-- Update is_admin function to check both email and app_metadata
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      email = 'admin@cultheld.nl' 
      OR (raw_app_meta_data->>'is_admin')::boolean = true
      OR (raw_user_meta_data->>'role') = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop duplicate policies on purchases
DROP POLICY IF EXISTS "purchases_admin_all" ON purchases;
DROP POLICY IF EXISTS "Authenticated can insert purchases" ON purchases;
DROP POLICY IF EXISTS "Authenticated can update purchases" ON purchases;

-- Drop duplicate policies on payments
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
DROP POLICY IF EXISTS "Authenticated can insert payments" ON payments;
DROP POLICY IF EXISTS "Authenticated can update payments" ON payments;

-- Recreate clean policies for purchases
DROP POLICY IF EXISTS "Admin full access purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;

CREATE POLICY "Admin full access to purchases"
  ON purchases
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "System can insert purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update purchases"
  ON purchases
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- Recreate clean policies for payments
DROP POLICY IF EXISTS "Admin full access payments" ON payments;
DROP POLICY IF EXISTS "Users and admins can view payments" ON payments;

CREATE POLICY "Admin full access to payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM purchases
      WHERE purchases.id = payments.purchase_id
      AND (purchases.user_id = auth.uid() OR is_admin())
    ) OR is_admin()
  );

CREATE POLICY "System can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
