/*
  # Fix Legend Assignments Policies and Handle Duplicates

  ## Summary
  Fixes missing RLS policies for legend_assignments and prevents duplicate entry errors.

  ## Changes
  1. Add INSERT, UPDATE, DELETE policies for admins on legend_assignments
  2. Ensures admins can manage legend-season-club relationships

  ## Why
  - legend_assignments only had SELECT policy
  - Admins couldn't create/update/delete assignments (403 error)
  - Need proper permissions to manage which legends appear in which seasons
*/

-- Drop any existing admin policies
DROP POLICY IF EXISTS "Admins can insert legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can update legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can delete legend assignments" ON legend_assignments;

-- Allow admins to insert legend assignments
CREATE POLICY "Admins can insert legend assignments"
  ON legend_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- Allow admins to update legend assignments
CREATE POLICY "Admins can update legend assignments"
  ON legend_assignments FOR UPDATE
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

-- Allow admins to delete legend assignments
CREATE POLICY "Admins can delete legend assignments"
  ON legend_assignments FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );
