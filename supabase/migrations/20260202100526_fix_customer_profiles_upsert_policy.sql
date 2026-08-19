/*
  # Fix Customer Profiles Upsert Policy

  1. Changes
    - Drop existing customer_profiles policies that are too restrictive for upsert
    - Create new policies that work correctly with upsert operations
    - Ensure users can upsert their own profile data
    - Admins can still manage all profiles

  2. Security
    - Users can only upsert (insert/update) their own profile
    - Admins can view and update all profiles
    - RLS remains enabled
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON customer_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins update all" ON customer_profiles;

-- Create new optimized policies
CREATE POLICY "Users and admins can view profiles"
  ON customer_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (SELECT is_admin())
  );

CREATE POLICY "Users can insert own profile"
  ON customer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON customer_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON customer_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));
