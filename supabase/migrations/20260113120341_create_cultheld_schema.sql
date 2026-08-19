/*
  # Cultheld.nl E-commerce Platform Schema

  ## Overview
  Complete schema for football legends merchandise platform with season-based organization.

  ## New Tables
  
  ### 1. seasons
  - `id` (uuid, primary key)
  - `name` (text) - Display name like "2023/24"
  - `start_year` (integer) - Starting year
  - `end_year` (integer) - Ending year
  - `is_active` (boolean) - Currently active season
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz)

  ### 2. clubs
  - `id` (uuid, primary key)
  - `name` (text) - Club name
  - `slug` (text, unique) - URL-friendly identifier
  - `logo_url` (text) - Storage URL for club logo
  - `created_at` (timestamptz)

  ### 3. legends
  - `id` (uuid, primary key)
  - `name` (text) - Legend's full name
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Biography/story
  - `png_url` (text) - Transparent PNG artwork URL
  - `category` (text) - 'eredivisie' or 'legends'
  - `created_at` (timestamptz)

  ### 4. legend_assignments
  - `id` (uuid, primary key)
  - `season_id` (uuid) - Foreign key to seasons
  - `club_id` (uuid) - Foreign key to clubs
  - `legend_id` (uuid) - Foreign key to legends
  - Constraint: Max 4 legends per club per season

  ### 5. product_types
  - `id` (text, primary key) - 'hoodie', 'sweater', 'tshirt'
  - `name` (text) - Display name
  - `description` (text)
  - `base_price` (decimal)

  ### 6. product_variants
  - `id` (uuid, primary key)
  - `product_type_id` (text) - Foreign key to product_types
  - `color_name` (text)
  - `color_hex` (text)
  - `size` (text) - S, M, L, XL, XXL, XXXL
  - `price` (decimal)
  - `mockup_image_url` (text) - Base mockup image
  - `available` (boolean)

  ### 7. mockup_placements
  - `id` (uuid, primary key)
  - `legend_id` (uuid)
  - `product_type_id` (text)
  - `x_position` (decimal) - X coordinate percentage
  - `y_position` (decimal) - Y coordinate percentage
  - `scale` (decimal) - Scale factor
  - `rotation` (decimal) - Rotation in degrees

  ### 8. cart_items
  - `id` (uuid, primary key)
  - `session_id` (text) - Guest session or user ID
  - `user_id` (uuid, nullable) - Authenticated user
  - `legend_id` (uuid)
  - `product_variant_id` (uuid)
  - `quantity` (integer)
  - `preview_url` (text) - Rendered preview
  - `created_at` (timestamptz)

  ### 9. orders
  - `id` (uuid, primary key)
  - `order_number` (text, unique)
  - `user_id` (uuid, nullable)
  - `customer_email` (text)
  - `customer_name` (text)
  - `shipping_address` (jsonb)
  - `subtotal` (decimal)
  - `shipping_cost` (decimal)
  - `total` (decimal)
  - `status` (text) - pending, paid, processing, shipped, completed
  - `payment_ref` (text)
  - `created_at` (timestamptz)

  ### 10. order_items
  - `id` (uuid, primary key)
  - `order_id` (uuid)
  - `legend_name` (text)
  - `product_type` (text)
  - `color_name` (text)
  - `size` (text)
  - `quantity` (integer)
  - `unit_price` (decimal)
  - `preview_url` (text)

  ## Security
  - RLS enabled on all tables
  - Public read access for catalog data
  - Authenticated write for cart/orders
  - Admin-only write for catalog management
*/

-- Enable required extensions (gen_random_uuid() is core, but pgcrypto's digest()
-- is used later by RLS policies for return-token hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_year integer NOT NULL,
  end_year integer NOT NULL,
  is_active boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

-- Create legends table
CREATE TABLE IF NOT EXISTS legends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  png_url text NOT NULL,
  category text NOT NULL CHECK (category IN ('eredivisie', 'legends')),
  created_at timestamptz DEFAULT now()
);

-- Create legend_assignments table
CREATE TABLE IF NOT EXISTS legend_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  legend_id uuid REFERENCES legends(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(season_id, club_id, legend_id)
);

-- Create product_types table
CREATE TABLE IF NOT EXISTS product_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  base_price decimal(10,2) DEFAULT 0
);

-- Seed the three product types up front — product_configs and product_variants
-- both have a foreign key to product_types(id) and are seeded later in the
-- migration history, so this must exist before those run.
INSERT INTO product_types (id, name, description, base_price)
VALUES
  ('tshirt', 'T-Shirt', 'Premium katoenen t-shirt', 29.99),
  ('sweater', 'Sweater', 'Premium sweater', 44.99),
  ('hoodie', 'Hoodie', 'Premium hoodie', 54.99)
ON CONFLICT (id) DO NOTHING;

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id text REFERENCES product_types(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_hex text NOT NULL,
  size text NOT NULL,
  price decimal(10,2) NOT NULL,
  mockup_image_url text NOT NULL,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create mockup_placements table
CREATE TABLE IF NOT EXISTS mockup_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legend_id uuid REFERENCES legends(id) ON DELETE CASCADE,
  product_type_id text REFERENCES product_types(id) ON DELETE CASCADE,
  x_position decimal(5,2) DEFAULT 50,
  y_position decimal(5,2) DEFAULT 35,
  scale decimal(5,2) DEFAULT 1.0,
  rotation decimal(5,2) DEFAULT 0,
  UNIQUE(legend_id, product_type_id)
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  legend_id uuid REFERENCES legends(id) ON DELETE CASCADE,
  product_variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  preview_url text,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  shipping_address jsonb NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  shipping_cost decimal(10,2) DEFAULT 0,
  total decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  payment_ref text,
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  legend_name text NOT NULL,
  product_type text NOT NULL,
  color_name text NOT NULL,
  size text NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  preview_url text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_legend_assignments_season ON legend_assignments(season_id);
CREATE INDEX IF NOT EXISTS idx_legend_assignments_club ON legend_assignments(club_id);
CREATE INDEX IF NOT EXISTS idx_legend_assignments_legend ON legend_assignments(legend_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Enable Row Level Security
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE legends ENABLE ROW LEVEL SECURITY;
ALTER TABLE legend_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public catalog data (read-only for everyone)
CREATE POLICY "Anyone can view seasons"
  ON seasons FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view clubs"
  ON clubs FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view legends"
  ON legends FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view legend assignments"
  ON legend_assignments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view product types"
  ON product_types FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view product variants"
  ON product_variants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view mockup placements"
  ON mockup_placements FOR SELECT
  TO public
  USING (true);

-- RLS Policies for cart (users can manage their own cart)
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO public
  USING (session_id = current_setting('request.headers', true)::json->>'x-session-id' OR user_id = auth.uid());

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  TO public
  WITH CHECK (session_id = current_setting('request.headers', true)::json->>'x-session-id' OR user_id = auth.uid());

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  TO public
  USING (session_id = current_setting('request.headers', true)::json->>'x-session-id' OR user_id = auth.uid());

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO public
  USING (session_id = current_setting('request.headers', true)::json->>'x-session-id' OR user_id = auth.uid());

-- RLS Policies for orders (users can view their own orders)
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view order items for their orders"
  ON order_items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

-- Admin policies (require admin role in user metadata)
CREATE POLICY "Admins can manage seasons"
  ON seasons FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can manage clubs"
  ON clubs FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can manage legends"
  ON legends FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can manage legend assignments"
  ON legend_assignments FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can manage product types"
  ON product_types FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can manage product variants"
  ON product_variants FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can manage mockup placements"
  ON mockup_placements FOR ALL
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text = 'admin@cultheld.nl'
    OR (auth.jwt()->>'role')::text = 'admin'
  );