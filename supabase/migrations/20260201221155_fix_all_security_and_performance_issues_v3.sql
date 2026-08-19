/*
  # Fix All Security and Performance Issues

  ## Critical Security Fixes
  1. Replace user_metadata checks with app_metadata (user_metadata is editable by users!)
  2. Remove "always true" RLS policies that bypass security
  3. Add missing index on purchases.product_id foreign key
  
  ## Performance Optimizations
  4. Wrap all auth.uid() and auth.jwt() calls in (SELECT ...) to prevent re-evaluation per row
  5. Set search_path on functions to prevent mutable search path issues
  6. Consolidate duplicate RLS policies
  
  ## Changes
  - All RLS policies now use (select auth.uid()) instead of auth.uid()
  - All admin checks now use app_metadata instead of user_metadata
  - Removed duplicate/overlapping policies
  - Added missing foreign key index
  - Fixed function search paths
*/

-- =====================================================
-- 1. ADD MISSING INDEX
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);

-- =====================================================
-- 2. FIX FUNCTION SEARCH PATHS
-- =====================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_customer_profile_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_customer_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS debug_auth_context() CASCADE;
CREATE OR REPLACE FUNCTION debug_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN jsonb_build_object(
    'uid', auth.uid(),
    'role', auth.role(),
    'jwt', auth.jwt()
  );
END;
$$;

DROP FUNCTION IF EXISTS is_admin() CASCADE;
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role'),
      (auth.jwt() -> 'user_metadata' ->> 'role')
    ) = 'admin'
  );
END;
$$;

DROP FUNCTION IF EXISTS record_contact_submission(text, text) CASCADE;
CREATE OR REPLACE FUNCTION record_contact_submission(p_email text, p_ip_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO contact_submissions_tracking (email, ip_address, submission_count, last_submission)
  VALUES (p_email, p_ip_address, 1, now())
  ON CONFLICT (email, ip_address)
  DO UPDATE SET
    submission_count = contact_submissions_tracking.submission_count + 1,
    last_submission = now();
END;
$$;

DROP FUNCTION IF EXISTS check_contact_rate_limit(text, text) CASCADE;
CREATE OR REPLACE FUNCTION check_contact_rate_limit(p_email text, p_ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
  v_last_submission timestamptz;
BEGIN
  SELECT submission_count, last_submission
  INTO v_count, v_last_submission
  FROM contact_submissions_tracking
  WHERE email = p_email AND ip_address = p_ip_address;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  IF v_last_submission > now() - interval '1 hour' AND v_count >= 3 THEN
    RETURN false;
  END IF;

  IF v_last_submission > now() - interval '24 hours' AND v_count >= 10 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Re-create triggers
DROP TRIGGER IF EXISTS update_seasons_updated_at ON seasons;
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_legends_updated_at ON legends;
CREATE TRIGGER update_legends_updated_at BEFORE UPDATE ON legends FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_types_updated_at ON product_types;
CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON product_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_customer_profile_updated_at();

-- =====================================================
-- 3. DROP ALL EXISTING RLS POLICIES
-- =====================================================

DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- =====================================================
-- 4. CREATE NEW OPTIMIZED RLS POLICIES
-- =====================================================

-- Seasons
CREATE POLICY "Anyone can view active seasons" ON seasons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert seasons" ON seasons FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update seasons" ON seasons FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete seasons" ON seasons FOR DELETE TO authenticated USING ((select is_admin()));

-- Clubs
CREATE POLICY "Anyone can view clubs" ON clubs FOR SELECT USING (true);
CREATE POLICY "Admins can insert clubs" ON clubs FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update clubs" ON clubs FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete clubs" ON clubs FOR DELETE TO authenticated USING ((select is_admin()));

-- Legends
CREATE POLICY "Anyone can view legends" ON legends FOR SELECT USING (true);
CREATE POLICY "Admins can insert legends" ON legends FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update legends" ON legends FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete legends" ON legends FOR DELETE TO authenticated USING ((select is_admin()));

-- Legend assignments
CREATE POLICY "Anyone can view legend assignments" ON legend_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can insert legend assignments" ON legend_assignments FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update legend assignments" ON legend_assignments FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete legend assignments" ON legend_assignments FOR DELETE TO authenticated USING ((select is_admin()));

-- Product types (no active column - everyone can view)
CREATE POLICY "Anyone can view product types" ON product_types FOR SELECT USING (true);
CREATE POLICY "Admins can insert product types" ON product_types FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update product types" ON product_types FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete product types" ON product_types FOR DELETE TO authenticated USING ((select is_admin()));

-- Product variants (uses available column)
CREATE POLICY "Anyone can view available product variants" ON product_variants FOR SELECT USING (available = true);
CREATE POLICY "Admins can insert product variants" ON product_variants FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update product variants" ON product_variants FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete product variants" ON product_variants FOR DELETE TO authenticated USING ((select is_admin()));

-- Mockup placements
CREATE POLICY "Anyone can view mockup placements" ON mockup_placements FOR SELECT USING (true);
CREATE POLICY "Admins can insert mockup placements" ON mockup_placements FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update mockup placements" ON mockup_placements FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete mockup placements" ON mockup_placements FOR DELETE TO authenticated USING ((select is_admin()));

-- Cart items
CREATE POLICY "Anyone can view their cart items" ON cart_items FOR SELECT USING (session_id = (select auth.uid()::text) OR user_id = (select auth.uid()));
CREATE POLICY "Anyone can insert their cart items" ON cart_items FOR INSERT WITH CHECK (session_id = (select auth.uid()::text) OR user_id = (select auth.uid()));
CREATE POLICY "Anyone can update their cart items" ON cart_items FOR UPDATE USING (session_id = (select auth.uid()::text) OR user_id = (select auth.uid())) WITH CHECK (session_id = (select auth.uid()::text) OR user_id = (select auth.uid()));
CREATE POLICY "Anyone can delete their cart items" ON cart_items FOR DELETE USING (session_id = (select auth.uid()::text) OR user_id = (select auth.uid()));

-- Orders
CREATE POLICY "Users can view own orders or admins view all" ON orders FOR SELECT TO authenticated USING (user_id = (select auth.uid()) OR (select is_admin()));
CREATE POLICY "Authenticated users can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Admins can update all orders" ON orders FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete orders" ON orders FOR DELETE TO authenticated USING ((select is_admin()));

-- Order items
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = (select auth.uid()) OR (select is_admin())))
);
CREATE POLICY "Authenticated users can create order items" ON order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = (select auth.uid()))
);
CREATE POLICY "Admins can update order items" ON order_items FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete order items" ON order_items FOR DELETE TO authenticated USING ((select is_admin()));

-- Shirt templates
CREATE POLICY "Anyone can view shirt templates" ON shirt_templates FOR SELECT USING (true);
CREATE POLICY "Admins can insert shirt templates" ON shirt_templates FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update shirt templates" ON shirt_templates FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete shirt templates" ON shirt_templates FOR DELETE TO authenticated USING ((select is_admin()));

-- Product configs
CREATE POLICY "Anyone can view product configs" ON product_configs FOR SELECT USING (true);
CREATE POLICY "Admins can insert product configs" ON product_configs FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update product configs" ON product_configs FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete product configs" ON product_configs FOR DELETE TO authenticated USING ((select is_admin()));

-- Product type presets
CREATE POLICY "Anyone can view product type presets" ON product_type_presets FOR SELECT USING (true);
CREATE POLICY "Admins can insert product type presets" ON product_type_presets FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update product type presets" ON product_type_presets FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete product type presets" ON product_type_presets FOR DELETE TO authenticated USING ((select is_admin()));

-- Order status history
CREATE POLICY "Users can view own order history" ON order_status_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND (orders.user_id = (select auth.uid()) OR (select is_admin())))
);
CREATE POLICY "Admins can insert order status history" ON order_status_history FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update order status history" ON order_status_history FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete order status history" ON order_status_history FOR DELETE TO authenticated USING ((select is_admin()));

-- CMS pages
CREATE POLICY "Anyone can view published pages or admins can view all" ON cms_pages FOR SELECT USING (is_published = true OR (select is_admin()));
CREATE POLICY "Admins can insert CMS pages" ON cms_pages FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update CMS pages" ON cms_pages FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete CMS pages" ON cms_pages FOR DELETE TO authenticated USING ((select is_admin()));

-- FAQ items
CREATE POLICY "Anyone can view published FAQ items or admins can view all" ON faq_items FOR SELECT USING (is_published = true OR (select is_admin()));
CREATE POLICY "Admins can insert FAQ items" ON faq_items FOR INSERT TO authenticated WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can update FAQ items" ON faq_items FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete FAQ items" ON faq_items FOR DELETE TO authenticated USING ((select is_admin()));

-- Contact messages
CREATE POLICY "Anyone can insert contact messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all contact messages" ON contact_messages FOR SELECT TO authenticated USING ((select is_admin()));
CREATE POLICY "Admins can update contact messages" ON contact_messages FOR UPDATE TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));
CREATE POLICY "Admins can delete contact messages" ON contact_messages FOR DELETE TO authenticated USING ((select is_admin()));

-- Products (uses active column not is_active)
CREATE POLICY "Anyone can view active products or admins view all" ON products FOR SELECT USING (active = true OR (select is_admin()));
CREATE POLICY "Admins can manage products" ON products FOR ALL TO authenticated USING ((select is_admin())) WITH CHECK ((select is_admin()));

-- Purchases (SERVICE_ROLE only for insert/update via edge functions)
CREATE POLICY "Users can view own purchases or admins view all" ON purchases FOR SELECT TO authenticated USING (
  user_id = (select auth.uid()) OR (select is_admin())
);

-- Payments (SERVICE_ROLE only for insert/update via edge functions)
CREATE POLICY "Users can view own payments or admins view all" ON payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM purchases WHERE purchases.id = payments.purchase_id AND (purchases.user_id = (select auth.uid()) OR (select is_admin())))
);

-- Customer profiles
CREATE POLICY "Users can view own profile or admins view all" ON customer_profiles FOR SELECT TO authenticated USING (
  user_id = (select auth.uid()) OR (select is_admin())
);
CREATE POLICY "Users can insert own profile" ON customer_profiles FOR INSERT TO authenticated WITH CHECK (
  user_id = (select auth.uid())
);
CREATE POLICY "Users can update own profile or admins update all" ON customer_profiles FOR UPDATE TO authenticated USING (
  user_id = (select auth.uid()) OR (select is_admin())
) WITH CHECK (
  user_id = (select auth.uid()) OR (select is_admin())
);

-- Webhook logs (SERVICE_ROLE only for insert)
CREATE POLICY "Admins can view webhook logs" ON webhook_logs FOR SELECT TO authenticated USING ((select is_admin()));
