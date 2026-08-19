/*
  # Add updated_at column to legends table

  1. Changes
    - Add `updated_at` column to legends table with default value of now()
    - This fixes the 400 error that occurs when trying to update legends
  
  2. Why
    - The trigger `update_legends_updated_at` exists but the column doesn't
    - This causes all UPDATE queries on legends to fail with a 400 error
*/

-- Add updated_at column to legends table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legends' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE legends ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
