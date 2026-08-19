/*
  # Fix Security Definer View

  ## Summary
  Changes the customers_summary view from SECURITY DEFINER to SECURITY INVOKER.
  
  ## Issue
  SECURITY DEFINER views run with the privileges of the view creator, which can lead to
  privilege escalation vulnerabilities. Users could access data they shouldn't see.

  ## Solution
  Recreate the view as SECURITY INVOKER, which runs with the caller's privileges.
  Combined with RLS policies, this ensures proper access control.

  ## Security Impact
  - View now respects caller's privileges
  - Admins can see all customer data
  - Non-admins cannot access the view (protected by RLS on underlying tables)
*/

-- Drop the existing view
DROP VIEW IF EXISTS customers_summary CASCADE;

-- Recreate with SECURITY INVOKER
CREATE VIEW customers_summary 
WITH (security_invoker = true) 
AS
SELECT 
  customer_email,
  customer_name,
  COUNT(DISTINCT id) AS total_orders,
  SUM(total) AS total_spent,
  MAX(created_at) AS last_order_date,
  MIN(created_at) AS first_order_date
FROM orders
GROUP BY customer_email, customer_name;

-- Add comment explaining the security model
COMMENT ON VIEW customers_summary IS 'Customer summary view with SECURITY INVOKER - respects caller privileges and RLS policies';
