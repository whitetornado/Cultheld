/*
  # Anti-Spam Beveiliging voor Contact Formulier

  1. Nieuwe Tabellen
    - `contact_submissions_tracking`
      - Houdt bij wanneer iemand een bericht heeft gestuurd
      - Voor rate limiting op basis van IP en email
      - Automatische cleanup na 24 uur

  2. Wijzigingen aan Bestaande Tabellen
    - `contact_messages`
      - Voeg `ip_address` toe voor tracking
      - Voeg `user_agent` toe voor bot detectie
      - Voeg `is_spam` vlag toe
      - Voeg `spam_score` toe voor spam analyse

  3. Functies
    - `check_contact_rate_limit` - Controleert of IP of email te vaak heeft verzonden
    - `cleanup_old_tracking` - Verwijdert oude tracking data

  4. Security
    - RLS policies voor tracking tabel (alleen backend toegang)
*/

-- Add tracking columns to contact_messages
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0;

-- Create submission tracking table
CREATE TABLE IF NOT EXISTS contact_submissions_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_contact_tracking_ip ON contact_submissions_tracking(ip_address, submitted_at);
CREATE INDEX IF NOT EXISTS idx_contact_tracking_email ON contact_submissions_tracking(email, submitted_at);

-- Enable RLS (only backend can access)
ALTER TABLE contact_submissions_tracking ENABLE ROW LEVEL SECURITY;

-- No public access - only service role
CREATE POLICY "Only service role can access tracking"
  ON contact_submissions_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_contact_rate_limit(
  p_ip_address TEXT,
  p_email TEXT
)
RETURNS TABLE(
  is_allowed BOOLEAN,
  reason TEXT,
  wait_time INTEGER
) AS $$
DECLARE
  ip_count INTEGER;
  email_count INTEGER;
  last_submission TIMESTAMPTZ;
BEGIN
  -- Check IP submissions in last hour (max 3)
  SELECT COUNT(*), MAX(submitted_at)
  INTO ip_count, last_submission
  FROM contact_submissions_tracking
  WHERE ip_address = p_ip_address
    AND submitted_at > now() - INTERVAL '1 hour';

  IF ip_count >= 3 THEN
    RETURN QUERY SELECT 
      false,
      'Te veel berichten verzonden. Probeer later opnieuw.',
      EXTRACT(EPOCH FROM (last_submission + INTERVAL '1 hour' - now()))::INTEGER;
    RETURN;
  END IF;

  -- Check email submissions in last hour (max 2)
  SELECT COUNT(*), MAX(submitted_at)
  INTO email_count, last_submission
  FROM contact_submissions_tracking
  WHERE email = p_email
    AND submitted_at > now() - INTERVAL '1 hour';

  IF email_count >= 2 THEN
    RETURN QUERY SELECT 
      false,
      'Te veel berichten vanaf dit emailadres. Probeer later opnieuw.',
      EXTRACT(EPOCH FROM (last_submission + INTERVAL '1 hour' - now()))::INTEGER;
    RETURN;
  END IF;

  -- Check if last submission was less than 30 seconds ago
  IF last_submission IS NOT NULL AND last_submission > now() - INTERVAL '30 seconds' THEN
    RETURN QUERY SELECT 
      false,
      'Wacht even voordat je een nieuw bericht verstuurt.',
      30 - EXTRACT(EPOCH FROM (now() - last_submission))::INTEGER;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, ''::TEXT, 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record submission
CREATE OR REPLACE FUNCTION record_contact_submission(
  p_ip_address TEXT,
  p_email TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO contact_submissions_tracking (ip_address, email)
  VALUES (p_ip_address, p_email);
  
  -- Cleanup old entries (older than 24 hours)
  DELETE FROM contact_submissions_tracking
  WHERE submitted_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION check_contact_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION record_contact_submission TO service_role;