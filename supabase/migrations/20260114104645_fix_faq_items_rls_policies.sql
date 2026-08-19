/*
  # Fix FAQ Items RLS Policies

  ## Problem
  The current RLS policies for faq_items are trying to query the auth.users table,
  which regular authenticated users don't have permission to access.
  This causes a "permission denied for table users" error.

  ## Solution
  Replace the policies to check admin status directly from the JWT claims instead
  of querying auth.users. The app_metadata (including the role) is automatically
  included in the JWT, so we can access it without additional queries.

  ## Changes
  - Drop existing admin policies for faq_items
  - Create new policies that check JWT app_metadata directly
  - Also check for the specific admin email as a fallback
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can insert FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can update FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can delete FAQ items" ON public.faq_items;

-- Create new policies that check JWT directly
CREATE POLICY "Admins can view all FAQ items"
  ON public.faq_items
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );

CREATE POLICY "Admins can insert FAQ items"
  ON public.faq_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );

CREATE POLICY "Admins can update FAQ items"
  ON public.faq_items
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );

CREATE POLICY "Admins can delete FAQ items"
  ON public.faq_items
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() ->> 'email' = 'admin@cultheld.nl')
  );
