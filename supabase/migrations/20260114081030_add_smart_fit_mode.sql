/*
  # Add Smart Fit Mode for Legend Rendering

  1. Updates
    - Add 'smart_fit' option to fit_mode enum/check constraint
    - Add max_fill_pct column (default 0.9)
    - Add min_visual_size column (default 0.18)
  
  2. Changes
    - product_configs table: Update fit_mode constraint, add new columns
    - product_type_presets table: Update fit_mode constraint, add new columns
  
  3. Smart Fit Logic
    - Automatically determines optimal scaling based on aspect ratios
    - Brede legends vullen de breedte
    - Hoge legends vullen de hoogte
    - Consistent visuele impact voor alle legend types
*/

-- Add new columns to product_configs if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_configs' AND column_name = 'max_fill_pct'
  ) THEN
    ALTER TABLE product_configs ADD COLUMN max_fill_pct DECIMAL(3,2) DEFAULT 0.90;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_configs' AND column_name = 'min_visual_size'
  ) THEN
    ALTER TABLE product_configs ADD COLUMN min_visual_size DECIMAL(3,2) DEFAULT 0.18;
  END IF;
END $$;

-- Add new columns to product_type_presets if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_type_presets' AND column_name = 'max_fill_pct'
  ) THEN
    ALTER TABLE product_type_presets ADD COLUMN max_fill_pct DECIMAL(3,2) DEFAULT 0.90;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_type_presets' AND column_name = 'min_visual_size'
  ) THEN
    ALTER TABLE product_type_presets ADD COLUMN min_visual_size DECIMAL(3,2) DEFAULT 0.18;
  END IF;
END $$;

-- Update fit_mode check constraint for product_configs to include smart_fit
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_configs_fit_mode_check' AND table_name = 'product_configs'
  ) THEN
    ALTER TABLE product_configs DROP CONSTRAINT product_configs_fit_mode_check;
  END IF;
  
  ALTER TABLE product_configs ADD CONSTRAINT product_configs_fit_mode_check 
    CHECK (fit_mode IN ('contain', 'cover', 'smart_fit'));
END $$;

-- Update fit_mode check constraint for product_type_presets to include smart_fit
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_type_presets_fit_mode_check' AND table_name = 'product_type_presets'
  ) THEN
    ALTER TABLE product_type_presets DROP CONSTRAINT product_type_presets_fit_mode_check;
  END IF;
  
  ALTER TABLE product_type_presets ADD CONSTRAINT product_type_presets_fit_mode_check 
    CHECK (fit_mode IN ('contain', 'cover', 'smart_fit'));
END $$;

-- Update existing product_configs to use smart_fit as default
UPDATE product_configs 
SET fit_mode = 'smart_fit' 
WHERE fit_mode = 'contain';

-- Update existing product_type_presets to use smart_fit as default
UPDATE product_type_presets 
SET fit_mode = 'smart_fit' 
WHERE fit_mode = 'contain';
