/*
  # Add return_token to purchases table

  1. Changes
    - Add `return_token` column to purchases table
      - Stores a secure random token for unauthenticated payment status checks
      - Used in the payment return URL to allow guest users to check their payment status
      - Token is hashed before storage for security
    
  2. Security
    - Token is generated server-side and hashed before storage
    - Allows temporary unauthenticated access to payment status (10 min window)
    - Only minimal payment status data is exposed via token auth
*/

-- Add return_token column to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS return_token_hash text;

-- Create index for faster lookups by return token
CREATE INDEX IF NOT EXISTS idx_purchases_return_token_hash 
ON purchases(return_token_hash) 
WHERE return_token_hash IS NOT NULL;
