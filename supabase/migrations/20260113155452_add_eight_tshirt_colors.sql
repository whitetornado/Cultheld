/*
  # Add 8 T-Shirt Color Templates
  
  ## Changes
  This migration replaces existing product configs with 8 standard t-shirt colors:
  - White, Black, Burgundy, Charcoal, Forest Green, Sport Grey, Navy, Sand
  
  ## Details
  1. Clear existing product_configs to start fresh
  2. Add 8 new t-shirt color configurations
  3. Each config includes:
     - Color name and hex code
     - Mockup template URL (using existing images where available)
     - Print area settings (30% width x 40% height, centered)
     - Blend mode (multiply for light colors, screen for dark)
  
  ## Notes
  - White is set as default
  - Admins can add more colors later via the admin interface
  - Existing mockup images are used where available
  - Print area can be adjusted per color in admin panel
*/

-- Clear existing configs
DELETE FROM product_configs WHERE product_type_id = 'tshirt';

-- Add 8 t-shirt color configurations
INSERT INTO product_configs (
  product_type_id,
  color_name,
  color_hex,
  mockup_template_url,
  blend_mode,
  is_default,
  sort_order,
  print_area_x,
  print_area_y,
  print_area_width,
  print_area_height,
  fit_mode,
  padding_percent,
  vertical_bias
) VALUES
  -- White (default)
  (
    'tshirt',
    'White',
    '#FFFFFF',
    '/mockups/white-ch.jpg',
    'multiply',
    true,
    1,
    0.5,
    0.35,
    0.3,
    0.4,
    'contain',
    0.05,
    0.5
  ),
  -- Black
  (
    'tshirt',
    'Black',
    '#1a1a1a',
    '/mockups/black-groot.jpg',
    'screen',
    false,
    2,
    0.5,
    0.35,
    0.3,
    0.4,
    'contain',
    0.05,
    0.5
  ),
  -- Burgundy
  (
    'tshirt',
    'Burgundy',
    '#800020',
    '/mockups/bugundy-groot.jpg',
    'screen',
    false,
    3,
    0.5,
    0.35,
    0.3,
    0.4,
    'contain',
    0.05,
    0.5
  ),
  -- Charcoal
  (
    'tshirt',
    'Charcoal',
    '#36454F',
    '/mockups/charcoal-groot.jpg',
    'screen',
    false,
    4,
    0.5,
    0.35,
    0.3,
    0.4,
    'contain',
    0.05,
    0.5
  ),
  -- Forest Green
  (
    'tshirt',
    'Forest Green',
    '#228B22',
    '/mockups/forrest-groot.jpg',
    'screen',
    false,
    5,
    0.5,
    0.35,
    0.3,
    0.4,
    'contain',
    0.05,
    0.5
  ),
  -- Sport Grey
  (
    'tshirt',
    'Sport Grey',
    '#8C92AC',
    '/mockups/white-ch.jpg',
    'multiply',
    false,
    6,
    0.5,
    0.35,
    0.3,
    0.4,
    'contain',
    0.05,
    0.5
  ),
  -- Navy
  (
    'tshirt',
    'Navy',
    '#000080',
    '/mockups/black-groot.jpg',
    'screen',
    false,
    7,
    0.5,
    0.35,
    0.3,
    0.4,
    'contain',
    0.05,
    0.5
  ),
  -- Sand
  (
    'tshirt',
    'Sand',
    '#C2B280',
    '/mockups/white-ch.jpg',
    'multiply',
    false,
    8,
    0.5,
    0.35,
    0.3,
    0.4,
    'contain',
    0.05,
    0.5
  )
ON CONFLICT DO NOTHING;
