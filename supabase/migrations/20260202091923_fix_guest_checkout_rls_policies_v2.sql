/*
  # Fix Guest Checkout RLS Policies

  ## Summary
  Fixes RLS policies to properly support guest (non-authenticated) users
  when browsing products and adding items to cart.

  ## Changes Made
  1. **is_admin() Function**
     - Made it safe for non-authenticated users by checking auth.uid() first
     - Returns false immediately if no user is authenticated
  
  2. **product_variants Policy**
     - Simplified policy to always show available variants to everyone
     - Admin check only applies when viewing unavailable variants

  ## Security Notes
  - Guest users can only view available products
  - Guest users can only manage their own cart (via session_id)
  - All sensitive operations still require authentication
*/

-- First, fix the is_admin() function to handle non-authenticated users safely
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Return false immediately if no user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Now safely check admin status
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

-- Recreate product_variants policy with simpler logic
DROP POLICY IF EXISTS "View product variants" ON product_variants;
CREATE POLICY "View product variants" ON product_variants
  FOR SELECT
  TO public
  USING (
    -- Everyone can see available variants
    available = true
    OR
    -- Admins can see all variants (only if authenticated)
    (auth.uid() IS NOT NULL AND is_admin() = true)
  );
