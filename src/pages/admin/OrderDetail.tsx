import { useState, useEffect } from 'react';
import { ChevronLeft, Package, Truck, Save, Send, Clock, User, MapPin, CreditCard, Edit2 } from 'lucide-react';
import { useRouter } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: any;
  billing_address?: any;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  tracking_number?: string;
  carrier?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
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

interface StatusHistory {
  id: string;
  old_status: string;
  new_status: string;
  notes?: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'created', label: 'Aangemaakt', color: 'gray' },
  { value: 'pending_payment', label: 'Wacht op Betaling', color: 'yellow' },
  { value: 'paid', label: 'Betaald', color: 'green' },
  { value: 'processing', label: 'Wordt Verwerkt', color: 'blue' },
  { value: 'shipped', label: 'Verzonden', color: 'purple' },
  { value: 'delivered', label: 'Bezorgd', color: 'green' },
  { value: 'cancelled', label: 'Geannuleerd', color: 'red' },
];

const CARRIERS = ['PostNL', 'DHL', 'DPD', 'UPS', 'FedEx'];

export const OrderDetail = () => {
  const { navigate, params } = useRouter();
  const { success, error: showError } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);

  const [editForm, setEditForm] = useState({
    status: '',
    tracking_number: '',
    carrier: '',
    admin_notes: '',
    status_notes: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_street: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: '',
  });

  const id = params.orderId;

  useEffect(() => {
    if (id) {
      loadOrderData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadOrderData = async () => {
    try {
      const { data: purchase, error: purchaseError } = await supabase
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
        .eq('id', id)
        .maybeSingle();

      if (purchaseError) throw purchaseError;
      if (!purchase) {
        setLoading(false);
        return;
      }

      const metadata = purchase.metadata || {};
      const shippingAddress = metadata.shipping_address || {};
      const billingAddress = metadata.billing_address || {};
      const items = metadata.items || [];

      const orderData = {
        id: purchase.id,
        order_number: purchase.id.substring(0, 8).toUpperCase(),
        customer_name: purchase.customer_name,
        customer_email: purchase.customer_email,
        customer_phone: metadata.customer_phone || '',
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        subtotal: parseFloat(metadata.subtotal || '0'),
        shipping_cost: parseFloat(metadata.shipping_cost || '0'),
        tax: parseFloat(metadata.tax || '0'),
        total: parseFloat(purchase.amount_value || '0'),
        status: purchase.status,
        payment_status: purchase.payments?.[0]?.status || 'unknown',
        payment_method: purchase.payments?.[0]?.method || '',
        tracking_number: metadata.tracking_number || '',
        carrier: metadata.carrier || '',
        admin_notes: metadata.admin_notes || '',
        created_at: purchase.created_at,
        updated_at: purchase.updated_at,
        shipped_at: metadata.shipped_at || '',
        delivered_at: metadata.delivered_at || '',
      };

      setOrder(orderData);
      setItems(items.map((item: any, index: number) => ({
        id: `${purchase.id}-${index}`,
        legend_name: item.legend_name || '',
        product_type_name: item.product_type_name || item.product_type || '',
        color_name: item.color_name || '',
        size: item.size || '',
        quantity: item.quantity || 1,
        unit_price: parseFloat(item.unit_price || '0'),
        total_price: parseFloat(item.total_price || '0'),
        mockup_preview_url: item.mockup_preview_url || item.preview_url || '',
      })));

      const statusHistory = metadata.status_history || [];
      setHistory(statusHistory.map((h: any, index: number) => ({
        id: `${purchase.id}-history-${index}`,
        old_status: h.old_status || '',
        new_status: h.new_status || '',
        notes: h.notes || '',
        created_at: h.changed_at || new Date().toISOString(),
      })));

      setEditForm({
        status: purchase.status,
        tracking_number: metadata.tracking_number || '',
        carrier: metadata.carrier || '',
        admin_notes: metadata.admin_notes || '',
        status_notes: '',
        customer_name: purchase.customer_name || '',
        customer_email: purchase.customer_email || '',
        customer_phone: metadata.customer_phone || '',
        shipping_street: shippingAddress.street || shippingAddress.address || '',
        shipping_city: shippingAddress.city || '',
        shipping_postal_code: shippingAddress.postal_code || '',
        shipping_country: shippingAddress.country || '',
      });
    } catch (err) {
      console.error('Error loading order:', err);
      showError('Fout bij laden van bestelling');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);

    try {
      const { data: currentPurchase } = await supabase
        .from('purchases')
        .select('metadata')
        .eq('id', order.id)
        .maybeSingle();

      const currentMetadata = currentPurchase?.metadata || {};

      const statusHistory = currentMetadata.status_history || [];

      if (editForm.status !== order.status) {
        const { data: { user: currentAdminUser } } = await supabase.auth.getUser();
        statusHistory.push({
          old_status: order.status,
          new_status: editForm.status,
          notes: editForm.status_notes || null,
          changed_by: currentAdminUser?.email || 'admin',
          changed_at: new Date().toISOString(),
        });
      }

      const updatedMetadata = {
        ...currentMetadata,
        tracking_number: editForm.tracking_number || null,
        carrier: editForm.carrier || null,
        admin_notes: editForm.admin_notes || null,
        customer_phone: editForm.customer_phone || null,
        shipping_address: {
          street: editForm.shipping_street,
          city: editForm.shipping_city,
          postal_code: editForm.shipping_postal_code,
          country: editForm.shipping_country,
        },
        status_history: statusHistory,
      };

      const { error: updateError } = await supabase
        .from('purchases')
        .update({
          status: editForm.status,
          customer_name: editForm.customer_name,
          customer_email: editForm.customer_email,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      success('Bestelling succesvol bijgewerkt');
      setEditingShipping(false);
      setEditingCustomer(false);
      await loadOrderData();
    } catch (err) {
      console.error('Error updating order:', err);
      showError('Fout bij bijwerken van bestelling');
    } finally {
      setSaving(false);
    }
  };

  const handleSendShippingNotification = async () => {
    if (!order || !editForm.tracking_number || !editForm.carrier) {
      showError('Vul eerst tracking nummer en vervoerder in');
      return;
    }

    setSaving(true);

    try {
      await handleSave();

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-shipping-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          order_number: order.order_number,
          customer_email: editForm.customer_email,
          customer_name: editForm.customer_name,
          tracking_number: editForm.tracking_number,
          carrier: editForm.carrier,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Shipping notification error:', result);
        throw new Error(result.error || 'Failed to send notification');
      }

      console.log('Shipping notification sent:', result);
      success('Verzendbevestiging verstuurd naar klant');
    } catch (err: any) {
      console.error('Error sending notification:', err);
      showError(err.message || 'Fout bij versturen verzendbevestiging');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Bestelling niet gevonden</h2>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-black hover:underline"
            >
              Terug naar bestellingen
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-black hover:underline"
            >
              Admin Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
            Terug naar bestellingen
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-600 hover:text-black transition-colors"
          >
            Admin Menu
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Bestelling {order.order_number}</h1>
          <p className="text-gray-600">
            Geplaatst op {new Date(order.created_at).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package size={24} />
                Producten
              </h2>
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
                      <h3 className="font-semibold">{item.legend_name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.product_type_name} • {item.color_name} • Maat {item.size}
                      </p>
                      <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">€{Number(item.total_price).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">€{Number(item.unit_price).toFixed(2)} per stuk</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t space-y-2">
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock size={24} />
                Status Geschiedenis
              </h2>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-gray-500 text-sm">Geen statuswijzigingen</p>
                ) : (
                  history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="w-2 h-2 rounded-full bg-black mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold capitalize">{h.new_status}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(h.created_at).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {h.notes && (
                          <p className="text-sm text-gray-600 mt-1">{h.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User size={24} />
                  Klantgegevens
                </h2>
                <button
                  onClick={() => setEditingCustomer(!editingCustomer)}
                  className="text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-1"
                >
                  <Edit2 size={16} />
                  {editingCustomer ? 'Annuleren' : 'Bewerken'}
                </button>
              </div>
              {editingCustomer ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Naam</label>
                    <input
                      type="text"
                      value={editForm.customer_name}
                      onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.customer_email}
                      onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Telefoon</label>
                    <input
                      type="tel"
                      value={editForm.customer_phone}
                      onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="Optioneel"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Naam</p>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{order.customer_email}</p>
                  </div>
                  {order.customer_phone && (
                    <div>
                      <p className="text-sm text-gray-600">Telefoon</p>
                      <p className="font-medium">{order.customer_phone}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin size={24} />
                  Verzendadres
                </h2>
                <button
                  onClick={() => setEditingShipping(!editingShipping)}
                  className="text-sm text-gray-600 hover:text-black transition-colors flex items-center gap-1"
                >
                  <Edit2 size={16} />
                  {editingShipping ? 'Annuleren' : 'Bewerken'}
                </button>
              </div>
              {editingShipping ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Straat en huisnummer</label>
                    <input
                      type="text"
                      value={editForm.shipping_street}
                      onChange={(e) => setEditForm({ ...editForm, shipping_street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Postcode</label>
                      <input
                        type="text"
                        value={editForm.shipping_postal_code}
                        onChange={(e) => setEditForm({ ...editForm, shipping_postal_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Plaats</label>
                      <input
                        type="text"
                        value={editForm.shipping_city}
                        onChange={(e) => setEditForm({ ...editForm, shipping_city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Land</label>
                    <input
                      type="text"
                      value={editForm.shipping_country}
                      onChange={(e) => setEditForm({ ...editForm, shipping_country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.customer_name}</p>
                  <p>{order.shipping_address.street || order.shipping_address.address}</p>
                  <p>{order.shipping_address.postal_code} {order.shipping_address.city}</p>
                  <p>{order.shipping_address.country}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard size={24} />
                Betaling
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">{order.payment_status}</p>
                </div>
                {order.payment_method && (
                  <div>
                    <p className="text-sm text-gray-600">Methode</p>
                    <p className="font-medium capitalize">{order.payment_method}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Truck size={24} />
                Bestelling Beheren
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Vervoerder</label>
                  <select
                    value={editForm.carrier}
                    onChange={(e) => setEditForm({ ...editForm, carrier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="">Selecteer vervoerder</option>
                    {CARRIERS.map((carrier) => (
                      <option key={carrier} value={carrier}>
                        {carrier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Track & Trace</label>
                  <input
                    type="text"
                    value={editForm.tracking_number}
                    onChange={(e) => setEditForm({ ...editForm, tracking_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="3SABCD123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Status Notitie</label>
                  <textarea
                    value={editForm.status_notes}
                    onChange={(e) => setEditForm({ ...editForm, status_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    rows={2}
                    placeholder="Optionele notitie bij statuswijziging"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Admin Notities</label>
                  <textarea
                    value={editForm.admin_notes}
                    onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    rows={3}
                    placeholder="Interne notities (niet zichtbaar voor klant)"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                  </button>

                  {editForm.tracking_number && editForm.carrier && (
                    <button
                      onClick={handleSendShippingNotification}
                      disabled={saving}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send size={20} />
                      {saving ? 'Versturen...' : 'Verzendbevestiging Versturen'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
