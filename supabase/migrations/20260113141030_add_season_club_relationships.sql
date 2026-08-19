/*
  # Add Direct Season and Club Relationships

  ## Changes
  - Add `season_id` column to `clubs` table for direct season assignment
  - Add `club_id` column to `legends` table for direct club assignment
  - Add `bio` column to `legends` table for biography text
  
  ## Notes
  - These columns simplify the admin interface while maintaining backward compatibility
  - The `legend_assignments` table can still be used for more complex many-to-many relationships
  - Using nullable foreign keys to avoid breaking existing data
*/

-- Add season_id to clubs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'season_id'
  ) THEN
    ALTER TABLE clubs ADD COLUMN season_id uuid REFERENCES seasons(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_clubs_season ON clubs(season_id);
  END IF;
END $$;

-- Add club_id to legends table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legends' AND column_name = 'club_id'
  ) THEN
    ALTER TABLE legends ADD COLUMN club_id uuid REFERENCES clubs(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_legends_club ON legends(club_id);
  END IF;
END $$;

-- Add bio column to legends table (rename from description if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legends' AND column_name = 'bio'
  ) THEN
    -- Check if description exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'legends' AND column_name = 'description'
    ) THEN
      ALTER TABLE legends RENAME COLUMN description TO bio;
    ELSE
      ALTER TABLE legends ADD COLUMN bio text DEFAULT '';
    END IF;
  END IF;
END $$;

-- Remove slug from legends if not needed (optional)
-- We'll keep it for now for backward compatibility
