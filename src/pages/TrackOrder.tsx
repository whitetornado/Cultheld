import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, XCircle, Clock, MapPin, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address: any;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  status: string;
  payment_status: string;
  tracking_number?: string;
  carrier?: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

interface OrderItem {
  id: string;
  legend_name: string;
  product_type_name: string;
  color_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  mockup_preview_url?: string;
}

export const TrackOrder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Voer een ordernummer of email adres in');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .or(`order_number.eq.${searchQuery},customer_email.eq.${searchQuery}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError) throw orderError;

      if (!orderData) {
        setError('Geen bestelling gevonden met dit ordernummer of email adres');
        return;
      }

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      setOrder(orderData);
      setItems(itemsData || []);
    } catch (err) {
      console.error('Error searching order:', err);
      setError('Er is een fout opgetreden bij het zoeken');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: { [key: string]: { label: string; icon: JSX.Element; color: string } } = {
      pending: {
        label: 'In Behandeling',
        icon: <Clock size={48} className="text-yellow-600" />,
        color: 'yellow'
      },
      processing: {
        label: 'Wordt Verwerkt',
        icon: <Package size={48} className="text-blue-600" />,
        color: 'blue'
      },
      shipped: {
        label: 'Verzonden',
        icon: <Truck size={48} className="text-purple-600" />,
        color: 'purple'
      },
      delivered: {
        label: 'Bezorgd',
        icon: <CheckCircle size={48} className="text-green-600" />,
        color: 'green'
      },
      cancelled: {
        label: 'Geannuleerd',
        icon: <XCircle size={48} className="text-red-600" />,
        color: 'red'
      }
    };

    return configs[status] || configs.pending;
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string): string => {
    const carriers: { [key: string]: string } = {
      'PostNL': `https://jouw.postnl.nl/track-and-trace/${trackingNumber}`,
      'DHL': `https://www.dhl.com/nl-nl/home/tracking/tracking-parcel.html?submit=1&tracking-id=${trackingNumber}`,
      'DPD': `https://www.dpd.com/nl/nl/ontvangen/track-trace/?parcelNumber=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    };

    return carriers[carrier] || '#';
  };

  const statusConfig = order ? getStatusConfig(order.status) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <img
            src="/logo-met-kader.jpg"
            alt="Cultheld"
            className="h-20 mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold mb-4">Volg Je Bestelling</h1>
          <p className="text-gray-600 text-lg">
            Voer je ordernummer of email adres in om je bestelling te volgen
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ordernummer (bijv. ORD-20260113-0001) of email adres"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Zoeken...' : 'Zoeken'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {order && statusConfig && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="mb-6">
                {statusConfig.icon}
              </div>
              <h2 className="text-2xl font-bold mb-2">{statusConfig.label}</h2>
              <p className="text-gray-600 mb-4">Bestelling {order.order_number}</p>

              {order.tracking_number && order.carrier && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-6">
                  <p className="text-sm text-purple-700 font-semibold mb-3">Verzendgegevens</p>
                  <div className="space-y-2 mb-4">
                    <p className="text-purple-900">
                      <span className="text-purple-600">Vervoerder:</span> <strong>{order.carrier}</strong>
                    </p>
                    <p className="text-purple-900">
                      <span className="text-purple-600">Track & Trace:</span> <strong className="font-mono">{order.tracking_number}</strong>
                    </p>
                  </div>
                  <a
                    href={getTrackingUrl(order.carrier, order.tracking_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Volg bij {order.carrier}
                  </a>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package size={24} />
                Bestelde Producten
              </h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    {item.mockup_preview_url && (
                      <img
                        src={item.mockup_preview_url}
                        alt={item.legend_name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.legend_name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.product_type_name} • {item.color_name} • Maat {item.size}
                      </p>
                      <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">€{Number(item.total_price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User size={20} />
                  Klantgegevens
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">Naam:</span> <strong>{order.customer_name}</strong></p>
                  <p><span className="text-gray-600">Email:</span> <strong>{order.customer_email}</strong></p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Verzendadres
                </h3>
                <div className="text-sm space-y-1">
                  <p>{order.shipping_address.street}</p>
                  <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                  <p>{order.shipping_address.country}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4">Bestelling Totaal</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotaal:</span>
                  <span className="font-medium">€{Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Verzendkosten:</span>
                  <span className="font-medium">€{Number(order.shipping_cost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">BTW (21%):</span>
                  <span className="font-medium">€{Number(order.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Totaal:</span>
                  <span>€{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-900">
                Vragen over je bestelling? Neem contact op via{' '}
                <a href="mailto:info@cultheld.com" className="font-semibold underline">
                  info@cultheld.com
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
