/*
  # Make All Seasons Visible to Everyone

  ## Summary
  Makes all seasons visible to all users (authenticated and anonymous).
  The active season should be displayed first in the UI, but all seasons
  should be accessible.

  ## Changes
  - Drops the existing seasons SELECT policy
  - Creates a new policy that allows everyone to view all seasons
  - No restrictions based on is_active or authentication status

  ## Logic
  - All seasons visible to everyone
  - Frontend will sort with active season first
*/

-- Drop existing policy
DROP POLICY IF EXISTS "View seasons" ON seasons;

-- Create new policy that allows everyone to see all seasons
CREATE POLICY "View seasons" ON seasons
  FOR SELECT
  TO public
  USING (true);
