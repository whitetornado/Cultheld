/*
  # Fix Single Active Season Constraint
  
  ## Changes
  - Add trigger to ensure only one season can be active at a time
  - When a season is set to active, automatically deactivate all other seasons
  - Fix current data: deactivate 2023/24, keep 2026/27 active
  
  ## Security
  - Maintains existing RLS policies
*/

-- Fix current data: only keep 2026/27 active
UPDATE seasons 
SET is_active = false 
WHERE start_year = 2023 AND end_year = 2024;

-- Create function to ensure only one active season
CREATE OR REPLACE FUNCTION ensure_single_active_season()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated row is being set to active
  IF NEW.is_active = true THEN
    -- Deactivate all other seasons
    UPDATE seasons 
    SET is_active = false 
    WHERE id != NEW.id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_single_active_season ON seasons;

-- Create trigger on seasons table
CREATE TRIGGER trigger_single_active_season
  BEFORE INSERT OR UPDATE OF is_active ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_season();