/*
  # Create Customer Profiles Table

  1. New Tables
    - `customer_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `full_name` (text)
      - `phone` (text)
      - `address` (text)
      - `city` (text)
      - `postal_code` (text)
      - `country` (text, default 'Nederland')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `customer_profiles` table
    - Users can read and update their own profile
    - Admins can read and update all profiles

  3. Indexes
    - Index on user_id for fast lookups
*/

CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  postal_code text DEFAULT '',
  country text NOT NULL DEFAULT 'Nederland',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON customer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON customer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON customer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON customer_profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
    OR (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Admins can update all profiles"
  ON customer_profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
    OR (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
    OR (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
  );

CREATE OR REPLACE FUNCTION update_customer_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_profile_updated_at();
