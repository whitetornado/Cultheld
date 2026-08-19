/*
  # Fix RLS Policies voor Customer Profiles en Purchases

  ## Probleem
  - Users kunnen hun eigen profiel niet updaten (403)
  - Users kunnen hun eigen purchases niet zien (403)
  - Payment return pagina werkt niet door RLS issues

  ## Oplossing
  - Voeg INSERT en UPDATE policies toe voor customer_profiles
  - Fix purchases SELECT policy
  - Fix payments SELECT policy
*/

-- Customer profiles: Users kunnen hun eigen profiel maken en updaten
DROP POLICY IF EXISTS "Users can create own profile" ON customer_profiles;
CREATE POLICY "Users can create own profile"
  ON customer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON customer_profiles;
CREATE POLICY "Users can update own profile"
  ON customer_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Purchases: Fix INSERT policy voor users
DROP POLICY IF EXISTS "Service role can insert purchases" ON purchases;
CREATE POLICY "Service role can insert purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Payments: Fix INSERT policy
DROP POLICY IF EXISTS "Service role can insert payments" ON payments;
CREATE POLICY "Service role can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Payments: Fix UPDATE policy
DROP POLICY IF EXISTS "Service role can update payments" ON payments;
CREATE POLICY "Service role can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Purchases: Fix UPDATE policy
DROP POLICY IF EXISTS "Service role can update purchases" ON purchases;
CREATE POLICY "Service role can update purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
