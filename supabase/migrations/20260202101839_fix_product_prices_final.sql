/*
  # Fix Product Prices

  1. Changes
    - Drop problematic trigger on product_variants
    - Fix incorrect prices in product_variants
    - Update products base prices
    
  2. Corrected Prices
    - T-Shirt: €29.99
    - Sweater: €44.99 (was €49.99 for some variants)
    - Hoodie: €54.99 (remove €4995.00 typo)
*/

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;

-- Delete incorrect sweater price variants (49.99 should be 44.99)
UPDATE product_variants SET price = 44.99 WHERE price = 49.99 AND product_type_id = 'sweater';

-- Delete the hoodie typo (4995.00 should be 54.99)
UPDATE product_variants SET price = 54.99 WHERE price = 4995.00 AND product_type_id = 'hoodie';

-- Update products table with correct base prices
UPDATE products SET amount_value = '29.99' WHERE slug = 'custom-legend-tee';
UPDATE products SET amount_value = '44.99' WHERE slug = 'custom-legend-sweater';
UPDATE products SET amount_value = '54.99' WHERE slug = 'custom-legend-hoodie';
