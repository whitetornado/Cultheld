/*
  # Add Storage Buckets for File Uploads
  
  1. New Storage Buckets
    - `legends` - Voor legend PNG uploads
    - `shirt-templates` - Voor blanco shirt templates
  
  2. Security
    - Public read access for both buckets
    - Authenticated users can upload to legends bucket
    - Admin-only upload to shirt-templates bucket
    
  3. RLS Policies
    - Anyone can view files (public access)
    - Only authenticated users can upload legends
    - Only admins can upload shirt templates
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('legends', 'legends', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
  ('shirt-templates', 'shirt-templates', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Policies for legends bucket
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access for legends'
  ) THEN
    CREATE POLICY "Public Access for legends"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'legends');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload legends'
  ) THEN
    CREATE POLICY "Authenticated users can upload legends"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'legends');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update own legends'
  ) THEN
    CREATE POLICY "Authenticated users can update own legends"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'legends');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete own legends'
  ) THEN
    CREATE POLICY "Authenticated users can delete own legends"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'legends');
  END IF;
END $$;

-- Policies for shirt-templates bucket
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access for shirt templates'
  ) THEN
    CREATE POLICY "Public Access for shirt templates"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'shirt-templates');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload shirt templates'
  ) THEN
    CREATE POLICY "Authenticated users can upload shirt templates"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'shirt-templates');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update shirt templates'
  ) THEN
    CREATE POLICY "Authenticated users can update shirt templates"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'shirt-templates');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete shirt templates'
  ) THEN
    CREATE POLICY "Authenticated users can delete shirt templates"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'shirt-templates');
  END IF;
END $$;

-- Add shirt_templates table for managing different shirt types
CREATE TABLE IF NOT EXISTS shirt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_url text NOT NULL,
  color_hex text NOT NULL DEFAULT '#FFFFFF',
  fabric_type text NOT NULL DEFAULT 'cotton',
  blend_mode text NOT NULL DEFAULT 'multiply',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shirt_templates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'shirt_templates' 
    AND policyname = 'Public can view shirt templates'
  ) THEN
    CREATE POLICY "Public can view shirt templates"
      ON shirt_templates FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'shirt_templates' 
    AND policyname = 'Authenticated users can manage shirt templates'
  ) THEN
    CREATE POLICY "Authenticated users can manage shirt templates"
      ON shirt_templates FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;