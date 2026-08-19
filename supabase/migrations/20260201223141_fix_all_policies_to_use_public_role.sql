/*
  # Fix All Policies to Use Public Role

  ## Summary
  Changes policies from {anon,authenticated} to {public} for consistency and to fix
  cart/guest checkout functionality.

  ## Issue
  Some policies use TO authenticated, anon while others use TO public. This inconsistency
  causes issues with guest checkout and cart functionality. PostgreSQL's 'public' role
  includes both anonymous and authenticated users.

  ## Changes
  - product_types: Change TO public
  - seasons: Change TO public and add COALESCE for is_admin()

  ## Security Impact
  - No change to actual access control
  - Better consistency across policies
  - Fixes guest checkout and cart issues
*/

-- Product Types: Change to public role
DROP POLICY IF EXISTS "View product types" ON product_types;

CREATE POLICY "View product types" ON product_types
  FOR SELECT
  TO public
  USING (true);

-- Seasons: Change to public role and add safety check
DROP POLICY IF EXISTS "View seasons" ON seasons;

CREATE POLICY "View seasons" ON seasons
  FOR SELECT
  TO public
  USING (
    is_active = true 
    OR 
    COALESCE((SELECT is_admin()), false) = true
  );
