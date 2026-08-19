/*
  # Fix Legends Category Constraint

  ## Changes
  - Drop the existing CHECK constraint on legends.category
  - Update all 'legends' values to 'world'
  - Add new CHECK constraint allowing 'eredivisie' and 'world'
  
  ## Notes
  - This migration fixes the mismatch between database constraint and application logic
*/

-- Drop the existing constraint
ALTER TABLE legends DROP CONSTRAINT IF EXISTS legends_category_check;

-- Update existing data
UPDATE legends 
SET category = 'world' 
WHERE category = 'legends';

-- Add the new constraint with correct values
ALTER TABLE legends ADD CONSTRAINT legends_category_check 
  CHECK (category IN ('eredivisie', 'world'));
