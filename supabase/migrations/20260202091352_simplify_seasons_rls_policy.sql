/*
  # Simplify Seasons RLS Policy

  ## Summary
  Simplifies the seasons SELECT policy by inlining admin checks instead of
  calling the is_admin() function. This improves performance and reliability.

  ## Changes
  - Drops the existing policy that calls is_admin()
  - Creates a new policy with inline admin checks
  - Checks app_metadata and user_metadata directly in the policy
  - Includes email-based admin check

  ## Logic
  - Show active seasons to everyone (including anonymous)
  - Show all seasons to authenticated admin users
*/

-- Drop existing policy
DROP POLICY IF EXISTS "View seasons" ON seasons;

-- Create simplified policy with inline admin checks
CREATE POLICY "View seasons" ON seasons
  FOR SELECT
  TO public
  USING (
    -- Show active seasons to everyone
    is_active = true
    OR
    -- Show all seasons to authenticated admins
    (
      auth.uid() IS NOT NULL
      AND (
        -- Check app_metadata for is_admin boolean
        COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
        OR
        -- Check app_metadata for role = 'admin'
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        OR
        -- Check user_metadata for is_admin boolean
        COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
        OR
        -- Check user_metadata for role = 'admin'
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        OR
        -- Email-based admin check
        (auth.jwt() ->> 'email') = 'admin@cultheld.nl'
      )
    )
  );
