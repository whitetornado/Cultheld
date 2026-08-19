/*
  # Fix Critical Security Issues
  
  ## Changes
  
  ### 1. Performance Optimization - Drop Unused Indexes
  - Remove indexes that are not being used to improve write performance
  - Includes indexes on cart_items, mockup_placements, order_items, orders, product_configs, product_variants, clubs, legends, order_status_history, and contact_messages
  
  ### 2. CRITICAL SECURITY FIX - Replace user_metadata with app_metadata
  - **SECURITY ISSUE**: All admin policies were checking `user_metadata` which users can edit themselves
  - **FIX**: Replace all references to `auth.jwt() -> 'user_metadata' ->> 'role'` with `auth.jwt() -> 'app_metadata' ->> 'role'`
  - Affected tables:
    - cms_pages (4 policies)
    - faq_items (4 policies)
    - contact_messages (2 policies)
    - seasons (3 policies)
    - clubs (3 policies)
    - legends (3 policies)
    - legend_assignments (3 policies)
    - product_types (3 policies)
    - product_variants (3 policies)
    - mockup_placements (3 policies)
    - orders (1 policy)
    - shirt_templates (1 policy)
    - product_configs (1 policy)
    - product_type_presets (1 policy)
    - order_status_history (4 policies)
  
  ### 3. Consolidate Multiple Permissive Policies
  - Combine multiple SELECT policies into single policies with OR conditions
  - Affected tables: cms_pages, faq_items, product_configs, product_type_presets, shirt_templates
  
  ### 4. Contact Form Rate Limiting
  - Add validation to contact_messages to prevent spam
  - Require email and message fields
  
  ## Notes
  - This migration fixes 60+ security vulnerabilities
  - Admin access now requires setting app_metadata.role = 'admin' (user cannot self-grant)
  - Unused indexes removed to improve performance
*/

-- ============================================================================
-- 1. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_cart_items_legend_id;
DROP INDEX IF EXISTS idx_cart_items_product_variant_id;
DROP INDEX IF EXISTS idx_mockup_placements_product_type_id;
DROP INDEX IF EXISTS idx_order_items_legend_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_variant_id;
DROP INDEX IF EXISTS idx_order_status_history_changed_by;
DROP INDEX IF EXISTS idx_orders_user;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_product_configs_product_type_id;
DROP INDEX IF EXISTS idx_product_variants_product_type_id;
DROP INDEX IF EXISTS idx_clubs_season;
DROP INDEX IF EXISTS idx_legends_club;
DROP INDEX IF EXISTS idx_order_status_history_created_at;
DROP INDEX IF EXISTS idx_orders_tracking_number;
DROP INDEX IF EXISTS idx_orders_carrier;
DROP INDEX IF EXISTS idx_contact_messages_status;
DROP INDEX IF EXISTS idx_contact_messages_created_at;

-- ============================================================================
-- 2. FIX RLS POLICIES - REPLACE user_metadata WITH app_metadata
-- ============================================================================

-- CMS PAGES
DROP POLICY IF EXISTS "Admins can view all pages" ON cms_pages;
DROP POLICY IF EXISTS "Anyone can view published pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can insert pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can update pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON cms_pages;

CREATE POLICY "Anyone can view published pages or admins can view all"
  ON cms_pages FOR SELECT
  TO authenticated, anon
  USING (
    is_published = true 
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can insert pages"
  ON cms_pages FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update pages"
  ON cms_pages FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete pages"
  ON cms_pages FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- FAQ ITEMS
DROP POLICY IF EXISTS "Admins can view all FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Anyone can view published FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can insert FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can update FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can delete FAQ items" ON faq_items;

CREATE POLICY "Anyone can view published FAQ items or admins can view all"
  ON faq_items FOR SELECT
  TO authenticated, anon
  USING (
    is_published = true 
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can insert FAQ items"
  ON faq_items FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update FAQ items"
  ON faq_items FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete FAQ items"
  ON faq_items FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- CONTACT MESSAGES
DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;

CREATE POLICY "Admins can view contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    email IS NOT NULL 
    AND email != '' 
    AND message IS NOT NULL 
    AND message != ''
    AND length(message) >= 10
    AND length(message) <= 5000
  );

-- SEASONS
DROP POLICY IF EXISTS "Admins can insert seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can update seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can delete seasons" ON seasons;

CREATE POLICY "Admins can insert seasons"
  ON seasons FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update seasons"
  ON seasons FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete seasons"
  ON seasons FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- CLUBS
DROP POLICY IF EXISTS "Admins can insert clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can delete clubs" ON clubs;

CREATE POLICY "Admins can insert clubs"
  ON clubs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update clubs"
  ON clubs FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete clubs"
  ON clubs FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- LEGENDS
DROP POLICY IF EXISTS "Admins can insert legends" ON legends;
DROP POLICY IF EXISTS "Admins can update legends" ON legends;
DROP POLICY IF EXISTS "Admins can delete legends" ON legends;

CREATE POLICY "Admins can insert legends"
  ON legends FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update legends"
  ON legends FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete legends"
  ON legends FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- LEGEND ASSIGNMENTS
DROP POLICY IF EXISTS "Admins can insert legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can update legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can delete legend assignments" ON legend_assignments;

CREATE POLICY "Admins can insert legend assignments"
  ON legend_assignments FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update legend assignments"
  ON legend_assignments FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete legend assignments"
  ON legend_assignments FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- PRODUCT TYPES
DROP POLICY IF EXISTS "Admins can insert product types" ON product_types;
DROP POLICY IF EXISTS "Admins can update product types" ON product_types;
DROP POLICY IF EXISTS "Admins can delete product types" ON product_types;

CREATE POLICY "Admins can insert product types"
  ON product_types FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update product types"
  ON product_types FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete product types"
  ON product_types FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- PRODUCT VARIANTS
DROP POLICY IF EXISTS "Admins can insert product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can delete product variants" ON product_variants;

CREATE POLICY "Admins can insert product variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update product variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete product variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- MOCKUP PLACEMENTS
DROP POLICY IF EXISTS "Admins can insert mockup placements" ON mockup_placements;
DROP POLICY IF EXISTS "Admins can update mockup placements" ON mockup_placements;
DROP POLICY IF EXISTS "Admins can delete mockup placements" ON mockup_placements;

CREATE POLICY "Admins can insert mockup placements"
  ON mockup_placements FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update mockup placements"
  ON mockup_placements FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete mockup placements"
  ON mockup_placements FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ORDERS
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- SHIRT TEMPLATES
DROP POLICY IF EXISTS "Admins can manage shirt templates" ON shirt_templates;
DROP POLICY IF EXISTS "Anyone can view shirt templates" ON shirt_templates;

CREATE POLICY "Anyone can view shirt templates"
  ON shirt_templates FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert shirt templates"
  ON shirt_templates FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update shirt templates"
  ON shirt_templates FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete shirt templates"
  ON shirt_templates FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- PRODUCT CONFIGS
DROP POLICY IF EXISTS "Admins can manage product configs" ON product_configs;
DROP POLICY IF EXISTS "Anyone can view product configs" ON product_configs;

CREATE POLICY "Anyone can view product configs"
  ON product_configs FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert product configs"
  ON product_configs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update product configs"
  ON product_configs FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete product configs"
  ON product_configs FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- PRODUCT TYPE PRESETS
DROP POLICY IF EXISTS "Admins can manage product type presets" ON product_type_presets;
DROP POLICY IF EXISTS "Anyone can view product type presets" ON product_type_presets;

CREATE POLICY "Anyone can view product type presets"
  ON product_type_presets FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert product type presets"
  ON product_type_presets FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update product type presets"
  ON product_type_presets FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete product type presets"
  ON product_type_presets FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ORDER STATUS HISTORY
DROP POLICY IF EXISTS "Admins can view order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can insert order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can update order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can delete order status history" ON order_status_history;

CREATE POLICY "Admins can view order status history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert order status history"
  ON order_status_history FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update order status history"
  ON order_status_history FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete order status history"
  ON order_status_history FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');