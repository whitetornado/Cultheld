/*
  # Cleanup en Fix alle RLS Policies

  ## Probleem
  - Dubbele policies die conflicteren
  - Verkeerde metadata velden (raw_app_meta_data vs app_metadata)
  - Users kunnen niet bij hun eigen data

  ## Oplossing
  - Verwijder ALLE oude policies
  - Maak nieuwe simpele policies die werken
*/

-- ============================================
-- CUSTOMER_PROFILES: Cleanup en nieuwe policies
-- ============================================
DROP POLICY IF EXISTS "Users can create own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON customer_profiles;

-- Simpele policies die gewoon werken
CREATE POLICY "Users manage own profile"
  ON customer_profiles
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (SELECT email = 'admin@cultheld.nl' FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    (SELECT email = 'admin@cultheld.nl' FROM auth.users WHERE id = auth.uid())
  );

-- ============================================
-- PURCHASES: Cleanup en nieuwe policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create purchases" ON purchases;
DROP POLICY IF EXISTS "Service role can insert purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can update purchases" ON purchases;
DROP POLICY IF EXISTS "Service role can update purchases" ON purchases;

-- Edge functions kunnen purchases aanmaken (via service role in functions)
CREATE POLICY "Anyone authenticated can create purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users kunnen hun eigen purchases zien, admins alles
CREATE POLICY "Users view own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (SELECT email = 'admin@cultheld.nl' FROM auth.users WHERE id = auth.uid())
  );

-- Edge functions kunnen purchases updaten
CREATE POLICY "Anyone authenticated can update purchases"
  ON purchases
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PAYMENTS: Cleanup en nieuwe policies
-- ============================================
DROP POLICY IF EXISTS "Service role can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can view payments for own purchases" ON payments;
DROP POLICY IF EXISTS "Users can view related payments" ON payments;
DROP POLICY IF EXISTS "Service role can update payments" ON payments;

-- Edge functions kunnen payments aanmaken
CREATE POLICY "Anyone authenticated can create payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users kunnen payments zien voor hun purchases, admins alles
CREATE POLICY "Users view payments for own purchases"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    purchase_id IN (SELECT id FROM purchases WHERE user_id = auth.uid())
    OR
    (SELECT email = 'admin@cultheld.nl' FROM auth.users WHERE id = auth.uid())
  );

-- Edge functions kunnen payments updaten
CREATE POLICY "Anyone authenticated can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
