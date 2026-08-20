/*
  # Add updated_at column to clubs table

  1. Changes
    - Add `updated_at` column to clubs table with default value of now()
    - This fixes the "record "new" has no field "updated_at"" error that
      occurs when trying to insert/update clubs

  2. Why
    - The trigger `update_clubs_updated_at` (added in
      20260201221155_fix_all_security_and_performance_issues_v3.sql) exists
      but the column was never added, unlike seasons/legends which got the
      same fix already. This causes all INSERT/UPDATE queries on clubs to
      fail.
*/

-- Add updated_at column to clubs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE clubs ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
