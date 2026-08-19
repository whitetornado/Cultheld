/*
  # Consolidate Multiple Permissive RLS Policies

  ## Summary
  Combines multiple permissive SELECT policies into single policies to avoid confusion
  and improve performance. Multiple permissive policies use OR logic, but it's clearer
  to have a single policy with the combined logic.

  ## Changes
  1. Product Types
     - Remove separate "Anyone" and "Admin" policies
     - Create single policy allowing both public and admin access

  2. Product Variants
     - Remove separate "available variants" and "admin" policies
     - Create single policy showing available to public, all to admin

  3. Seasons
     - Remove separate "active seasons" and "admin" policies
     - Create single policy showing active to public, all to admin

  ## Security Impact
  - No change to access control behavior
  - Clearer policy logic
  - Better performance with fewer policy evaluations
*/

-- Product Types: Consolidate policies
DROP POLICY IF EXISTS "Anyone can view product types" ON product_types;
DROP POLICY IF EXISTS "Admins can view all product types" ON product_types;

CREATE POLICY "View product types" ON product_types
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Product Variants: Consolidate policies (public sees available, admin sees all)
DROP POLICY IF EXISTS "Anyone can view available product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can view all product variants" ON product_variants;

CREATE POLICY "View product variants" ON product_variants
  FOR SELECT
  TO authenticated, anon
  USING (
    available = true 
    OR 
    (SELECT is_admin())
  );

-- Seasons: Consolidate policies (public sees active, admin sees all)
DROP POLICY IF EXISTS "Anyone can view active seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can view all seasons" ON seasons;

CREATE POLICY "View seasons" ON seasons
  FOR SELECT
  TO authenticated, anon
  USING (
    is_active = true 
    OR 
    (SELECT is_admin())
  );
