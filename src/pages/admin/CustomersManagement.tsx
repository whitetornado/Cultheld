import { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Package, TrendingUp } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

interface Customer {
  customer_email: string;
  customer_name: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  first_order_date: string;
}

interface CustomerOrder {
  order_id: string;
  order_number: string;
  status: string;
  total: number;
  order_date: string;
  item_count: number;
}

export const CustomersManagement = () => {
  const { navigate } = useRouter();
  const { error: showError } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'orders' | 'spent' | 'recent'>('recent');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers_summary')
        .select('*');

      if (error) throw error;

      setCustomers(data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
      showError('Fout bij laden van klanten');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerOrders = async (email: string) => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .rpc('get_customer_orders', { p_customer_email: email });

      if (error) throw error;

      setCustomerOrders(data || []);
    } catch (err) {
      console.error('Error loading customer orders:', err);
      showError('Fout bij laden van klantbestellingen');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await loadCustomerOrders(customer.customer_email);
  };

  const getFilteredAndSortedCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.customer_name.toLowerCase().includes(term) ||
        customer.customer_email.toLowerCase().includes(term)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'orders') {
        return b.total_orders - a.total_orders;
      } else if (sortBy === 'spent') {
        return Number(b.total_spent) - Number(a.total_spent);
      } else {
        return new Date(b.last_order_date).getTime() - new Date(a.last_order_date).getTime();
      }
    });

    return sorted;
  };

  const filteredCustomers = getFilteredAndSortedCustomers();

  const totalStats = {
    customers: customers.length,
    orders: customers.reduce((sum, c) => sum + c.total_orders, 0),
    revenue: customers.reduce((sum, c) => sum + Number(c.total_spent), 0),
    avgOrderValue: customers.length > 0
      ? customers.reduce((sum, c) => sum + Number(c.total_spent), 0) /
        customers.reduce((sum, c) => sum + c.total_orders, 0)
      : 0,
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
          <h1 className="text-3xl font-bold mb-2">Klanten Beheer</h1>
          <p className="text-gray-600">Bekijk klanten en hun bestelgeschiedenis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600 text-sm font-semibold">Klanten</div>
              <Users size={20} className="text-gray-400" />
            </div>
            <div className="text-3xl font-bold">{totalStats.customers}</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-700 text-sm font-semibold">Bestellingen</div>
              <Package size={20} className="text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-800">{totalStats.orders}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-700 text-sm font-semibold">Omzet</div>
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-800">
              €{totalStats.revenue.toFixed(0)}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-purple-700 text-sm font-semibold">Gem. Orderwaarde</div>
              <TrendingUp size={20} className="text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-800">
              €{totalStats.avgOrderValue.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Zoek op naam of email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="recent">Meest Recent</option>
                  <option value="orders">Meeste Bestellingen</option>
                  <option value="spent">Hoogste Uitgave</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold mb-1">Geen klanten gevonden</p>
                  <p className="text-sm">Probeer je zoekopdracht aan te passen</p>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.customer_email}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedCustomer?.customer_email === customer.customer_email
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{customer.customer_name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail size={14} />
                          {customer.customer_email}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">
                          €{Number(customer.total_spent).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{customer.total_orders} bestellingen</span>
                      <span>•</span>
                      <span>
                        Laatste bestelling:{' '}
                        {new Date(customer.last_order_date).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {selectedCustomer ? (
              <>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold mb-4">Klant Details</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Naam</p>
                      <p className="font-semibold">{selectedCustomer.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{selectedCustomer.customer_email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">Totaal Bestellingen</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {selectedCustomer.total_orders}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-green-600 mb-1">Totaal Uitgegeven</p>
                        <p className="text-2xl font-bold text-green-900">
                          €{Number(selectedCustomer.total_spent).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 text-sm text-gray-600">
                      <p>
                        Klant sinds:{' '}
                        <strong>
                          {new Date(selectedCustomer.first_order_date).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Package size={20} />
                    Bestelgeschiedenis
                  </h3>

                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Package size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Geen bestellingen gevonden</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {customerOrders.map((order) => (
                        <div
                          key={order.order_id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer"
                          onClick={() => navigate(`/admin/orders/${order.order_id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{order.order_number}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.order_date).toLocaleDateString('nl-NL', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">€{Number(order.total).toFixed(2)}</p>
                              <p className="text-xs text-gray-600 capitalize">{order.status}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">{order.item_count} items</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-12 text-center text-gray-500">
                <div>
                  <Users size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold mb-2">Selecteer een klant</p>
                  <p className="text-sm">Kies een klant uit de lijst om details en bestelgeschiedenis te bekijken</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
