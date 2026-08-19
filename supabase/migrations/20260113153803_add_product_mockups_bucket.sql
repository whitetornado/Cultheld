/*
  # Add Product Mockups Storage Bucket
  
  ## Changes
  - Create product-mockups storage bucket for admin-uploaded mockup templates
  - Set bucket to public for easy access
  - Add RLS policies for public read, admin write
  
  ## Security
  - Public can read mockups (needed for product display)
  - Only admins can upload/delete mockups
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-mockups', 'product-mockups', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product mockups"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-mockups');

CREATE POLICY "Admins can upload product mockups"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-mockups' 
    AND (
      (auth.jwt()->>'email') = 'admin@cultheld.nl'
      OR (auth.jwt()->>'role') = 'admin'
    )
  );

CREATE POLICY "Admins can update product mockups"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-mockups' 
    AND (
      (auth.jwt()->>'email') = 'admin@cultheld.nl'
      OR (auth.jwt()->>'role') = 'admin'
    )
  );

CREATE POLICY "Admins can delete product mockups"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-mockups' 
    AND (
      (auth.jwt()->>'email') = 'admin@cultheld.nl'
      OR (auth.jwt()->>'role') = 'admin'
    )
  );