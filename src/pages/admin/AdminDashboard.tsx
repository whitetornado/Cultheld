import { useEffect, useState } from 'react';
import { Package, Users, ShoppingBag, TrendingUp, ChevronRight, HelpCircle } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { supabase, isAdmin } from '../../lib/supabase';

export const AdminDashboard = () => {
  const { navigate } = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const access = await isAdmin();
    setHasAccess(access);
    if (access) {
      loadStats();
    } else {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('customers_summary').select('*'),
      ]);

      const orders = ordersRes.data || [];
      const customers = customersRes.data || [];

      setStats({
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Geen toegang</h1>
          <p className="text-gray-600 mb-6">Je hebt geen toegang tot het admin dashboard</p>
          <button
            onClick={() => navigate('/')}
            className="text-black hover:underline"
          >
            Terug naar home
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: 'Bestellingen',
      description: 'Beheer bestellingen en verzending',
      icon: <Package size={32} />,
      color: 'blue',
      path: '/admin/orders',
      badge: stats.pendingOrders > 0 ? `${stats.pendingOrders} nieuw` : null,
    },
    {
      title: 'Klanten',
      description: 'Bekijk klanten en bestelgeschiedenis',
      icon: <Users size={32} />,
      color: 'green',
      path: '/admin/customers',
    },
    {
      title: 'Producten',
      description: 'Beheer producten, legends en seizoenen',
      icon: <ShoppingBag size={32} />,
      color: 'purple',
      path: '/admin',
    },
    {
      title: 'FAQ',
      description: 'Beheer veelgestelde vragen',
      icon: <HelpCircle size={32} />,
      color: 'orange',
      path: '/admin/faq',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Welkom terug! Hier is een overzicht van je webshop.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalOrders}</div>
            <div className="text-sm text-gray-600">Totaal Bestellingen</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users size={24} className="text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalCustomers}</div>
            <div className="text-sm text-gray-600">Klanten</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">€{stats.totalRevenue.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Totale Omzet</div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Package size={24} className="text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.pendingOrders}</div>
            <div className="text-sm text-gray-600">In Behandeling</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-4 bg-${item.color}-100 rounded-lg`}>
                  {item.icon}
                </div>
                <ChevronRight size={24} className="text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              {item.badge && (
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
