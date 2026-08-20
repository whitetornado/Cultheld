/*
  # Create club-logos storage bucket

  Public bucket for admin-uploaded club logos used on club pages and
  Open Graph previews. Same size/mime limits as the assets bucket.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-logos',
  'club-logos',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for club logos" ON storage.objects;
CREATE POLICY "Public read access for club logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'club-logos');

DROP POLICY IF EXISTS "Authenticated users can upload club logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload club logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'club-logos');

DROP POLICY IF EXISTS "Authenticated users can update club logos" ON storage.objects;
CREATE POLICY "Authenticated users can update club logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'club-logos')
  WITH CHECK (bucket_id = 'club-logos');

DROP POLICY IF EXISTS "Authenticated users can delete club logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete club logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'club-logos');
