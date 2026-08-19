/*
  # Fix Contact Messages Always-True RLS Policy

  ## Summary
  Replaces the unrestricted contact messages INSERT policy with proper access control.
  
  ## Issue
  The current policy allows anyone to insert contact messages without any validation,
  which bypasses RLS security and can lead to spam/abuse.

  ## Solution
  1. Remove the "always true" insert policy
  2. Add policy that only allows service role (edge functions) to insert
  3. Add SELECT policy for admins to view messages
  4. Edge function (send-contact-message) handles rate limiting and validation

  ## Security Impact
  - Contact submissions must go through edge function validation
  - Rate limiting enforced via contact_submissions_tracking table
  - Admins can view all messages
  - Direct client inserts blocked
*/

-- Drop the insecure policy
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;

-- Only service role can insert (enforces edge function usage)
CREATE POLICY "Service role can insert contact messages" ON contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
    OR
    (SELECT is_admin())
  );

-- Admins can view all contact messages
CREATE POLICY "Admins can view contact messages" ON contact_messages
  FOR SELECT
  TO authenticated
  USING ((SELECT is_admin()));

-- Admins can update message status
CREATE POLICY "Admins can update contact messages" ON contact_messages
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- Admins can delete spam messages
CREATE POLICY "Admins can delete contact messages" ON contact_messages
  FOR DELETE
  TO authenticated
  USING ((SELECT is_admin()));
