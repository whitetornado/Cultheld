/*
  # Fix Admin Access to View All Payments
  
  Updates the "Users can view own payments" policy to also allow admins
  to view all payments, including those from guest purchases.
  
  Changes:
  - Drop the old restrictive SELECT policy on payments
  - Create new policy that allows users to view their own payments AND admins to view all payments
*/

-- Drop old policy
DROP POLICY IF EXISTS "Users can view own payments" ON payments;

-- Create new policy that includes admin check
CREATE POLICY "Users and admins can view payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see payments for their own purchases
    EXISTS (
      SELECT 1
      FROM purchases
      WHERE purchases.id = payments.purchase_id
      AND purchases.user_id = auth.uid()
    )
    OR
    -- Admins can see all payments
    is_admin()
  );
