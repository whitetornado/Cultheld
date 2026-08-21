export interface Season {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  season_id: string | null;
  city: string | null;
  created_at: string;
}

export interface Legend {
  id: string;
  name: string;
  slug: string;
  bio: string;
  png_url: string;
  category: 'eredivisie' | 'world' | 'design';
  club_id: string | null;
  all_time: boolean;
  created_at: string;
}

export interface LegendAssignment {
  id: string;
  season_id: string;
  club_id: string;
  legend_id: string;
  created_at: string;
  legend?: Legend;
  season?: Season;
  club?: Club;
}

export interface ProductType {
  id: 'hoodie' | 'sweater' | 'tshirt';
  name: string;
  description: string;
  base_price: number;
}

export interface ProductVariant {
  id: string;
  product_type_id: string;
  color_name: string;
  color_hex: string;
  size: string;
  price: number;
  mockup_image_url: string;
  available: boolean;
  created_at: string;
}

export interface MockupPlacement {
  id: string;
  legend_id: string;
  product_type_id: string;
  x_position: number;
  y_position: number;
  scale: number;
  rotation: number;
}

export interface CartItem {
  id: string;
  session_id: string;
  user_id: string | null;
  legend_id: string;
  product_variant_id: string;
  quantity: number;
  preview_url: string | null;
  created_at: string;
  legend?: Legend;
  product_variant?: ProductVariant;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_email: string;
  customer_name: string;
  shipping_address: any;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  payment_ref: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  legend_name: string;
  product_type: string;
  color_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  preview_url: string | null;
  created_at: string;
}

export interface ShirtTemplate {
  id: string;
  name: string;
  template_url: string;
  color_hex: string;
  fabric_type: string;
  blend_mode: string;
  sort_order: number;
  created_at: string;
}

export interface ProductConfig {
  id: string;
  product_type_id: string;
  color_name: string;
  color_hex: string;
  mockup_template_url: string;
  blend_mode: string;
  is_default: boolean;
  sort_order: number;
  print_area_x: number;
  print_area_y: number;
  print_area_width: number;
  print_area_height: number;
  fit_mode: 'contain' | 'cover' | 'smart_fit';
  padding_percent: number;
  vertical_bias: number;
  max_fill_pct?: number;
  min_visual_size?: number;
  created_at: string;
}

export interface LegendPrintOverride {
  id: string;
  legend_id: string;
  product_type_id: string;
  print_area_x: number;
  print_area_y: number;
  print_area_width: number;
  print_area_height: number;
  fit_mode: 'contain' | 'cover' | 'smart_fit';
  padding_percent: number;
  vertical_bias: number;
  max_fill_pct: number;
  min_visual_size: number;
  created_at: string;
  updated_at: string;
}

export interface ProductTypePreset {
  id: string;
  product_type_id: string;
  print_area_x: number;
  print_area_y: number;
  print_area_width: number;
  print_area_height: number;
  fit_mode: 'contain' | 'cover' | 'smart_fit';
  padding_percent: number;
  vertical_bias: number;
  max_fill_pct?: number;
  min_visual_size?: number;
  created_at: string;
  updated_at: string;
}
