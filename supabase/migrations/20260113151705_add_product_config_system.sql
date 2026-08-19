/*
  # Add Product Configuration System
  
  ## Changes
  - Create product_configs table to define standard colors/sizes per product type
  - This allows dynamic variant generation without manual entry
  - Admin only needs to configure once per product type
  
  ## New Tables
  - `product_configs`: Stores standard configurations for each product type
    - `product_type_id`: Link to product type
    - `color_name`, `color_hex`: Standard colors
    - `sizes_available`: Array of sizes
    - `mockup_template_url`: Template mockup image
    - `blend_mode`: How to blend legend on product
  
  ## Security
  - Enable RLS
  - Public read access
  - Admin-only write access
*/

CREATE TABLE IF NOT EXISTS product_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id text REFERENCES product_types(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_hex text NOT NULL DEFAULT '#FFFFFF',
  mockup_template_url text NOT NULL,
  blend_mode text DEFAULT 'multiply',
  is_default boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product configs"
  ON product_configs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage product configs"
  ON product_configs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@cultheld.nl'
    )
  );

INSERT INTO product_configs (product_type_id, color_name, color_hex, mockup_template_url, blend_mode, is_default, sort_order)
VALUES
  ('tshirt', 'Wit', '#FFFFFF', '/mockups/white-ch.jpg', 'multiply', true, 1),
  ('tshirt', 'Zwart', '#1a1a1a', '/mockups/legend_op_shirt.jpg', 'screen', false, 2),
  ('hoodie', 'Zwart', '#1a1a1a', '/mockups/hoodie-black.jpg', 'screen', true, 1),
  ('sweater', 'Wit', '#FFFFFF', '/mockups/sweater-white.jpg', 'multiply', true, 1)
ON CONFLICT DO NOTHING;