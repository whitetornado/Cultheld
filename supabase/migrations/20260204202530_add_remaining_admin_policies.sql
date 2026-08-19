/*
  # Add Remaining Admin Policies

  ## Summary
  Adds missing INSERT, UPDATE, and DELETE policies for admin users on remaining tables.

  ## Changes
  - Add INSERT, UPDATE, DELETE policies for mockup_placements
  - Add INSERT, UPDATE, DELETE policies for product_type_presets
  - Add UPDATE, DELETE policies for orders
  - Add UPDATE, DELETE policies for order_items
  - Add INSERT, UPDATE, DELETE policies for contact_submissions_tracking

  ## Why
  - These tables had incomplete RLS policies
  - Admins need full CRUD access to manage the system
*/

-- ============================================================
-- MOCKUP_PLACEMENTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert mockup placements" ON mockup_placements;
DROP POLICY IF EXISTS "Admins can update mockup placements" ON mockup_placements;
DROP POLICY IF EXISTS "Admins can delete mockup placements" ON mockup_placements;

CREATE POLICY "Admins can insert mockup placements"
  ON mockup_placements FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can update mockup placements"
  ON mockup_placements FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can delete mockup placements"
  ON mockup_placements FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- ============================================================
-- PRODUCT_TYPE_PRESETS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert product type presets" ON product_type_presets;
DROP POLICY IF EXISTS "Admins can update product type presets" ON product_type_presets;
DROP POLICY IF EXISTS "Admins can delete product type presets" ON product_type_presets;

CREATE POLICY "Admins can insert product type presets"
  ON product_type_presets FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can update product type presets"
  ON product_type_presets FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can delete product type presets"
  ON product_type_presets FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- ============================================================
-- ORDERS POLICIES (SELECT and UPDATE for admins)
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- ============================================================
-- ORDER_ITEMS POLICIES (SELECT, UPDATE, DELETE for admins)
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- ============================================================
-- CONTACT_SUBMISSIONS_TRACKING POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert contact tracking" ON contact_submissions_tracking;
DROP POLICY IF EXISTS "Admins can update contact tracking" ON contact_submissions_tracking;
DROP POLICY IF EXISTS "Admins can delete contact tracking" ON contact_submissions_tracking;

CREATE POLICY "Admins can insert contact tracking"
  ON contact_submissions_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can update contact tracking"
  ON contact_submissions_tracking FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can delete contact tracking"
  ON contact_submissions_tracking FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );
