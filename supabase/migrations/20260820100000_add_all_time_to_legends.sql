/*
  # Add all-time legend flag

  ## Summary
  Legends were only ever shown scoped to one season via `legend_assignments`
  (season + club + legend). This adds an option to mark a legend as
  "all-time" for its club — shown on a season-independent club page and
  aggregated on a per-city page, regardless of which season(s) it was
  actually assigned to.

  ## Changes
  - New `all_time` boolean column on `legends` (default false)
  - Existing legends are unaffected (all default to false / season-only)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legends' AND column_name = 'all_time'
  ) THEN
    ALTER TABLE legends ADD COLUMN all_time boolean NOT NULL DEFAULT false;
  END IF;
END $$;
