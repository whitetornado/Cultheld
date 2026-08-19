/*
  # Add Missing Admin Policies for All Tables

  ## Summary
  Adds missing INSERT, UPDATE, and DELETE policies for admin users on multiple tables.

  ## Changes
  - Add INSERT, UPDATE, DELETE policies for clubs
  - Add INSERT, UPDATE, DELETE policies for product_types
  - Add UPDATE, DELETE policies for product_variants (INSERT already exists)
  - Add INSERT, UPDATE, DELETE policies for shirt_templates
  - Add INSERT, UPDATE, DELETE policies for product_configs

  ## Why
  - These tables only had SELECT policies
  - Admins couldn't add, edit or delete records due to missing policies
  - This caused 403 Forbidden errors when trying to manage data
*/

-- ============================================================
-- CLUBS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can delete clubs" ON clubs;

CREATE POLICY "Admins can insert clubs"
  ON clubs FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can update clubs"
  ON clubs FOR UPDATE
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

CREATE POLICY "Admins can delete clubs"
  ON clubs FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- ============================================================
-- PRODUCT_TYPES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert product types" ON product_types;
DROP POLICY IF EXISTS "Admins can update product types" ON product_types;
DROP POLICY IF EXISTS "Admins can delete product types" ON product_types;

CREATE POLICY "Admins can insert product types"
  ON product_types FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can update product types"
  ON product_types FOR UPDATE
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

CREATE POLICY "Admins can delete product types"
  ON product_types FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- ============================================================
-- PRODUCT_VARIANTS POLICIES (INSERT already exists)
-- ============================================================
DROP POLICY IF EXISTS "Admins can update product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can delete product variants" ON product_variants;

CREATE POLICY "Admins can update product variants"
  ON product_variants FOR UPDATE
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

CREATE POLICY "Admins can delete product variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- ============================================================
-- SHIRT_TEMPLATES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert shirt templates" ON shirt_templates;
DROP POLICY IF EXISTS "Admins can update shirt templates" ON shirt_templates;
DROP POLICY IF EXISTS "Admins can delete shirt templates" ON shirt_templates;

CREATE POLICY "Admins can insert shirt templates"
  ON shirt_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can update shirt templates"
  ON shirt_templates FOR UPDATE
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

CREATE POLICY "Admins can delete shirt templates"
  ON shirt_templates FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- ============================================================
-- PRODUCT_CONFIGS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert product configs" ON product_configs;
DROP POLICY IF EXISTS "Admins can update product configs" ON product_configs;
DROP POLICY IF EXISTS "Admins can delete product configs" ON product_configs;

CREATE POLICY "Admins can insert product configs"
  ON product_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE POLICY "Admins can update product configs"
  ON product_configs FOR UPDATE
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

CREATE POLICY "Admins can delete product configs"
  ON product_configs FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );
