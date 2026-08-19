/*
  # Fix Product Variants Policy for Guest Users

  ## Summary
  Fixes the 403 error when guest users try to add products to cart.

  ## Issue
  The product_variants policy was using roles {anon,authenticated} but cart operations
  use the 'public' role. Additionally, the is_admin() function call might cause issues
  for anonymous users even though it shouldn't be needed for available products.

  ## Solution
  1. Simplify the policy to allow all users (including anon) to view available variants
  2. Use TO public instead of TO authenticated, anon for consistency
  3. Keep admin check for unavailable products but make it more robust

  ## Security Impact
  - No change to security model
  - Public can still only see available products
  - Admins can still see all products
  - Fixes cart functionality for guest checkout
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "View product variants" ON product_variants;

-- Create simpler, more robust policy
CREATE POLICY "View product variants" ON product_variants
  FOR SELECT
  TO public
  USING (
    available = true 
    OR 
    COALESCE((SELECT is_admin()), false) = true
  );
