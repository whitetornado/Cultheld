/*
  # Create Assets Storage Bucket

  ## New Bucket
  - Create public `assets` bucket for static assets like logos
  
  ## Policies
  - Allow public read access to assets
*/

-- Create assets bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
DROP POLICY IF EXISTS "Public read access for assets" ON storage.objects;
CREATE POLICY "Public read access for assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

-- Allow authenticated users to upload assets
DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assets');

-- Allow authenticated users to update assets
DROP POLICY IF EXISTS "Authenticated users can update assets" ON storage.objects;
CREATE POLICY "Authenticated users can update assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'assets')
  WITH CHECK (bucket_id = 'assets');

-- Allow authenticated users to delete assets
DROP POLICY IF EXISTS "Authenticated users can delete assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'assets');
