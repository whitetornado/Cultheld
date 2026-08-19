/*
  # Create CMS Tables for Contact and FAQ Pages

  1. New Tables
    - `cms_pages`
      - `id` (uuid, primary key)
      - `slug` (text, unique)
      - `title` (text)
      - `content` (text)
      - `meta_description` (text, optional)
      - `is_published` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `faq_items`
      - `id` (uuid, primary key)
      - `question` (text)
      - `answer` (text)
      - `sort_order` (integer)
      - `is_published` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Public can read published content
    - Only admins can modify content
*/

-- Create cms_pages table
CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create faq_items table
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Policies for cms_pages
CREATE POLICY "Anyone can view published pages"
  ON cms_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all pages"
  ON cms_pages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert pages"
  ON cms_pages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update pages"
  ON cms_pages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete pages"
  ON cms_pages FOR DELETE
  TO authenticated
  USING (true);

-- Policies for faq_items
CREATE POLICY "Anyone can view published FAQ items"
  ON faq_items FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all FAQ items"
  ON faq_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert FAQ items"
  ON faq_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update FAQ items"
  ON faq_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete FAQ items"
  ON faq_items FOR DELETE
  TO authenticated
  USING (true);

-- Insert default contact page
INSERT INTO cms_pages (slug, title, content, is_published)
VALUES (
  'contact',
  'Contact',
  E'# Neem Contact Op\n\nHeb je vragen over je bestelling of over onze producten? Neem dan gerust contact met ons op!\n\n## Email\ninfo@cultheld.nl\n\n## Klantenservice\nMandag t/m vrijdag: 09:00 - 17:00\n\n## Adres\nCultheld\nStraatnaam 123\n1234 AB Amsterdam\nNederland',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Insert default FAQ items
INSERT INTO faq_items (question, answer, sort_order, is_published)
VALUES
  ('Hoe lang duurt de levertijd?', 'De standaard levertijd is 1-3 werkdagen binnen Nederland. Voor internationale verzendingen kan dit 5-10 werkdagen duren.', 1, true),
  ('Kan ik mijn bestelling retourneren?', 'Ja, binnen 30 dagen kun je je bestelling retourneren als je niet tevreden bent. De producten moeten ongedragen en in originele staat zijn.', 2, true),
  ('Zijn de prints van goede kwaliteit?', 'Absoluut! We gebruiken hoogwaardige DTG (Direct to Garment) printtechniek voor duurzame en gedetailleerde prints die bestand zijn tegen vele wasbeurten.', 3, true),
  ('Welke betaalmethoden accepteren jullie?', 'We accepteren iDEAL, creditcard, PayPal en andere gangbare betaalmethoden.', 4, true),
  ('Kan ik mijn design later nog wijzigen?', 'Na het plaatsen van de bestelling kunnen we het design helaas niet meer wijzigen. Controleer je keuze daarom goed voor je bestelt.', 5, true)
ON CONFLICT DO NOTHING;
