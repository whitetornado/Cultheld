/*
  # Fix Remaining Policies to Use Public Role

  ## Summary
  Completes the migration of all SELECT policies from {anon,authenticated} to {public}
  for consistency and proper guest checkout functionality.

  ## Changes
  - cms_pages: Change TO public, add COALESCE for is_admin()
  - faq_items: Change TO public, add COALESCE for is_admin()
  - products: Change TO public

  ## Security Impact
  - No change to actual access control
  - Ensures consistent behavior across all tables
  - Fixes any remaining guest checkout issues
*/

-- CMS Pages: Change to public role
DROP POLICY IF EXISTS "View published cms pages" ON cms_pages;

CREATE POLICY "View published cms pages" ON cms_pages
  FOR SELECT
  TO public
  USING (
    is_published = true 
    OR 
    COALESCE((SELECT is_admin()), false) = true
  );

-- FAQ Items: Change to public role
DROP POLICY IF EXISTS "View published faq items" ON faq_items;

CREATE POLICY "View published faq items" ON faq_items
  FOR SELECT
  TO public
  USING (
    is_published = true 
    OR 
    COALESCE((SELECT is_admin()), false) = true
  );

-- Products: Change to public role
DROP POLICY IF EXISTS "Anyone can view products" ON products;

CREATE POLICY "View products" ON products
  FOR SELECT
  TO public
  USING (true);
