/*
  # Scope legend print overrides per product type

  ## Why
  `legend_print_overrides` was originally one row per legend, applied to
  every product type (T-shirt, hoodie, sweater) at once. In practice a
  print box tuned while previewing on a T-shirt (portrait, tall) does not
  suit a hoodie or sweater (different garment shape/print area), so the
  override needs to be configurable per (legend, product type) combination
  instead of per legend alone.

  ## Changes
  - Add `product_type_id` (references product_types).
  - Backfill existing rows as 'tshirt' — every override so far was created
    while the admin form's product-type preview defaulted to the first
    product type (T-shirt), so this preserves current behavior for legends
    that already have an override (e.g. "Away Days").
  - Replace the single-column UNIQUE(legend_id) constraint with a composite
    UNIQUE(legend_id, product_type_id), so a legend can now have up to one
    override per product type instead of exactly one overall.

  ## Security
  RLS policies are unaffected (still legend_id/product_type_id-agnostic
  public read, admin-only write) — no changes needed there.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legend_print_overrides' AND column_name = 'product_type_id'
  ) THEN
    ALTER TABLE legend_print_overrides
      ADD COLUMN product_type_id text REFERENCES product_types(id);
  END IF;
END $$;

UPDATE legend_print_overrides
SET product_type_id = 'tshirt'
WHERE product_type_id IS NULL;

ALTER TABLE legend_print_overrides
  ALTER COLUMN product_type_id SET NOT NULL;

ALTER TABLE legend_print_overrides
  DROP CONSTRAINT IF EXISTS legend_print_overrides_legend_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'legend_print_overrides_legend_id_product_type_id_key'
  ) THEN
    ALTER TABLE legend_print_overrides
      ADD CONSTRAINT legend_print_overrides_legend_id_product_type_id_key
      UNIQUE (legend_id, product_type_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_legend_print_overrides_legend_product_type
  ON legend_print_overrides(legend_id, product_type_id);
