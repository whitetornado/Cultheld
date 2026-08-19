/*
  # Add Admin SELECT Policies for All Tables

  ## Issue
  After the security update, only public data is visible via SELECT policies.
  Admins need to see ALL data (including inactive/unpublished items) but the
  current policies only allow viewing active/published items.

  ## Solution
  Add permissive SELECT policies for admins on all tables where data filtering exists.
  This allows admins to see all data while regular users only see published/active items.

  ## Tables Affected
  - seasons (add admin can view all)
  - product_variants (add admin can view all)
  - cms_pages (already has admin check)
  - faq_items (already has admin check)
  - products (already has admin check)
*/

-- Seasons: Admins can view all seasons (including inactive)
DROP POLICY IF EXISTS "Admins can view all seasons" ON seasons;
CREATE POLICY "Admins can view all seasons" ON seasons 
  FOR SELECT TO authenticated 
  USING ((select is_admin()));

-- Product variants: Admins can view all variants (including unavailable)
DROP POLICY IF EXISTS "Admins can view all product variants" ON product_variants;
CREATE POLICY "Admins can view all product variants" ON product_variants 
  FOR SELECT TO authenticated 
  USING ((select is_admin()));

-- Product types: Admins can view all types
DROP POLICY IF EXISTS "Admins can view all product types" ON product_types;
CREATE POLICY "Admins can view all product types" ON product_types 
  FOR SELECT TO authenticated 
  USING ((select is_admin()));
