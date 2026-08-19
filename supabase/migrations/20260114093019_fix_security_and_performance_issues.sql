/*
  # Fix Security and Performance Issues

  This migration addresses critical security vulnerabilities and performance issues identified by Supabase linter:

  ## 1. Performance Improvements
  ### Add Missing Foreign Key Indexes
  - cart_items: legend_id, product_variant_id
  - mockup_placements: product_type_id
  - order_items: legend_id, order_id, product_variant_id
  - order_status_history: changed_by
  - product_configs: product_type_id
  - product_variants: product_type_id

  ### Optimize RLS Policies
  - Wrap all auth.uid() calls with (select auth.uid()) to prevent re-evaluation per row

  ## 2. Critical Security Fixes
  ### Replace user_metadata with app_metadata
  - user_metadata can be edited by end users and should NEVER be used for authorization
  - All admin checks now use app_metadata which is immutable by users

  ### Fix Always-True RLS Policies
  - Remove policies that bypass security by being always true
  - Replace with proper admin checks using app_metadata

  ### Fix Function Security
  - Set explicit search_path on all functions to prevent search_path attacks

  ## 3. Policy Cleanup
  - Remove duplicate and conflicting RLS policies
  - Consolidate overlapping policies
*/

-- =====================================================
-- SECTION 1: ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cart_items_legend_id ON public.cart_items(legend_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_variant_id ON public.cart_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_mockup_placements_product_type_id ON public.mockup_placements(product_type_id);
CREATE INDEX IF NOT EXISTS idx_order_items_legend_id ON public.order_items(legend_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_variant_id ON public.order_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by ON public.order_status_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_product_configs_product_type_id ON public.product_configs(product_type_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_type_id ON public.product_variants(product_type_id);

-- =====================================================
-- SECTION 2: FIX FUNCTION SEARCH PATHS
-- =====================================================

ALTER FUNCTION public.ensure_single_active_season() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_order_number() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_order_status(uuid, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_customer_orders(text) SET search_path = public, pg_temp;

-- =====================================================
-- SECTION 3: FIX CART_ITEMS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;

CREATE POLICY "Users can view own cart items"
  ON public.cart_items
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own cart items"
  ON public.cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own cart items"
  ON public.cart_items
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own cart items"
  ON public.cart_items
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- SECTION 4: FIX ORDERS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  );

CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Users can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- =====================================================
-- SECTION 5: FIX ORDER_ITEMS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

CREATE POLICY "Users can view order items for their orders"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = (select auth.uid()) OR
        ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
      )
    )
  );

CREATE POLICY "Users can create order items"
  ON public.order_items
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- =====================================================
-- SECTION 6: FIX CONTACT_MESSAGES RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =====================================================
-- SECTION 7: FIX SEASONS RLS POLICIES (CRITICAL SECURITY FIX)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert seasons" ON public.seasons;
DROP POLICY IF EXISTS "Admins can update seasons" ON public.seasons;
DROP POLICY IF EXISTS "Admins can delete seasons" ON public.seasons;

CREATE POLICY "Admins can insert seasons"
  ON public.seasons
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update seasons"
  ON public.seasons
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete seasons"
  ON public.seasons
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 8: FIX CLUBS RLS POLICIES (CRITICAL SECURITY FIX)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admins can delete clubs" ON public.clubs;

CREATE POLICY "Admins can insert clubs"
  ON public.clubs
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update clubs"
  ON public.clubs
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete clubs"
  ON public.clubs
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 9: FIX LEGENDS RLS POLICIES (CRITICAL SECURITY FIX)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert legends" ON public.legends;
DROP POLICY IF EXISTS "Admins can update legends" ON public.legends;
DROP POLICY IF EXISTS "Admins can delete legends" ON public.legends;

CREATE POLICY "Admins can insert legends"
  ON public.legends
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update legends"
  ON public.legends
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete legends"
  ON public.legends
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 10: FIX LEGEND_ASSIGNMENTS RLS POLICIES (CRITICAL SECURITY FIX)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert legend assignments" ON public.legend_assignments;
DROP POLICY IF EXISTS "Admins can update legend assignments" ON public.legend_assignments;
DROP POLICY IF EXISTS "Admins can delete legend assignments" ON public.legend_assignments;

CREATE POLICY "Admins can insert legend assignments"
  ON public.legend_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update legend assignments"
  ON public.legend_assignments
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete legend assignments"
  ON public.legend_assignments
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 11: FIX PRODUCT_TYPES RLS POLICIES (CRITICAL SECURITY FIX)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert product types" ON public.product_types;
DROP POLICY IF EXISTS "Admins can update product types" ON public.product_types;
DROP POLICY IF EXISTS "Admins can delete product types" ON public.product_types;

CREATE POLICY "Admins can insert product types"
  ON public.product_types
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update product types"
  ON public.product_types
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete product types"
  ON public.product_types
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 12: FIX PRODUCT_VARIANTS RLS POLICIES (CRITICAL SECURITY FIX)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can delete product variants" ON public.product_variants;

CREATE POLICY "Admins can insert product variants"
  ON public.product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update product variants"
  ON public.product_variants
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete product variants"
  ON public.product_variants
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 13: FIX MOCKUP_PLACEMENTS RLS POLICIES (CRITICAL SECURITY FIX)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert mockup placements" ON public.mockup_placements;
DROP POLICY IF EXISTS "Admins can update mockup placements" ON public.mockup_placements;
DROP POLICY IF EXISTS "Admins can delete mockup placements" ON public.mockup_placements;

CREATE POLICY "Admins can insert mockup placements"
  ON public.mockup_placements
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update mockup placements"
  ON public.mockup_placements
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete mockup placements"
  ON public.mockup_placements
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 14: FIX PRODUCT_CONFIGS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Only admins can manage product configs" ON public.product_configs;

CREATE POLICY "Admins can manage product configs"
  ON public.product_configs
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 15: FIX PRODUCT_TYPE_PRESETS RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Only admins can manage product type presets" ON public.product_type_presets;

CREATE POLICY "Admins can manage product type presets"
  ON public.product_type_presets
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 16: FIX SHIRT_TEMPLATES RLS POLICIES (REMOVE DUPLICATES)
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage shirt templates" ON public.shirt_templates;
DROP POLICY IF EXISTS "Authenticated users can manage shirt templates" ON public.shirt_templates;
DROP POLICY IF EXISTS "Public can view shirt templates" ON public.shirt_templates;

CREATE POLICY "Admins can manage shirt templates"
  ON public.shirt_templates
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 17: FIX ORDER_STATUS_HISTORY RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admins can insert order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admins can update order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admins can delete order status history" ON public.order_status_history;

CREATE POLICY "Admins can view order status history"
  ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can insert order status history"
  ON public.order_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update order status history"
  ON public.order_status_history
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete order status history"
  ON public.order_status_history
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 18: FIX CMS_PAGES RLS POLICIES (FIX ALWAYS TRUE)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Admins can update pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON public.cms_pages;

CREATE POLICY "Admins can insert pages"
  ON public.cms_pages
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update pages"
  ON public.cms_pages
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete pages"
  ON public.cms_pages
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

-- =====================================================
-- SECTION 19: FIX FAQ_ITEMS RLS POLICIES (FIX ALWAYS TRUE)
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can update FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can delete FAQ items" ON public.faq_items;

CREATE POLICY "Admins can insert FAQ items"
  ON public.faq_items
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can update FAQ items"
  ON public.faq_items
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'))
  WITH CHECK ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));

CREATE POLICY "Admins can delete FAQ items"
  ON public.faq_items
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') IN (select email from auth.users where raw_app_meta_data->>'role' = 'admin'));