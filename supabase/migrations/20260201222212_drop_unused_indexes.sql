/*
  # Drop Unused Indexes

  ## Summary
  Removes indexes that are not being used by any queries to improve database performance.
  Unused indexes consume storage space and slow down write operations without providing query benefits.

  ## Indexes Removed
  - idx_clubs_season_id
  - idx_product_variants_product_type_id
  - idx_mockup_placements_product_type_id
  - idx_cart_items_legend_id
  - idx_cart_items_product_variant_id
  - idx_legends_club_id
  - idx_orders_user_id
  - idx_order_items_legend_id
  - idx_order_items_order_id
  - idx_order_items_product_variant_id
  - idx_product_configs_product_type_id
  - idx_order_status_history_changed_by
  - idx_contact_tracking_ip
  - idx_contact_tracking_email
  - idx_webhook_logs_mollie_payment_id
  - idx_webhook_logs_purchase_id
  - idx_webhook_logs_created_at
  - idx_webhook_logs_status
  - idx_payments_mollie_id
  - idx_purchases_status
  - idx_purchases_return_token_hash
  - idx_purchases_mollie_payment_id
  - idx_purchases_product_id

  Note: Foreign key constraints automatically create indexes, so these manual indexes are redundant.
*/

DROP INDEX IF EXISTS idx_clubs_season_id;
DROP INDEX IF EXISTS idx_product_variants_product_type_id;
DROP INDEX IF EXISTS idx_mockup_placements_product_type_id;
DROP INDEX IF EXISTS idx_cart_items_legend_id;
DROP INDEX IF EXISTS idx_cart_items_product_variant_id;
DROP INDEX IF EXISTS idx_legends_club_id;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_order_items_legend_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_variant_id;
DROP INDEX IF EXISTS idx_product_configs_product_type_id;
DROP INDEX IF EXISTS idx_order_status_history_changed_by;
DROP INDEX IF EXISTS idx_contact_tracking_ip;
DROP INDEX IF EXISTS idx_contact_tracking_email;
DROP INDEX IF EXISTS idx_webhook_logs_mollie_payment_id;
DROP INDEX IF EXISTS idx_webhook_logs_purchase_id;
DROP INDEX IF EXISTS idx_webhook_logs_created_at;
DROP INDEX IF EXISTS idx_webhook_logs_status;
DROP INDEX IF EXISTS idx_payments_mollie_id;
DROP INDEX IF EXISTS idx_purchases_status;
DROP INDEX IF EXISTS idx_purchases_return_token_hash;
DROP INDEX IF EXISTS idx_purchases_mollie_payment_id;
DROP INDEX IF EXISTS idx_purchases_product_id;
