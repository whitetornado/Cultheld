/*
  # Add city to clubs (for city + club SEO targeting)

  ## Summary
  Adds a `city` column to `clubs` so product pages can target searches like
  "voetbalshirt Ajax Amsterdam" and so the sitemap/structured data can surface
  the city each club plays in.

  ## Changes
  - Add nullable `city text` column to `clubs`
  - Backfill the 18 seeded Eredivisie clubs with their home city
*/

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS city text;

UPDATE clubs SET city = 'Amsterdam' WHERE slug = 'ajax';
UPDATE clubs SET city = 'Eindhoven' WHERE slug = 'psv';
UPDATE clubs SET city = 'Rotterdam' WHERE slug = 'feyenoord';
UPDATE clubs SET city = 'Alkmaar' WHERE slug = 'az';
UPDATE clubs SET city = 'Utrecht' WHERE slug = 'fc-utrecht';
UPDATE clubs SET city = 'Enschede' WHERE slug = 'fc-twente';
UPDATE clubs SET city = 'Arnhem' WHERE slug = 'vitesse';
UPDATE clubs SET city = 'Heerenveen' WHERE slug = 'sc-heerenveen';
UPDATE clubs SET city = 'Groningen' WHERE slug = 'fc-groningen';
UPDATE clubs SET city = 'Rotterdam' WHERE slug = 'sparta-rotterdam';
UPDATE clubs SET city = 'Zwolle' WHERE slug = 'pec-zwolle';
UPDATE clubs SET city = 'Almelo' WHERE slug = 'heracles-almelo';
UPDATE clubs SET city = 'Sittard' WHERE slug = 'fortuna-sittard';
UPDATE clubs SET city = 'Deventer' WHERE slug = 'go-ahead-eagles';
UPDATE clubs SET city = 'Nijmegen' WHERE slug = 'nec';
UPDATE clubs SET city = 'Waalwijk' WHERE slug = 'rkc-waalwijk';
UPDATE clubs SET city = 'Volendam' WHERE slug = 'fc-volendam';
UPDATE clubs SET city = 'Rotterdam' WHERE slug = 'excelsior';
