/*
  # Fix Security Issues with View and Function

  1. Changes
    - Recreate customers_summary view without SECURITY DEFINER
    - Fix handle_admin_user function to have stable search_path
    - Both changes improve security posture

  2. Security
    - Views with SECURITY DEFINER can potentially bypass RLS
    - Functions with mutable search_path are vulnerable to search path attacks
    - Setting search_path explicitly prevents injection attacks
*/

-- Drop and recreate customers_summary view without SECURITY DEFINER
DROP VIEW IF EXISTS customers_summary;

CREATE VIEW customers_summary AS
SELECT 
  customer_email,
  customer_name,
  count(DISTINCT id) AS total_orders,
  sum(total) AS total_spent,
  max(created_at) AS last_order_date,
  min(created_at) AS first_order_date
FROM orders
GROUP BY customer_email, customer_name;

-- Recreate handle_admin_user function with stable search_path
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_admin_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- If user_metadata contains role = 'admin', set it in app_metadata
  IF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    NEW.raw_app_meta_data = jsonb_set(
      COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_admin_user_created
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_user();