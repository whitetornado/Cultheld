/*
  # Add Missing RLS Policies

  ## Summary
  Adds RLS policies to tables that have RLS enabled but no policies defined.
  Without policies, these tables are completely inaccessible even to authenticated users.

  ## Tables Fixed
  1. cms_pages - Public can view published pages, admins can view/edit all
  2. contact_submissions_tracking - Only system/admins can access
  3. faq_items - Public can view published items, admins can manage all
  4. order_status_history - Admins only
  5. payments - Admins and purchase owners
  6. products - Public can view all (product catalog)
  7. purchases - Customers can view their own, admins can view all
  8. webhook_logs - Admins only (sensitive operational data)

  ## Security Approach
  - Public data: Accessible to everyone
  - Customer data: Owners + admins
  - System data: Admins only
  - Sensitive logs: Admins only
*/

-- CMS Pages: Public can view published, admins can manage all
CREATE POLICY "View published cms pages" ON cms_pages
  FOR SELECT
  TO authenticated, anon
  USING (
    is_published = true 
    OR 
    (SELECT is_admin())
  );

CREATE POLICY "Admins can insert cms pages" ON cms_pages
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Admins can update cms pages" ON cms_pages
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Admins can delete cms pages" ON cms_pages
  FOR DELETE
  TO authenticated
  USING ((SELECT is_admin()));

-- Contact Submissions Tracking: Admins only (contains IP addresses)
CREATE POLICY "Admins can view contact tracking" ON contact_submissions_tracking
  FOR SELECT
  TO authenticated
  USING ((SELECT is_admin()));

CREATE POLICY "System can insert contact tracking" ON contact_submissions_tracking
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- FAQ Items: Public can view published, admins can manage all
CREATE POLICY "View published faq items" ON faq_items
  FOR SELECT
  TO authenticated, anon
  USING (
    is_published = true 
    OR 
    (SELECT is_admin())
  );

CREATE POLICY "Admins can insert faq items" ON faq_items
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Admins can update faq items" ON faq_items
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Admins can delete faq items" ON faq_items
  FOR DELETE
  TO authenticated
  USING ((SELECT is_admin()));

-- Order Status History: Admins only
CREATE POLICY "Admins can view order status history" ON order_status_history
  FOR SELECT
  TO authenticated
  USING ((SELECT is_admin()));

CREATE POLICY "Admins can insert order status history" ON order_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_admin()));

-- Payments: Admins and purchase owners can view
CREATE POLICY "View own or all payments" ON payments
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin())
    OR
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.mollie_payment_id = payments.mollie_payment_id
      AND purchases.customer_email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "System can insert payments" ON payments
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "System can update payments" ON payments
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Products: Everyone can view (product catalog)
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE
  TO authenticated
  USING ((SELECT is_admin()));

-- Purchases: Customers can view their own, admins can view all
CREATE POLICY "View own or all purchases" ON purchases
  FOR SELECT
  TO authenticated, anon
  USING (
    (SELECT is_admin())
    OR
    customer_email = (auth.jwt() ->> 'email')
    OR
    return_token_hash = encode(digest(current_setting('request.headers')::json->>'x-return-token', 'sha256'), 'hex')
  );

CREATE POLICY "System can insert purchases" ON purchases
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can update purchases" ON purchases
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- Webhook Logs: Admins only (sensitive operational data)
CREATE POLICY "Admins can view webhook logs" ON webhook_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT is_admin()));

CREATE POLICY "System can insert webhook logs" ON webhook_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
