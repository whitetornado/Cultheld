import { useState, useEffect } from 'react';
import { RefreshCw, Database, Package, CreditCard, Webhook } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';
import { useRouter } from '../../lib/router';

interface DiagnosticsData {
  products_count: number;
  purchases_count: number;
  payments_count: number;
  webhook_logs_count: number;
  recent_purchases: Array<{
    id: string;
    customer_email: string;
    amount_value: string;
    status: string;
    created_at: string;
  }>;
  recent_payments: Array<{
    id: string;
    stripe_checkout_session_id: string;
    status: string;
    amount_value: string;
    created_at: string;
  }>;
  recent_webhooks: Array<{
    id: string;
    stripe_event_id: string | null;
    stripe_event_type: string | null;
    status: string;
    received_at: string;
    created_at: string;
  }>;
}

export const Diagnostics = () => {
  const { navigate } = useRouter();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DiagnosticsData | null>(null);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const isAdmin = user.email === 'admin@cultheld.nl' || user.app_metadata?.is_admin === true;

      if (!isAdmin) {
        showError('Geen toegang');
        navigate('/');
        return;
      }

      const [
        productsResult,
        purchasesCountResult,
        paymentsCountResult,
        webhookLogsCountResult,
        recentPurchasesResult,
        recentPaymentsResult,
        recentWebhooksResult,
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('purchases').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }),
        supabase.from('webhook_logs').select('id', { count: 'exact', head: true }),
        supabase
          .from('purchases')
          .select('id, customer_email, amount_value, status, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('payments')
          .select('id, stripe_checkout_session_id, status, amount_value, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('webhook_logs')
          .select('id, stripe_event_id, stripe_event_type, status, received_at, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      setData({
        products_count: productsResult.count || 0,
        purchases_count: purchasesCountResult.count || 0,
        payments_count: paymentsCountResult.count || 0,
        webhook_logs_count: webhookLogsCountResult.count || 0,
        recent_purchases: recentPurchasesResult.data || [],
        recent_payments: recentPaymentsResult.data || [],
        recent_webhooks: recentWebhooksResult.data || [],
      });
    } catch (err) {
      console.error('Error loading diagnostics:', err);
      showError('Fout bij laden van diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      created: { bg: 'bg-gray-100', text: 'text-gray-700' },
      pending_payment: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      paid: { bg: 'bg-green-100', text: 'text-green-700' },
      failed: { bg: 'bg-red-100', text: 'text-red-700' },
      open: { bg: 'bg-blue-100', text: 'text-blue-700' },
      canceled: { bg: 'bg-gray-100', text: 'text-gray-700' },
      expired: { bg: 'bg-orange-100', text: 'text-orange-700' },
      received: { bg: 'bg-blue-100', text: 'text-blue-700' },
      processed: { bg: 'bg-green-100', text: 'text-green-700' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Geen data beschikbaar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Diagnostics</h1>
            <p className="text-gray-600 mt-2">Systeem overzicht en recent activity</p>
          </div>
          <button
            onClick={loadDiagnostics}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={20} />
            Vernieuwen
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Database className="text-blue-600" size={24} />
              <span className="text-gray-600">Products</span>
            </div>
            <p className="text-3xl font-bold">{data.products_count}</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="text-green-600" size={24} />
              <span className="text-gray-600">Purchases</span>
            </div>
            <p className="text-3xl font-bold">{data.purchases_count}</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="text-purple-600" size={24} />
              <span className="text-gray-600">Payments</span>
            </div>
            <p className="text-3xl font-bold">{data.payments_count}</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Webhook className="text-orange-600" size={24} />
              <span className="text-gray-600">Webhook Logs</span>
            </div>
            <p className="text-3xl font-bold">{data.webhook_logs_count}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Purchases</h2>
            <div className="space-y-3">
              {data.recent_purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{purchase.customer_email}</p>
                    <p className="text-sm text-gray-600">€{purchase.amount_value}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(purchase.status)}
                    <p className="text-xs text-gray-500">
                      {new Date(purchase.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
            <div className="space-y-3">
              {data.recent_payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">{payment.stripe_checkout_session_id}</p>
                    <p className="text-sm text-gray-600">€{payment.amount_value}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(payment.status)}
                    <p className="text-xs text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Webhook size={24} />
            Recent Webhook Logs
          </h2>
          <div className="space-y-3">
            {data.recent_webhooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Webhook size={48} className="mx-auto mb-2 opacity-30" />
                <p>Nog geen webhook calls ontvangen</p>
              </div>
            ) : (
              data.recent_webhooks.map((webhook) => (
                <div key={webhook.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm truncate font-semibold">{webhook.stripe_event_id || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{webhook.stripe_event_type}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(webhook.status)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    <span>
                      Ontvangen: {new Date(webhook.received_at || webhook.created_at).toLocaleString('nl-NL')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
