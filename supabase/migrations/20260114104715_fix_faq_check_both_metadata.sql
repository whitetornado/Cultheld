/*
  # Fix FAQ Items RLS - Check Both Metadata Types

  ## Problem
  The previous migration only checked app_metadata for the role, but when users
  sign up via the client SDK with options.data, it sets user_metadata instead.

  ## Solution
  Check both user_metadata and app_metadata for the 'admin' role, as well as
  the specific admin email address.

  ## Changes
  - Update all FAQ RLS policies to check:
    1. app_metadata->>'role' = 'admin' (for users set via service role)
    2. user_metadata->>'role' = 'admin' (for users created via signUp)
    3. email = 'admin@cultheld.nl' (fallback email check)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can insert FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can update FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can delete FAQ items" ON public.faq_items;

-- Create new policies that check both metadata types
CREATE POLICY "Admins can view all FAQ items"
  ON public.faq_items
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );

CREATE POLICY "Admins can insert FAQ items"
  ON public.faq_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );

CREATE POLICY "Admins can update FAQ items"
  ON public.faq_items
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

CREATE POLICY "Admins can delete FAQ items"
  ON public.faq_items
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );
