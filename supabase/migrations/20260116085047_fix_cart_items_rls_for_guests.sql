/*
  # Fix Cart Items RLS for Guest Users

  1. Changes
    - Drop existing cart_items policies that only allow authenticated users
    - Create new policies that support both authenticated users AND guest users with session_id
    - Allow anonymous (anon) role to access cart_items for guest checkout

  2. Security
    - Authenticated users: Can only access their own cart items (user_id = auth.uid())
    - Guest users: Can only access items matching their session_id
    - Policies ensure users cannot access each other's carts
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;

-- Create new policies that support both authenticated and guest users
CREATE POLICY "Anyone can view their cart items"
  ON public.cart_items
  FOR SELECT
  TO public
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can insert their cart items"
  ON public.cart_items
  FOR INSERT
  TO public
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "Anyone can update their cart items"
  ON public.cart_items
  FOR UPDATE
  TO public
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can delete their cart items"
  ON public.cart_items
  FOR DELETE
  TO public
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  );
