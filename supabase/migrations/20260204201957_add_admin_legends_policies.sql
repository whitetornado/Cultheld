/*
  # Add Admin Policies for Legends Table

  ## Summary
  Adds missing INSERT, UPDATE, and DELETE policies for admin users on the legends table.

  ## Changes
  - Add INSERT policy for admins
  - Add UPDATE policy for admins  
  - Add DELETE policy for admins

  ## Why
  - The legends table only had a SELECT policy
  - Admins couldn't add, edit or delete legends due to missing policies
  - This caused 403 Forbidden errors when trying to create legends
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can insert legends" ON legends;
DROP POLICY IF EXISTS "Admins can update legends" ON legends;
DROP POLICY IF EXISTS "Admins can delete legends" ON legends;

-- Allow admins to insert legends
CREATE POLICY "Admins can insert legends"
  ON legends FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- Allow admins to update legends
CREATE POLICY "Admins can update legends"
  ON legends FOR UPDATE
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

-- Allow admins to delete legends
CREATE POLICY "Admins can delete legends"
  ON legends FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );
