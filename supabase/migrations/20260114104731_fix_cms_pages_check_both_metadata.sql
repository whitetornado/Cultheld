/*
  # Fix CMS Pages RLS - Check Both Metadata Types

  ## Problem
  The CMS pages RLS policies have the same issue as FAQ items - they try to
  query auth.users table which causes permission errors.

  ## Solution
  Update policies to check JWT claims directly for both user_metadata and
  app_metadata, plus the admin email fallback.

  ## Changes
  - Update all CMS pages RLS policies to check JWT claims directly
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Admins can insert pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Admins can update pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON public.cms_pages;

-- Create new policies
CREATE POLICY "Admins can view all pages"
  ON public.cms_pages
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );

CREATE POLICY "Admins can insert pages"
  ON public.cms_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );

CREATE POLICY "Admins can update pages"
  ON public.cms_pages
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );

CREATE POLICY "Admins can delete pages"
  ON public.cms_pages
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );
