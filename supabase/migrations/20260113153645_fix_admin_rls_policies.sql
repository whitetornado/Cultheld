/*
  # Fix Admin RLS Policies
  
  ## Problem
  Current policies use `SELECT FROM auth.users` which causes "permission denied" errors
  because auth.users is a protected system table.
  
  ## Solution
  Replace with JWT-based checks using `auth.jwt()` to access email from token claims.
  This is the recommended approach for checking user properties in RLS policies.
  
  ## Changes
  - Drop existing admin-only policies
  - Recreate with JWT-based admin checks
  - Applies to: product_configs, product_type_presets
*/

-- Drop existing policies that use auth.users
DROP POLICY IF EXISTS "Only admins can manage product configs" ON product_configs;
DROP POLICY IF EXISTS "Only admins can manage product type presets" ON product_type_presets;

-- Recreate policies using JWT claims instead
CREATE POLICY "Only admins can manage product configs"
  ON product_configs FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email') = 'admin@cultheld.nl'
  );

CREATE POLICY "Only admins can manage product type presets"
  ON product_type_presets FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email') = 'admin@cultheld.nl'
  );