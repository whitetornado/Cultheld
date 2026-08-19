/*
  # Add Admin Policies for Seasons Management

  ## Summary
  Adds UPDATE and DELETE policies for the seasons table so admins can manage seasons.

  ## Changes
  - Add UPDATE policy for admins to modify seasons
  - Add DELETE policy for admins to remove seasons

  ## Security
  - Only users with is_admin = true in auth.users metadata can update or delete
  - Public users continue to have read-only access
*/

-- Add UPDATE policy for admins
CREATE POLICY "Admins can update seasons" ON seasons
  FOR UPDATE
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

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete seasons" ON seasons
  FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

-- Add INSERT policy for admins
CREATE POLICY "Admins can insert seasons" ON seasons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );
