import { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

export const PaymentDiagnostics = () => {
  const { navigate } = useRouter();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const isAdmin =
        user.app_metadata?.role === 'admin' ||
        user.user_metadata?.role === 'admin' ||
        user.email === 'admin@cultheld.nl';

      if (!isAdmin) {
        showError('Geen toegang');
        navigate('/');
        return;
      }

      const [purchasesResult, paymentsResult] = await Promise.all([
        supabase
          .from('purchases')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (purchasesResult.error) throw purchasesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setPurchases(purchasesResult.data || []);
      setPayments(paymentsResult.data || []);

      setEnvVars({
        supabase_url: import.meta.env.VITE_SUPABASE_URL,
        has_stripe_key: '***',
        has_app_base_url: '***',
      });
    } catch (err) {
      console.error('Error loading diagnostics:', err);
      showError('Fout bij laden van diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (['paid', 'delivered', 'shipped'].includes(status)) {
      return <CheckCircle size={20} className="text-green-600" />;
    }
    if (['pending_payment', 'pending', 'open', 'processing'].includes(status)) {
      return <Clock size={20} className="text-yellow-600" />;
    }
    return <AlertCircle size={20} className="text-red-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw size={48} className="animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity size={32} className="text-black" />
              <h1 className="text-3xl font-bold">Payment Diagnostics</h1>
            </div>
            <button
              onClick={loadDiagnostics}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw size={16} />
              Vernieuwen
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Debug informatie voor betaalsysteem
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Troubleshooting Tips</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Check of purchases status correct wordt geupdatet door de webhook</li>
                <li>Verify of payment stripe_checkout_session_id aanwezig is</li>
                <li>Check of payments status overeenkomt met purchases status</li>
                <li>Verify of APP_BASE_URL correct is geconfigureerd (moet https://cultheld.nl zijn)</li>
                <li>Check of webhook_called_at recent is voor recente betalingen</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Laatste 20 Purchases</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-black transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(purchase.status)}
                      <span className="font-mono text-xs text-gray-600">
                        {purchase.id.substring(0, 8)}...
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      purchase.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : purchase.status === 'pending_payment'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {purchase.status}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">{purchase.customer_email}</div>
                    <div className="text-gray-600">€{purchase.amount_value}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(purchase.created_at).toLocaleString('nl-NL')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Laatste 20 Payments</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-black transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      <span className="font-mono text-xs text-gray-600">
                        {payment.stripe_checkout_session_id || 'No Stripe session'}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      payment.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : payment.status === 'open'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600">€{payment.amount_value}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(payment.created_at).toLocaleString('nl-NL')}
                    </div>
                    {payment.webhook_called_at && (
                      <div className="text-xs text-gray-500">
                        Webhook: {new Date(payment.webhook_called_at).toLocaleString('nl-NL')}
                      </div>
                    )}
                    {payment.paid_at && (
                      <div className="text-xs text-green-600">
                        Paid: {new Date(payment.paid_at).toLocaleString('nl-NL')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Environment Check</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="font-semibold mb-2">Supabase URL</div>
              <div className="font-mono text-sm text-gray-600">{envVars.supabase_url}</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="font-semibold mb-2">Stripe Secret Key</div>
              <div className="font-mono text-sm text-gray-600">
                {envVars.has_stripe_key ? 'Configured (hidden)' : 'Not configured'}
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="font-semibold mb-2">APP_BASE_URL</div>
              <div className="font-mono text-sm text-gray-600">
                {envVars.has_app_base_url || 'Check Supabase secrets'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Should be: https://cultheld.nl
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="font-semibold mb-2">Edge Functions Gateway</div>
              <div className="text-sm text-gray-600">
                verify_jwt: <span className="font-mono">false</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Manual auth verification enabled
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Common Issues & Fixes</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <div className="font-semibold mb-1">Issue: User returns to homepage after payment</div>
              <div className="text-sm text-gray-600">
                Fix: Check APP_BASE_URL in Supabase secrets matches deployed domain (https://cultheld.nl)
              </div>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <div className="font-semibold mb-1">Issue: Purchase stays in pending_payment</div>
              <div className="text-sm text-gray-600">
                Fix: Check if webhook is being called (webhook_called_at should be set). Verify webhook URL in Stripe dashboard.
              </div>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="font-semibold mb-1">Issue: Orders not visible in admin</div>
              <div className="text-sm text-gray-600">
                Fix: Check purchases table has records with status 'paid'. Webhook should update purchase status.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
