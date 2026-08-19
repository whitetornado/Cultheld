/*
  # Update Smart Fit Default Values

  1. Updates
    - Update max_fill_pct from 0.90 to 0.95
    - Update min_visual_size from 0.18 to 0.15
  
  2. Changes
    - product_configs: Update default values for better visual consistency
    - product_type_presets: Update default values for better visual consistency
*/

-- Update default values in product_configs
DO $$
BEGIN
  -- Update max_fill_pct default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_configs' AND column_name = 'max_fill_pct'
  ) THEN
    ALTER TABLE product_configs ALTER COLUMN max_fill_pct SET DEFAULT 0.95;
  END IF;

  -- Update min_visual_size default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_configs' AND column_name = 'min_visual_size'
  ) THEN
    ALTER TABLE product_configs ALTER COLUMN min_visual_size SET DEFAULT 0.15;
  END IF;
END $$;

-- Update default values in product_type_presets
DO $$
BEGIN
  -- Update max_fill_pct default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_type_presets' AND column_name = 'max_fill_pct'
  ) THEN
    ALTER TABLE product_type_presets ALTER COLUMN max_fill_pct SET DEFAULT 0.95;
  END IF;

  -- Update min_visual_size default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_type_presets' AND column_name = 'min_visual_size'
  ) THEN
    ALTER TABLE product_type_presets ALTER COLUMN min_visual_size SET DEFAULT 0.15;
  END IF;
END $$;

-- Update existing rows to use new defaults if they're still at old defaults
UPDATE product_configs 
SET max_fill_pct = 0.95, min_visual_size = 0.15
WHERE max_fill_pct = 0.90 OR min_visual_size = 0.18;

UPDATE product_type_presets 
SET max_fill_pct = 0.95, min_visual_size = 0.15
WHERE max_fill_pct = 0.90 OR min_visual_size = 0.18;
