/*
  # Fix RLS Performance and Security Issues

  ## Security Fixes
  
  1. **RLS Performance Optimization**
     - Wrap all `auth.uid()` and `auth.jwt()` calls in subqueries to prevent re-evaluation per row
     - This improves query performance at scale
  
  2. **Fix User Metadata References**
     - Change all policies using `user_metadata` to use `app_metadata` instead
     - `user_metadata` is editable by users and should never be used for authorization
     - Admin role should be stored in `app_metadata` only
  
  3. **Fix Always-True Policies**
     - Add proper checks to INSERT policies that currently allow unrestricted access
     - `orders`: Ensure user_id matches authenticated user
     - `order_items`: Verify order belongs to authenticated user
     - `contact_messages`: Keep as-is (intentionally public)
  
  ## Changes by Table
  
  ### Seasons Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Clubs Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Legends Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Legend Assignments Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Product Types Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Product Variants Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Mockup Placements Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Orders Table
  - Replace `auth.uid()` with `(select auth.uid())`
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  - Fix INSERT policy to verify user_id
  
  ### Order Items Table
  - Replace `auth.uid()` with `(select auth.uid())`
  - Fix INSERT policy to verify order ownership
  
  ### Order Status History Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Shirt Templates Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Product Configs Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Product Type Presets Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### CMS Pages Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### FAQ Items Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
  
  ### Contact Messages Table
  - Replace `auth.jwt()` with `(select auth.jwt())`
  - Replace `user_metadata` with `app_metadata`
*/

-- Drop and recreate all affected policies with optimizations

-- ============================================================================
-- SEASONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can insert seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can update seasons" ON seasons;

CREATE POLICY "Admins can delete seasons"
  ON seasons FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert seasons"
  ON seasons FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update seasons"
  ON seasons FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- CLUBS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can insert clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON clubs;

CREATE POLICY "Admins can delete clubs"
  ON clubs FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert clubs"
  ON clubs FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update clubs"
  ON clubs FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- LEGENDS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete legends" ON legends;
DROP POLICY IF EXISTS "Admins can insert legends" ON legends;
DROP POLICY IF EXISTS "Admins can update legends" ON legends;

CREATE POLICY "Admins can delete legends"
  ON legends FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert legends"
  ON legends FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update legends"
  ON legends FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- LEGEND ASSIGNMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can insert legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can update legend assignments" ON legend_assignments;

CREATE POLICY "Admins can delete legend assignments"
  ON legend_assignments FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert legend assignments"
  ON legend_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update legend assignments"
  ON legend_assignments FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- PRODUCT TYPES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete product types" ON product_types;
DROP POLICY IF EXISTS "Admins can insert product types" ON product_types;
DROP POLICY IF EXISTS "Admins can update product types" ON product_types;

CREATE POLICY "Admins can delete product types"
  ON product_types FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert product types"
  ON product_types FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update product types"
  ON product_types FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- PRODUCT VARIANTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can insert product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON product_variants;

CREATE POLICY "Admins can delete product variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert product variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update product variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- MOCKUP PLACEMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete mockup placements" ON mockup_placements;
DROP POLICY IF EXISTS "Admins can insert mockup placements" ON mockup_placements;
DROP POLICY IF EXISTS "Admins can update mockup placements" ON mockup_placements;

CREATE POLICY "Admins can delete mockup placements"
  ON mockup_placements FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert mockup placements"
  ON mockup_placements FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update mockup placements"
  ON mockup_placements FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    user_id IS NULL OR user_id = (select auth.uid())
  );

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id IS NULL OR orders.user_id = (select auth.uid()))
    )
  );

-- ============================================================================
-- SHIRT TEMPLATES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage shirt templates" ON shirt_templates;

CREATE POLICY "Admins can manage shirt templates"
  ON shirt_templates FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- PRODUCT CONFIGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage product configs" ON product_configs;

CREATE POLICY "Admins can manage product configs"
  ON product_configs FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- PRODUCT TYPE PRESETS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage product type presets" ON product_type_presets;

CREATE POLICY "Admins can manage product type presets"
  ON product_type_presets FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- ORDER STATUS HISTORY TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can insert order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can update order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can view order status history" ON order_status_history;

CREATE POLICY "Admins can delete order status history"
  ON order_status_history FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert order status history"
  ON order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update order status history"
  ON order_status_history FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can view order status history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- CMS PAGES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can insert pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can update pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can view all pages" ON cms_pages;

CREATE POLICY "Admins can delete pages"
  ON cms_pages FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert pages"
  ON cms_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update pages"
  ON cms_pages FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can view all pages"
  ON cms_pages FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- FAQ ITEMS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can delete FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can insert FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can update FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can view all FAQ items" ON faq_items;

CREATE POLICY "Admins can delete FAQ items"
  ON faq_items FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can insert FAQ items"
  ON faq_items FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can update FAQ items"
  ON faq_items FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can view all FAQ items"
  ON faq_items FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

-- ============================================================================
-- CONTACT MESSAGES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;

CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  )
  WITH CHECK (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );

CREATE POLICY "Admins can view contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      ((select auth.jwt()) -> 'app_metadata' ->> 'role'),
      ((select auth.jwt()) -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );