import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Save, Loader, Package, Edit2 } from 'lucide-react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { getCustomerProfile, upsertCustomerProfile, ProfileFormData } from '../lib/profile';

type Tab = 'profile' | 'orders';

export const UserProfile = () => {
  const { navigate } = useRouter();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Nederland',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        navigate('/login');
        return;
      }

      setUser(currentUser);

      const profile = await getCustomerProfile(currentUser.id);

      if (profile) {
        setFormData({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          postal_code: profile.postal_code,
          country: profile.country,
        });
      } else if (currentUser.user_metadata?.name) {
        setFormData(prev => ({
          ...prev,
          full_name: currentUser.user_metadata.name,
        }));
      }

      const { data: purchasesData } = await supabase
        .from('purchases')
        .select(`
          *,
          payments (
            id,
            status,
            paid_at
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      setPurchases(purchasesData || []);
    } catch (err) {
      console.error('Error loading profile:', err);
      showError('Fout bij laden van profiel');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user) {
        showError('Geen gebruiker gevonden');
        return;
      }

      const profile = await upsertCustomerProfile(user.id, formData);

      if (profile) {
        success('Profiel opgeslagen');
      } else {
        showError('Fout bij opslaan profiel');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      showError('Fout bij opslaan profiel');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!newEmail || newEmail === user?.email) {
      setEditingEmail(false);
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) throw error;

      success('Emailadres bijgewerkt. Controleer je inbox voor een bevestigingsmail.');
      setEditingEmail(false);
      await loadProfile();
    } catch (err: any) {
      console.error('Error updating email:', err);
      showError(err.message || 'Fout bij bijwerken emailadres');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={48} className="animate-spin text-gray-600" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      created: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Aangemaakt' },
      pending_payment: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Wacht op betaling' },
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Betaald' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Wordt verwerkt' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Verzonden' },
      delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Bezorgd' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Geannuleerd' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Mislukt' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Mijn Account</h1>
                {editingEmail ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm"
                      placeholder="Nieuw emailadres"
                      autoFocus
                    />
                    <button
                      onClick={handleEmailUpdate}
                      disabled={saving}
                      className="px-3 py-1 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingEmail(false);
                        setNewEmail('');
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-600">{user?.email}</p>
                    <button
                      onClick={() => {
                        setEditingEmail(true);
                        setNewEmail(user?.email || '');
                      }}
                      className="text-gray-600 hover:text-black transition-colors"
                      title="Email wijzigen"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex border-b mb-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-semibold ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                Profiel
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 font-semibold flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                <Package size={18} />
                Bestellingen ({purchases.length})
              </button>
            </div>

          {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                <div className="flex items-center gap-2">
                  <User size={16} />
                  Volledige naam
                </div>
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                placeholder="Voor- en achternaam"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  Telefoonnummer
                </div>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                placeholder="06 12345678"
              />
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Verzendadres
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Straat en huisnummer</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                    placeholder="Straatnaam 123"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Postcode</label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                      placeholder="1234 AB"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Plaats</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                      placeholder="Amsterdam"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Land</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Profiel opslaan
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border-2 border-black text-black rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </form>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {purchases.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Je hebt nog geen bestellingen geplaatst</p>
                  <button
                    onClick={() => navigate('/legends')}
                    className="mt-4 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Begin met shoppen
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => {
                    const items = purchase.metadata?.items || [];
                    const shippingAddress = purchase.metadata?.shipping_address || {};
                    const trackingNumber = purchase.metadata?.tracking_number;
                    const carrier = purchase.metadata?.carrier;

                    return (
                      <div key={purchase.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Bestelling #{purchase.id.substring(0, 8).toUpperCase()}
                            </p>
                            <p className="text-lg font-bold">
                              €{purchase.amount_value}
                            </p>
                          </div>
                          {getStatusBadge(purchase.status)}
                        </div>

                        {items.length > 0 && (
                          <div className="space-y-3 mb-4">
                            <p className="text-sm font-semibold text-gray-700">Bestelde producten:</p>
                            {items.map((item: any, index: number) => (
                              <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                {item.mockup_preview_url && (
                                  <img
                                    src={item.mockup_preview_url}
                                    alt={item.legend_name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold">{item.legend_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {item.product_type_name} • {item.color_name} • Maat {item.size}
                                  </p>
                                  <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">€{parseFloat(item.total_price || 0).toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {trackingNumber && carrier && purchase.status === 'shipped' && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                            <p className="text-sm font-semibold text-purple-900 mb-2">Verzonden via {carrier}</p>
                            <p className="text-sm text-purple-800">
                              Track & Trace: <span className="font-mono font-semibold">{trackingNumber}</span>
                            </p>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t space-y-1">
                          <p className="text-sm text-gray-600">
                            Besteld op {new Date(purchase.created_at).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>

                          {purchase.payments && purchase.payments.length > 0 && purchase.payments[0].paid_at && (
                            <p className="text-sm text-gray-600">
                              Betaald op {new Date(purchase.payments[0].paid_at).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}

                          {shippingAddress.street && (
                            <p className="text-sm text-gray-600">
                              Verzonden naar: {shippingAddress.street}, {shippingAddress.postal_code} {shippingAddress.city}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
