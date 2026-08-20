/*
  # Allow authenticated users to claim guest cart items on login

  ## Why
  Cart items are tied to a client-generated `session_id` while browsing as a
  guest. When someone logs in (or creates an account) partway through
  checkout — e.g. from the login banner on the Checkout page — the frontend
  now reassigns their guest cart_items rows to `user_id = auth.uid()`
  instead of leaving them behind, so the cart doesn't appear to empty out
  just because they authenticated.

  The existing "Users can update their cart items" policy
  (20260202090953_fix_cart_items_policies_for_guest_checkout.sql) only lets
  an authenticated user update rows that ALREADY have user_id = auth.uid().
  A guest row has user_id IS NULL, so that claiming update was silently
  dropped by RLS (0 rows affected, no error) — this adds the missing policy
  to allow exactly that one transition: NULL -> own user id.

  ## Security
  Any authenticated user could in principle claim any orphaned guest cart
  row this way, but cart_items carry no payment or personal data beyond a
  product selection, and guest cart access already relies on the client-side
  session_id rather than a server-verified secret (see the referenced
  migration's own security notes) — so this doesn't introduce a new class of
  exposure, only the one additional transition needed for the login-merge.
*/

DROP POLICY IF EXISTS "Authenticated users can claim guest cart items" ON cart_items;
CREATE POLICY "Authenticated users can claim guest cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (user_id = auth.uid());
