/*
  # Fix is_admin() function consistency

  ## Issue
  The is_admin() function checks for 'role' = 'admin' in metadata, but the frontend
  and admin setup sets 'is_admin' = true instead. This causes RLS policies to fail
  for admin users, preventing them from creating/updating/deleting data.

  ## Solution
  Update is_admin() to check multiple patterns:
  1. app_metadata.is_admin = true (current admin setup)
  2. app_metadata.role = 'admin' (legacy check)
  3. user_metadata.is_admin = true (fallback)
  4. user_metadata.role = 'admin' (fallback)
  5. email = 'admin@cultheld.nl' (email-based admin)

  This ensures compatibility with different admin marking methods.
*/

DROP FUNCTION IF EXISTS is_admin() CASCADE;
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    -- Check if is_admin boolean is true in app_metadata
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
    OR
    -- Check if role = 'admin' in app_metadata
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR
    -- Fallback: check user_metadata for is_admin
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
    OR
    -- Fallback: check user_metadata for role = 'admin'
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    -- Email-based admin check
    (auth.jwt() ->> 'email') = 'admin@cultheld.nl'
  );
END;
$$;
