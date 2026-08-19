/*
  # Add RLS Policies for Shirt Templates
  
  ## Changes
  - Add public read policy for shirt_templates
  - Add admin-only write policy for shirt_templates
  
  ## Security
  - Anyone can view shirt templates
  - Only admins can create/update/delete shirt templates
*/

CREATE POLICY "Anyone can view shirt templates"
  ON shirt_templates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage shirt templates"
  ON shirt_templates FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email') = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role') = 'admin'
  );