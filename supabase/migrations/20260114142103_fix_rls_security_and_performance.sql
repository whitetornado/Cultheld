/*
  # Fix Critical RLS Security and Performance Issues

  1. Security Fixes
    - CRITICAL: Remove user_metadata checks from all admin policies
    - user_metadata is editable by end users and must NEVER be used for security
    - Only check app_metadata which is server-controlled and secure

  2. Performance Fixes
    - Wrap all auth.jwt() calls with (select auth.jwt())
    - This prevents re-evaluation for each row, improving query performance at scale
    - Applies to all tables with admin policies

  3. Affected Tables
    - seasons, clubs, legends, legend_assignments, shirt_templates
    - product_types, product_variants, mockup_placements
    - orders, order_status_history, product_configs, product_type_presets
    - cms_pages, faq_items, contact_messages
*/

-- ===========================
-- SEASONS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can update seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can delete seasons" ON seasons;

CREATE POLICY "Admins can insert seasons"
  ON seasons FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update seasons"
  ON seasons FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete seasons"
  ON seasons FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- CLUBS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can delete clubs" ON clubs;

CREATE POLICY "Admins can insert clubs"
  ON clubs FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update clubs"
  ON clubs FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete clubs"
  ON clubs FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- LEGENDS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert legends" ON legends;
DROP POLICY IF EXISTS "Admins can update legends" ON legends;
DROP POLICY IF EXISTS "Admins can delete legends" ON legends;

CREATE POLICY "Admins can insert legends"
  ON legends FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update legends"
  ON legends FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete legends"
  ON legends FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- LEGEND_ASSIGNMENTS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can update legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can delete legend assignments" ON legend_assignments;

CREATE POLICY "Admins can insert legend assignments"
  ON legend_assignments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update legend assignments"
  ON legend_assignments FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete legend assignments"
  ON legend_assignments FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- SHIRT_TEMPLATES TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert shirt templates" ON shirt_templates;
DROP POLICY IF EXISTS "Admins can update shirt templates" ON shirt_templates;
DROP POLICY IF EXISTS "Admins can delete shirt templates" ON shirt_templates;

CREATE POLICY "Admins can insert shirt templates"
  ON shirt_templates FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update shirt templates"
  ON shirt_templates FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete shirt templates"
  ON shirt_templates FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- PRODUCT_TYPES TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert product types" ON product_types;
DROP POLICY IF EXISTS "Admins can update product types" ON product_types;
DROP POLICY IF EXISTS "Admins can delete product types" ON product_types;

CREATE POLICY "Admins can insert product types"
  ON product_types FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update product types"
  ON product_types FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete product types"
  ON product_types FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- PRODUCT_VARIANTS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can delete product variants" ON product_variants;

CREATE POLICY "Admins can insert product variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update product variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete product variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- MOCKUP_PLACEMENTS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert mockup placements" ON mockup_placements;
DROP POLICY IF EXISTS "Admins can update mockup placements" ON mockup_placements;
DROP POLICY IF EXISTS "Admins can delete mockup placements" ON mockup_placements;

CREATE POLICY "Admins can insert mockup placements"
  ON mockup_placements FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update mockup placements"
  ON mockup_placements FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete mockup placements"
  ON mockup_placements FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- ORDERS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- ORDER_STATUS_HISTORY TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can view all order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can view order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can insert order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can update order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can delete order status history" ON order_status_history;

CREATE POLICY "Admins can view all order status history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert order status history"
  ON order_status_history FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update order status history"
  ON order_status_history FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete order status history"
  ON order_status_history FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- PRODUCT_CONFIGS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert product configs" ON product_configs;
DROP POLICY IF EXISTS "Admins can update product configs" ON product_configs;
DROP POLICY IF EXISTS "Admins can delete product configs" ON product_configs;

CREATE POLICY "Admins can insert product configs"
  ON product_configs FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update product configs"
  ON product_configs FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete product configs"
  ON product_configs FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- PRODUCT_TYPE_PRESETS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert product type presets" ON product_type_presets;
DROP POLICY IF EXISTS "Admins can update product type presets" ON product_type_presets;
DROP POLICY IF EXISTS "Admins can delete product type presets" ON product_type_presets;

CREATE POLICY "Admins can insert product type presets"
  ON product_type_presets FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update product type presets"
  ON product_type_presets FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete product type presets"
  ON product_type_presets FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- CMS_PAGES TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert CMS pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can insert pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can update CMS pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can update pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can delete CMS pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON cms_pages;
DROP POLICY IF EXISTS "Anyone can view published pages or admins can view all" ON cms_pages;

CREATE POLICY "Admins can insert CMS pages"
  ON cms_pages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update CMS pages"
  ON cms_pages FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete CMS pages"
  ON cms_pages FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Anyone can view published pages or admins can view all"
  ON cms_pages FOR SELECT
  TO public
  USING (is_published = true OR (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- FAQ_ITEMS TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can insert FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can update FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can delete FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Anyone can view published FAQ items or admins can view all" ON faq_items;

CREATE POLICY "Admins can insert FAQ items"
  ON faq_items FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update FAQ items"
  ON faq_items FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete FAQ items"
  ON faq_items FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Anyone can view published FAQ items or admins can view all"
  ON faq_items FOR SELECT
  TO public
  USING (is_published = true OR (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ===========================
-- CONTACT_MESSAGES TABLE
-- ===========================
DROP POLICY IF EXISTS "Admins can view all contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages" ON contact_messages;

CREATE POLICY "Admins can view all contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete contact messages"
  ON contact_messages FOR DELETE
  TO authenticated
  USING ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');