/*
  # Add 'design' as a legends category

  ## Why
  Cultheld wants a product line that isn't tied to a football legend at all —
  standalone graphic designs (e.g. an "Away Days" motorway-sign print) sold
  on the same t-shirts/hoodies/sweaters. The `legends` table already models
  everything a product needs (name, slug, png_url, bio, product config via
  product_types/product_variants) and already supports a legend with no club
  (`club_id` nullable, used today for 'world' category legends), so the
  cheapest correct model is a third category value rather than a parallel
  table: `category = 'design'`, `club_id = null`, no `legend_assignments`
  row. Every existing piece (cart, checkout, mockup preview, order emails,
  sitemap) already works generically off `legends` and doesn't care about
  category, so this needs no other schema change.

  ## Changes
  - Drop the existing `legends_category_check` constraint
  - Add it back with `'design'` included alongside `'eredivisie'` and `'world'`
*/

ALTER TABLE legends DROP CONSTRAINT IF EXISTS legends_category_check;

ALTER TABLE legends ADD CONSTRAINT legends_category_check
  CHECK (category IN ('eredivisie', 'world', 'design'));
