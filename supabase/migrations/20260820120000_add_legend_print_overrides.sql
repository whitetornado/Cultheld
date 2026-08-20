/*
  # Per-legend print area overrides

  ## Why
  The print area (position/size/fit) for a legend's artwork on a shirt is
  currently only configurable per product_type + color combination
  (`product_configs`), shared by every legend and design. That works fine
  for football-legend artwork, which is consistently tall/portrait — but a
  landscape design (e.g. a wide "Away Days" motorway-sign graphic) contain-fit
  into that same tall box ends up as a small band, since the box itself is
  shaped for portrait artwork. Reshaping the shared box to fit one design
  would just break it for every legend.

  Instead of duplicating the whole product_configs system, this adds a single
  optional override per legend: when a row exists here, the frontend uses
  these print-area values instead of the selected product_config's, across
  every product type/color. Most legends will never have a row here and keep
  using the shared template as before — this is purely opt-in from the admin
  legend form.

  ## New table: legend_print_overrides
  - `legend_id` (uuid, unique) - one override per legend, cascades on delete
  - print_area_x/y/width/height - same meaning as product_configs
  - fit_mode, padding_percent, vertical_bias, max_fill_pct, min_visual_size

  ## Security
  - RLS enabled
  - Public read (needed to render the storefront)
  - Admin-only write, using the same is_admin JWT check as the other admin
    catalog tables (see 20260204202037_add_all_admin_policies.sql)
*/

CREATE TABLE IF NOT EXISTS legend_print_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legend_id uuid UNIQUE NOT NULL REFERENCES legends(id) ON DELETE CASCADE,
  print_area_x numeric NOT NULL DEFAULT 0.5,
  print_area_y numeric NOT NULL DEFAULT 0.35,
  print_area_width numeric NOT NULL DEFAULT 0.3,
  print_area_height numeric NOT NULL DEFAULT 0.4,
  fit_mode text NOT NULL DEFAULT 'smart_fit' CHECK (fit_mode IN ('contain', 'cover', 'smart_fit')),
  padding_percent numeric NOT NULL DEFAULT 0.05,
  vertical_bias numeric NOT NULL DEFAULT 0.5,
  max_fill_pct numeric NOT NULL DEFAULT 0.95,
  min_visual_size numeric NOT NULL DEFAULT 0.15,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legend_print_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view legend print overrides" ON legend_print_overrides;
CREATE POLICY "Anyone can view legend print overrides"
  ON legend_print_overrides FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can insert legend print overrides" ON legend_print_overrides;
CREATE POLICY "Admins can insert legend print overrides"
  ON legend_print_overrides FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

DROP POLICY IF EXISTS "Admins can update legend print overrides" ON legend_print_overrides;
CREATE POLICY "Admins can update legend print overrides"
  ON legend_print_overrides FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

DROP POLICY IF EXISTS "Admins can delete legend print overrides" ON legend_print_overrides;
CREATE POLICY "Admins can delete legend print overrides"
  ON legend_print_overrides FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
      (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
      false
    ) = true
  );

CREATE INDEX IF NOT EXISTS idx_legend_print_overrides_legend ON legend_print_overrides(legend_id);
