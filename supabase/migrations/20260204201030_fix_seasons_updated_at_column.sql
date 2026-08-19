/*
  # Fix Seasons Updated At Column

  ## Summary
  Adds the missing `updated_at` column to the seasons table that the trigger expects.

  ## Changes
  - Add `updated_at` column to seasons table with default value of now()

  ## Why
  - The trigger `update_seasons_updated_at` was trying to update a non-existent column
  - This caused 400 errors when updating seasons
*/

-- Add the missing updated_at column to seasons table
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
