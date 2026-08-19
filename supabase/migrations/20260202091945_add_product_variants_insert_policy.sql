/*
  # Add Product Variants Insert Policy

  ## Summary
  Adds INSERT policy for product_variants table to allow admins to create
  new variants dynamically through the application.

  ## Changes Made
  - Added INSERT policy that only allows authenticated admins to create variants
  
  ## Security Notes
  - Only admins can create product variants
  - Guests and regular users cannot create variants
  - All variant creation goes through admin interface or automated systems
*/

-- Allow admins to insert product variants
CREATE POLICY "Admins can insert product variants" ON product_variants
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL AND is_admin() = true
  );
