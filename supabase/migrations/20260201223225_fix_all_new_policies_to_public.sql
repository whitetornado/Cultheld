/*
  # Fix All New Policies to Use Public Role

  ## Summary
  Updates all recently added policies to consistently use TO public instead of
  TO authenticated, anon. This ensures guest checkout works properly.

  ## Changes
  - contact_submissions_tracking: Change INSERT to public
  - payments: Change all policies to public
  - purchases: Change all policies to public

  ## Security Impact
  - No change to actual security
  - Policies still enforce the same access control
  - Ensures guest checkout functionality works
*/

-- Contact Submissions Tracking
DROP POLICY IF EXISTS "System can insert contact tracking" ON contact_submissions_tracking;

CREATE POLICY "System can insert contact tracking" ON contact_submissions_tracking
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Payments: Update all policies to use public
DROP POLICY IF EXISTS "View own or all payments" ON payments;
DROP POLICY IF EXISTS "System can insert payments" ON payments;
DROP POLICY IF EXISTS "System can update payments" ON payments;

CREATE POLICY "View own or all payments" ON payments
  FOR SELECT
  TO public
  USING (
    COALESCE((SELECT is_admin()), false) = true
    OR
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.mollie_payment_id = payments.mollie_payment_id
      AND purchases.customer_email = COALESCE((auth.jwt() ->> 'email'), '')
    )
  );

CREATE POLICY "System can insert payments" ON payments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "System can update payments" ON payments
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Purchases: Update policies to use public
DROP POLICY IF EXISTS "View own or all purchases" ON purchases;
DROP POLICY IF EXISTS "System can insert purchases" ON purchases;

CREATE POLICY "View own or all purchases" ON purchases
  FOR SELECT
  TO public
  USING (
    COALESCE((SELECT is_admin()), false) = true
    OR
    customer_email = COALESCE((auth.jwt() ->> 'email'), '')
    OR
    (
      return_token_hash IS NOT NULL 
      AND return_token_hash = encode(
        digest(
          COALESCE(
            current_setting('request.headers', true)::json->>'x-return-token',
            ''
          ), 
          'sha256'
        ), 
        'hex'
      )
    )
  );

CREATE POLICY "System can insert purchases" ON purchases
  FOR INSERT
  TO public
  WITH CHECK (true);
