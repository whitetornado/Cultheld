/*
  # Complete RLS Cleanup and Fix
  
  ## Probleem
  - Dubbele policies veroorzaken conflicten
  - 403 errors blijven bestaan
  
  ## Oplossing
  - Verwijder ALLE policies
  - Maak verse, simpele policies
  - Test met zowel authenticated als anon role
*/

-- ============================================
-- CUSTOMER_PROFILES - Complete cleanup
-- ============================================

-- Drop ALLE bestaande policies
DROP POLICY IF EXISTS "authenticated_select_own_profile" ON customer_profiles;
DROP POLICY IF EXISTS "authenticated_insert_own_profile" ON customer_profiles;
DROP POLICY IF EXISTS "authenticated_update_own_profile" ON customer_profiles;
DROP POLICY IF EXISTS "admin_all_access_profiles" ON customer_profiles;
DROP POLICY IF EXISTS "customer_profiles_select" ON customer_profiles;
DROP POLICY IF EXISTS "customer_profiles_insert" ON customer_profiles;
DROP POLICY IF EXISTS "customer_profiles_update" ON customer_profiles;
DROP POLICY IF EXISTS "customer_profiles_admin_all" ON customer_profiles;
DROP POLICY IF EXISTS "Allow users to create own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Allow users to view own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON customer_profiles;

-- Nieuwe simpele policies die GEGARANDEERD werken
CREATE POLICY "Users can view own profile"
  ON customer_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON customer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON customer_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin heeft volledige toegang
CREATE POLICY "Admin full access"
  ON customer_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'admin@cultheld.nl'
    )
  );

-- ============================================
-- PURCHASES - Complete cleanup
-- ============================================

DROP POLICY IF EXISTS "authenticated_insert_purchases" ON purchases;
DROP POLICY IF EXISTS "authenticated_select_own_purchases" ON purchases;
DROP POLICY IF EXISTS "authenticated_update_purchases" ON purchases;
DROP POLICY IF EXISTS "admin_all_access_purchases" ON purchases;
DROP POLICY IF EXISTS "purchases_select" ON purchases;
DROP POLICY IF EXISTS "purchases_insert" ON purchases;
DROP POLICY IF EXISTS "purchases_update" ON purchases;
DROP POLICY IF EXISTS "Allow authenticated to create purchases" ON purchases;
DROP POLICY IF EXISTS "Allow users to view own purchases" ON purchases;
DROP POLICY IF EXISTS "Allow authenticated to update purchases" ON purchases;

-- Edge functions moeten purchases kunnen aanmaken
CREATE POLICY "Authenticated can insert purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users kunnen alleen eigen purchases zien
CREATE POLICY "Users can view own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Edge functions moeten purchases kunnen updaten
CREATE POLICY "Authenticated can update purchases"
  ON purchases
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admin heeft volledige toegang
CREATE POLICY "Admin full access purchases"
  ON purchases
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'admin@cultheld.nl'
    )
  );

-- ============================================
-- PAYMENTS - Complete cleanup
-- ============================================

DROP POLICY IF EXISTS "authenticated_insert_payments" ON payments;
DROP POLICY IF EXISTS "authenticated_select_own_payments" ON payments;
DROP POLICY IF EXISTS "authenticated_update_payments" ON payments;
DROP POLICY IF EXISTS "admin_all_access_payments" ON payments;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "Allow authenticated to create payments" ON payments;
DROP POLICY IF EXISTS "Allow users to view own payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated to update payments" ON payments;

-- Edge functions moeten payments kunnen aanmaken
CREATE POLICY "Authenticated can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users kunnen payments zien via hun purchases
CREATE POLICY "Users can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM purchases 
      WHERE purchases.id = payments.purchase_id 
      AND purchases.user_id = auth.uid()
    )
  );

-- Edge functions moeten payments kunnen updaten
CREATE POLICY "Authenticated can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admin heeft volledige toegang
CREATE POLICY "Admin full access payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = 'admin@cultheld.nl'
    )
  );
