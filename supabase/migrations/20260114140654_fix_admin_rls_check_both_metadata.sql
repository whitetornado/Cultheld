/*
  # Fix Admin RLS Policies to Check Both Metadata Fields

  1. Changes
    - Update all admin RLS policies to check BOTH app_metadata AND user_metadata for role='admin'
    - This makes the system more robust by checking both possible locations for the admin role
    - Applies to: seasons, legends, clubs, shirt_templates, order_status_history, contact_messages, legend_assignments, faq_items, cms_pages

  2. Security
    - Policies check authenticated users
    - Admin role must be present in EITHER app_metadata OR user_metadata
    - More flexible and robust admin authentication
*/

-- Drop and recreate policies for seasons
DROP POLICY IF EXISTS "Admins can insert seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can update seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can delete seasons" ON seasons;

CREATE POLICY "Admins can insert seasons"
  ON seasons FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can update seasons"
  ON seasons FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can delete seasons"
  ON seasons FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- Drop and recreate policies for legends
DROP POLICY IF EXISTS "Admins can insert legends" ON legends;
DROP POLICY IF EXISTS "Admins can update legends" ON legends;
DROP POLICY IF EXISTS "Admins can delete legends" ON legends;

CREATE POLICY "Admins can insert legends"
  ON legends FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can update legends"
  ON legends FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can delete legends"
  ON legends FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- Drop and recreate policies for clubs
DROP POLICY IF EXISTS "Admins can insert clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can update clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can delete clubs" ON clubs;

CREATE POLICY "Admins can insert clubs"
  ON clubs FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can update clubs"
  ON clubs FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can delete clubs"
  ON clubs FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- Drop and recreate policies for legend_assignments
DROP POLICY IF EXISTS "Admins can insert legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can update legend assignments" ON legend_assignments;
DROP POLICY IF EXISTS "Admins can delete legend assignments" ON legend_assignments;

CREATE POLICY "Admins can insert legend assignments"
  ON legend_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can update legend assignments"
  ON legend_assignments FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can delete legend assignments"
  ON legend_assignments FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- Drop and recreate policies for shirt_templates
DROP POLICY IF EXISTS "Admins can insert shirt templates" ON shirt_templates;
DROP POLICY IF EXISTS "Admins can update shirt templates" ON shirt_templates;
DROP POLICY IF EXISTS "Admins can delete shirt templates" ON shirt_templates;

CREATE POLICY "Admins can insert shirt templates"
  ON shirt_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can update shirt templates"
  ON shirt_templates FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can delete shirt templates"
  ON shirt_templates FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- Drop and recreate policies for order_status_history
DROP POLICY IF EXISTS "Admins can view all order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can insert order status history" ON order_status_history;

CREATE POLICY "Admins can view all order status history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can insert order status history"
  ON order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- Drop and recreate policies for contact_messages
DROP POLICY IF EXISTS "Admins can view all contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages" ON contact_messages;

CREATE POLICY "Admins can view all contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can delete contact messages"
  ON contact_messages FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- Drop and recreate policies for faq_items
DROP POLICY IF EXISTS "Admins can insert FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can update FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Admins can delete FAQ items" ON faq_items;

CREATE POLICY "Admins can insert FAQ items"
  ON faq_items FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can update FAQ items"
  ON faq_items FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can delete FAQ items"
  ON faq_items FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- Drop and recreate policies for cms_pages
DROP POLICY IF EXISTS "Admins can insert CMS pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can update CMS pages" ON cms_pages;
DROP POLICY IF EXISTS "Admins can delete CMS pages" ON cms_pages;

CREATE POLICY "Admins can insert CMS pages"
  ON cms_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can update CMS pages"
  ON cms_pages FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

CREATE POLICY "Admins can delete CMS pages"
  ON cms_pages FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );