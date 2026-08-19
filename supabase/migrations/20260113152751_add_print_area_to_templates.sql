/*
  # Add Print Area Configuration to Product Templates
  
  ## Changes
  - Add print area fields to product_configs table
  - Create product_type_presets table for default settings per product type
  - Print area stored as relative values (0-1) for resolution independence
  
  ## New Fields on product_configs
  - `print_area_x`: X position as percentage (0-1)
  - `print_area_y`: Y position as percentage (0-1)
  - `print_area_width`: Width as percentage (0-1)
  - `print_area_height`: Height as percentage (0-1)
  - `fit_mode`: How to fit legend in area (contain/cover)
  - `padding_percent`: Padding inside print area (0-1)
  - `vertical_bias`: Vertical alignment bias (0-1, 0.5 = center)
  
  ## New Table: product_type_presets
  - Default print area settings per product type
  - Used as starting point when creating new templates
  
  ## Security
  - Maintains existing RLS policies
*/

-- Add print area fields to product_configs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_configs' AND column_name = 'print_area_x'
  ) THEN
    ALTER TABLE product_configs 
    ADD COLUMN print_area_x numeric DEFAULT 0.5,
    ADD COLUMN print_area_y numeric DEFAULT 0.35,
    ADD COLUMN print_area_width numeric DEFAULT 0.3,
    ADD COLUMN print_area_height numeric DEFAULT 0.4,
    ADD COLUMN fit_mode text DEFAULT 'contain' CHECK (fit_mode IN ('contain', 'cover')),
    ADD COLUMN padding_percent numeric DEFAULT 0.05,
    ADD COLUMN vertical_bias numeric DEFAULT 0.5;
  END IF;
END $$;

-- Create product_type_presets table
CREATE TABLE IF NOT EXISTS product_type_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id text UNIQUE REFERENCES product_types(id) ON DELETE CASCADE,
  print_area_x numeric DEFAULT 0.5,
  print_area_y numeric DEFAULT 0.35,
  print_area_width numeric DEFAULT 0.3,
  print_area_height numeric DEFAULT 0.4,
  fit_mode text DEFAULT 'contain' CHECK (fit_mode IN ('contain', 'cover')),
  padding_percent numeric DEFAULT 0.05,
  vertical_bias numeric DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_type_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product type presets"
  ON product_type_presets FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage product type presets"
  ON product_type_presets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@cultheld.nl'
    )
  );

-- Insert default presets for each product type
INSERT INTO product_type_presets (product_type_id, print_area_x, print_area_y, print_area_width, print_area_height, fit_mode, padding_percent)
VALUES
  ('tshirt', 0.5, 0.35, 0.3, 0.4, 'contain', 0.05),
  ('hoodie', 0.5, 0.38, 0.28, 0.38, 'contain', 0.05),
  ('sweater', 0.5, 0.36, 0.32, 0.4, 'contain', 0.05)
ON CONFLICT (product_type_id) DO NOTHING;

-- Update existing product_configs with default print areas based on product type
UPDATE product_configs pc
SET 
  print_area_x = ptp.print_area_x,
  print_area_y = ptp.print_area_y,
  print_area_width = ptp.print_area_width,
  print_area_height = ptp.print_area_height,
  fit_mode = ptp.fit_mode,
  padding_percent = ptp.padding_percent
FROM product_type_presets ptp
WHERE pc.product_type_id = ptp.product_type_id;