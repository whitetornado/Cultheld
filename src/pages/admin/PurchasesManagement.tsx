import { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, Eye, Filter } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

interface Purchase {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name: string;
  amount_value: string;
  currency: string;
  status: string;
  created_at: string;
  metadata: any;
  payments: Array<{
    id: string;
    stripe_checkout_session_id: string;
    status: string;
    paid_at: string | null;
    checkout_url: string;
  }>;
}

export const PurchasesManagement = () => {
  const { navigate } = useRouter();
  const { error: showError } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
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

      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          payments (
            id,
            stripe_checkout_session_id,
            status,
            paid_at,
            checkout_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPurchases(data || []);
    } catch (err) {
      console.error('Error loading purchases:', err);
      showError('Fout bij laden van bestellingen');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      created: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Aangemaakt' },
      pending_payment: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Wacht op betaling' },
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Betaald' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Mislukt' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In behandeling' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Verzonden' },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Afgeleverd' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch =
      purchase.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          <div className="flex items-center gap-3 mb-4">
            <Package size={32} className="text-black" />
            <h1 className="text-3xl font-bold">Bestellingen</h1>
          </div>
          <p className="text-gray-600">
            Overzicht van alle bestellingen en betalingen
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek op email, naam of ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black appearance-none"
              >
                <option value="all">Alle statussen</option>
                <option value="created">Aangemaakt</option>
                <option value="pending_payment">Wacht op betaling</option>
                <option value="paid">Betaald</option>
                <option value="failed">Mislukt</option>
                <option value="processing">In behandeling</option>
                <option value="shipped">Verzonden</option>
                <option value="delivered">Afgeleverd</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <button
              onClick={loadPurchases}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw size={16} />
              Vernieuwen
            </button>
            <button
              onClick={() => navigate('/admin/payments/diagnostics')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye size={16} />
              Diagnostics
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Klant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bedrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Betaling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Geen bestellingen gevonden
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {purchase.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold">{purchase.customer_name}</div>
                        <div className="text-xs text-gray-500">{purchase.customer_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold">
                          {purchase.metadata?.legend_name || 'Custom Legend'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {purchase.metadata?.color && `${purchase.metadata.color} `}
                          {purchase.metadata?.size && `• ${purchase.metadata.size}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        €{purchase.amount_value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(purchase.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {purchase.payments && purchase.payments.length > 0 ? (
                          <div className="text-xs">
                            {getStatusBadge(purchase.payments[0].status)}
                            {purchase.payments[0].paid_at && (
                              <div className="text-gray-500 mt-1">
                                {new Date(purchase.payments[0].paid_at).toLocaleDateString('nl-NL')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Geen betaling</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(purchase.created_at).toLocaleDateString('nl-NL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => navigate(`/admin/purchases/${purchase.id}`)}
                          className="text-black hover:text-gray-700 font-semibold"
                        >
                          Bekijk →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {purchases.filter(p => p.status === 'paid').length}
              </div>
              <div className="text-sm text-gray-600">Betaald</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {purchases.filter(p => p.status === 'pending_payment').length}
              </div>
              <div className="text-sm text-gray-600">Wacht op betaling</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {purchases.filter(p => p.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-600">Mislukt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                €{purchases
                  .filter(p => p.status === 'paid')
                  .reduce((sum, p) => sum + parseFloat(p.amount_value), 0)
                  .toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Totaal omzet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
