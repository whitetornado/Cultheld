/*
  # Add Admin Helper Function
  
  ## Probleem
  Admin RLS policies werken niet consistent
  
  ## Oplossing
  Maak een helper functie die checkt of de huidige user admin is
  Gebruik deze functie in alle admin policies voor consistentie
*/

-- Drop bestaande functie
DROP FUNCTION IF EXISTS is_admin();

-- Maak admin check functie
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'admin@cultheld.nl'
  );
END;
$$;

-- Grant aan authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Update alle admin policies om deze functie te gebruiken

-- Customer Profiles
DROP POLICY IF EXISTS "Admin full access" ON customer_profiles;
CREATE POLICY "Admin full access"
  ON customer_profiles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Purchases
DROP POLICY IF EXISTS "Admin full access purchases" ON purchases;
CREATE POLICY "Admin full access purchases"
  ON purchases
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Payments
DROP POLICY IF EXISTS "Admin full access payments" ON payments;
CREATE POLICY "Admin full access payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
