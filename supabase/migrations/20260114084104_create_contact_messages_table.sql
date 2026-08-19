/*
  # Create Contact Messages Table

  1. New Tables
    - `contact_messages`
      - `id` (uuid, primary key)
      - `name` (text) - Name of person sending message
      - `email` (text) - Email address
      - `subject` (text) - Message subject
      - `message` (text) - Message content
      - `status` (text) - Status: 'new', 'read', 'replied'
      - `created_at` (timestamptz) - When message was sent
      - `updated_at` (timestamptz) - When status was last updated

  2. Security
    - Enable RLS on `contact_messages` table
    - Allow anyone to insert (public contact form)
    - Only admins (email = admin@cultheld.nl or role = 'admin') can read messages
    - Only admins can update messages
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@cultheld.nl'
    OR
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update contact messages"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@cultheld.nl'
    OR
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@cultheld.nl'
    OR
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);