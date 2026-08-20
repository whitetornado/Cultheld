import { useState, useEffect } from 'react';
import { Package, Search, Eye, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  payment_status: string;
  tracking_number?: string;
  carrier?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alle', color: 'gray' },
  { value: 'created', label: 'Aangemaakt', color: 'gray' },
  { value: 'pending_payment', label: 'Wacht op Betaling', color: 'yellow' },
  { value: 'paid', label: 'Betaald', color: 'green' },
  { value: 'processing', label: 'Wordt Verwerkt', color: 'blue' },
  { value: 'shipped', label: 'Verzonden', color: 'purple' },
  { value: 'delivered', label: 'Bezorgd', color: 'green' },
  { value: 'cancelled', label: 'Geannuleerd', color: 'red' },
];

export const OrdersManagement = () => {
  const { navigate } = useRouter();
  const { error: showError } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          payments (
            id,
            status,
            method,
            paid_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = (data || []).map(purchase => ({
        id: purchase.id,
        order_number: purchase.id.substring(0, 8).toUpperCase(),
        customer_name: purchase.customer_name || 'Onbekend',
        customer_email: purchase.customer_email || '',
        total: parseFloat(purchase.amount_value || '0'),
        status: purchase.status,
        payment_status: purchase.payments?.[0]?.status || 'unknown',
        tracking_number: purchase.metadata?.tracking_number || undefined,
        carrier: purchase.metadata?.carrier || undefined,
        created_at: purchase.created_at,
        updated_at: purchase.updated_at,
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      showError('Fout bij laden van bestellingen');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedOrders = () => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(term) ||
        order.customer_name.toLowerCase().includes(term) ||
        order.customer_email.toLowerCase().includes(term) ||
        (order.tracking_number?.toLowerCase().includes(term))
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'total') {
        comparison = Number(a.total) - Number(b.total);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    const colorClasses: { [key: string]: string } = {
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClasses[statusConfig.color]}`}>
        {statusConfig.label}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: JSX.Element } = {
      pending: <Clock size={16} className="text-yellow-600" />,
      processing: <Package size={16} className="text-blue-600" />,
      shipped: <Truck size={16} className="text-purple-600" />,
      delivered: <CheckCircle size={16} className="text-green-600" />,
      cancelled: <XCircle size={16} className="text-red-600" />,
    };

    return icons[status] || icons.pending;
  };

  const filteredOrders = getFilteredAndSortedOrders();

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bestellingen Beheer</h1>
          <p className="text-gray-600">Bekijk en beheer alle bestellingen</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
            <div className="text-gray-600 text-sm font-semibold mb-1">Totaal</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
            <div className="text-yellow-700 text-sm font-semibold mb-1">In Behandeling</div>
            <div className="text-3xl font-bold text-yellow-800">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="text-blue-700 text-sm font-semibold mb-1">Wordt Verwerkt</div>
            <div className="text-3xl font-bold text-blue-800">{stats.processing}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
            <div className="text-purple-700 text-sm font-semibold mb-1">Verzonden</div>
            <div className="text-3xl font-bold text-purple-800">{stats.shipped}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
            <div className="text-green-700 text-sm font-semibold mb-1">Bezorgd</div>
            <div className="text-3xl font-bold text-green-800">{stats.delivered}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Zoek op ordernummer, klant, email of trackingnummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortBy(by as 'date' | 'total');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="date-desc">Nieuwste eerst</option>
                  <option value="date-asc">Oudste eerst</option>
                  <option value="total-desc">Hoogste bedrag</option>
                  <option value="total-asc">Laagste bedrag</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bestelling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Klant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bedrag
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Package size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-semibold mb-1">Geen bestellingen gevonden</p>
                      <p className="text-sm">Probeer je zoek- of filtercriteria aan te passen</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{order.order_number}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          {getStatusBadge(order.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.tracking_number ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.carrier}</div>
                            <div className="text-xs text-gray-500 font-mono">{order.tracking_number}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Nog niet verzonden</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-gray-900">€{Number(order.total).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold"
                        >
                          <Eye size={16} />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
