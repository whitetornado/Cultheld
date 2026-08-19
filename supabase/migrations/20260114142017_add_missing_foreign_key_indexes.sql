/*
  # Add Missing Foreign Key Indexes for Performance

  1. Changes
    - Add indexes for all foreign key columns that don't have covering indexes
    - This significantly improves query performance for joins and foreign key lookups
    - Affects: cart_items, clubs, legends, mockup_placements, order_items, order_status_history, orders, product_configs, product_variants

  2. Performance
    - Each index improves JOIN performance
    - Reduces query execution time for foreign key lookups
    - Essential for production performance at scale
*/

-- Cart items foreign key indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_legend_id ON cart_items(legend_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_variant_id ON cart_items(product_variant_id);

-- Clubs foreign key indexes
CREATE INDEX IF NOT EXISTS idx_clubs_season_id ON clubs(season_id);

-- Legends foreign key indexes
CREATE INDEX IF NOT EXISTS idx_legends_club_id ON legends(club_id);

-- Mockup placements foreign key indexes
CREATE INDEX IF NOT EXISTS idx_mockup_placements_product_type_id ON mockup_placements(product_type_id);

-- Order items foreign key indexes
CREATE INDEX IF NOT EXISTS idx_order_items_legend_id ON order_items(legend_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_variant_id ON order_items(product_variant_id);

-- Order status history foreign key indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by ON order_status_history(changed_by);

-- Orders foreign key indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Product configs foreign key indexes
CREATE INDEX IF NOT EXISTS idx_product_configs_product_type_id ON product_configs(product_type_id);

-- Product variants foreign key indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_type_id ON product_variants(product_type_id);