import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface OrderItemMetadata {
  legend_name: string;
  product_type_name: string;
  color_name: string;
  size: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  mockup_preview_url: string;
  preview_url: string;
}

export interface CreatePurchaseParams {
  product_slug: string;
  customer_email: string;
  customer_name: string;
  metadata?: {
    legend_id?: string;
    legend_name?: string;
    product_type?: string;
    color?: string;
    size?: string;
    quantity?: number;
    mockup_preview_url?: string;
    shipping_address?: any;
    billing_address?: any;
    subtotal?: string;
    shipping_cost?: string;
    total?: string;
    customer_phone?: string;
    items?: OrderItemMetadata[];
  };
}

export interface Purchase {
  id: string;
  user_id: string | null;
  product_id: string;
  customer_email: string;
  customer_name: string;
  amount_value: string;
  currency: string;
  status: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  purchase_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  checkout_url: string;
  amount_value: string;
  currency: string;
  status: string;
  method: string | null;
  webhook_called_at: string | null;
  paid_at: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface PaymentStatusResponse {
  purchase: Purchase;
  payment: Payment | null;
  payment_status: string | null;
  last_synced_at: string;
  sync_result?: {
    synced: boolean;
    payment_status?: string;
    status_changed?: boolean;
    error?: string;
  };
}

export async function createPurchase(params: CreatePurchaseParams): Promise<{ purchase: Purchase; return_token: string }> {
  const { data, error } = await supabase.functions.invoke('purchases-create', {
    body: params,
  });

  if (error) {
    console.error('Purchase creation error:', error);
    throw new Error(error.message || 'Failed to create purchase');
  }

  if (!data || !data.purchase || !data.return_token) {
    throw new Error('Invalid response from server');
  }

  return { purchase: data.purchase, return_token: data.return_token };
}

export async function createStripeCheckout(purchaseId: string, returnToken: string): Promise<{ payment: Payment; checkout_url: string }> {
  const { data, error } = await supabase.functions.invoke('stripe-create-checkout-session', {
    body: { purchase_id: purchaseId, return_token: returnToken },
  });

  if (error) {
    console.error('Payment creation error:', error);
    throw new Error(error.message || 'Failed to create payment');
  }

  if (!data || !data.checkout_url) {
    throw new Error('Invalid response from server');
  }

  return data;
}

export async function getPaymentStatus(purchaseId: string, token?: string): Promise<PaymentStatusResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('purchase_id', purchaseId);
  if (token) {
    queryParams.append('token', token);
  }

  const url = `${SUPABASE_URL}/functions/v1/stripe-payment-status?${queryParams.toString()}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Payment status error:', errorText);
    throw new Error('Failed to get payment status');
  }

  return await response.json();
}

export function getProductSlugFromCart(items: any[]): string {
  if (items.length === 0) return 'custom-legend-tee';

  const firstItem = items[0];
  const productType = firstItem.productType?.toLowerCase() || 'tee';

  if (productType.includes('hoodie')) {
    return 'custom-legend-hoodie';
  } else if (productType.includes('sweater') || productType.includes('sweat')) {
    return 'custom-legend-sweater';
  } else {
    return 'custom-legend-tee';
  }
}
