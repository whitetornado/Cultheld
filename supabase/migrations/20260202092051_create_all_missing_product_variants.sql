/*
  # Create All Missing Product Variants

  ## Summary
  Creates all missing product variants based on existing product_configs.
  This ensures that all valid combinations of product type, color, and size exist.

  ## Logic
  - For each product_config, creates variants for all sizes (S, M, L, XL, XXL)
  - Only creates variants that don't already exist
  - Uses the config's color info and mockup template
  - Sets price based on product type's base price
  - Marks all as available

  ## Security
  - This is a one-time data migration
  - Does not affect RLS policies
*/

-- Insert all missing variants
INSERT INTO product_variants (
  product_type_id,
  color_name,
  color_hex,
  size,
  price,
  mockup_image_url,
  available
)
SELECT DISTINCT
  pc.product_type_id,
  pc.color_name,
  pc.color_hex,
  sizes.size,
  pt.base_price,
  pc.mockup_template_url,
  true
FROM product_configs pc
CROSS JOIN (
  VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL')
) AS sizes(size)
JOIN product_types pt ON pt.id = pc.product_type_id
WHERE NOT EXISTS (
  SELECT 1 
  FROM product_variants pv 
  WHERE pv.product_type_id = pc.product_type_id 
    AND pv.color_name = pc.color_name 
    AND pv.size = sizes.size
);
