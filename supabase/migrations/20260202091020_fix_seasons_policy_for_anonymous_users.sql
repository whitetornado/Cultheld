/*
  # Fix Seasons Policy for Anonymous Users

  ## Summary
  Fixes the seasons RLS policy to properly hide inactive seasons from
  anonymous (not logged in) users.

  ## Issue
  - Anonymous users could see all seasons (including inactive ones)
  - The is_admin() function might not evaluate correctly for anonymous users
  - Need explicit check for anonymous vs authenticated users

  ## Solution
  1. Anonymous users (auth.uid() IS NULL): Only see active seasons
  2. Authenticated non-admin users: Only see active seasons
  3. Admin users: See all seasons

  ## Security Impact
  - Properly restricts inactive seasons to admin users only
  - No impact on authenticated non-admin users
  - Fixes visibility issue for anonymous users
*/

-- Drop existing policy
DROP POLICY IF EXISTS "View seasons" ON seasons;

-- Create new policy with explicit anonymous check
CREATE POLICY "View seasons" ON seasons
  FOR SELECT
  TO public
  USING (
    -- Show active seasons to everyone
    is_active = true
    OR
    -- Admin users can see all seasons
    (
      auth.uid() IS NOT NULL 
      AND COALESCE((SELECT is_admin()), false) = true
    )
  );
