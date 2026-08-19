/*
  # Fix All RLS Policies V3

  ## Probleem
  - 403 errors op customer_profiles en purchases
  - Policies werken niet correct met REST API
  - Admin kan orders niet zien

  ## Oplossing
  - Verwijder ALLE bestaande policies
  - Maak nieuwe eenvoudige policies die correct werken
  - Test met zowel authenticated users als admins
*/

-- ============================================
-- CUSTOMER_PROFILES
-- ============================================
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users manage own profile" ON customer_profiles;

-- Users kunnen hun eigen profiel zien
CREATE POLICY "Allow users to view own profile"
  ON customer_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'admin@cultheld.nl')
  );

-- Users kunnen hun eigen profiel aanmaken
CREATE POLICY "Allow users to create own profile"
  ON customer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users kunnen hun eigen profiel updaten
CREATE POLICY "Allow users to update own profile"
  ON customer_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'admin@cultheld.nl')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'admin@cultheld.nl')
  );

-- ============================================
-- PURCHASES
-- ============================================
DROP POLICY IF EXISTS "Anyone authenticated can create purchases" ON purchases;
DROP POLICY IF EXISTS "Users can select own purchases" ON purchases;
DROP POLICY IF EXISTS "Users view own purchases" ON purchases;
DROP POLICY IF EXISTS "Anyone authenticated can update purchases" ON purchases;

-- Edge functions kunnen purchases aanmaken
CREATE POLICY "Allow authenticated to create purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users kunnen eigen purchases zien, admin alles
CREATE POLICY "Allow users to view own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'admin@cultheld.nl')
  );

-- Edge functions kunnen purchases updaten
CREATE POLICY "Allow authenticated to update purchases"
  ON purchases
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PAYMENTS
-- ============================================
DROP POLICY IF EXISTS "Anyone authenticated can create payments" ON payments;
DROP POLICY IF EXISTS "Users view payments for own purchases" ON payments;
DROP POLICY IF EXISTS "Anyone authenticated can update payments" ON payments;

-- Edge functions kunnen payments aanmaken
CREATE POLICY "Allow authenticated to create payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users kunnen payments voor eigen purchases zien
CREATE POLICY "Allow users to view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases 
      WHERE purchases.id = payments.purchase_id 
      AND (
        purchases.user_id = auth.uid()
        OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'admin@cultheld.nl')
      )
    )
  );

-- Edge functions kunnen payments updaten
CREATE POLICY "Allow authenticated to update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index voor betere performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_purchase_id ON payments(purchase_id);
