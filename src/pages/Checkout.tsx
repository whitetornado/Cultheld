import { useState, useEffect } from 'react';
import { ChevronLeft, LogIn, UserPlus, User, X, Lock } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { useRouter } from '../lib/router';
import { useCart } from '../lib/cart';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { stripePromise } from '../lib/stripe';
import { createPurchase, createStripeCheckout, getProductSlugFromCart } from '../lib/payments';
import { getCustomerProfile, upsertCustomerProfile } from '../lib/profile';

const SHIPPING_COST = 4.95;
const FREE_SHIPPING_THRESHOLD = 50;

// Cultheld's black/white palette, applied to the Payment Element via
// Stripe's Appearance API so the payment-method form matches the rest of
// the site instead of Stripe's default blue theme.
const stripeAppearance: StripeElementsOptions['appearance'] = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#000000',
    colorBackground: '#ffffff',
    colorText: '#111827',
    colorDanger: '#dc2626',
    borderRadius: '8px',
    fontFamily: 'inherit',
  },
};

interface PaymentFormProps {
  purchaseId: string;
  returnToken: string;
}

// The actual payment-method form. Lives entirely on cultheld.nl — Stripe's
// Payment Element renders inline here instead of the customer being sent to
// a Stripe-hosted page. Redirect-only methods (iDEAL, Bancontact) still hop
// briefly to the bank to authenticate; card and similar methods resolve
// without ever leaving this page.
const PaymentForm = ({ purchaseId, returnToken }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { navigate } = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState('');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setPayError('');

    // Built client-side from window.location.origin so it naturally matches
    // whichever environment (localhost or production) started the checkout,
    // instead of always pointing at a fixed production URL.
    const returnUrl = `${window.location.origin}/payment/return?purchase_id=${purchaseId}&token=${returnToken}`;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (error) {
      // Methods that don't redirect (e.g. cards) surface their error here,
      // without the customer ever leaving cultheld.nl. Redirect-based
      // methods (iDEAL) instead land back on /payment/return via a full page
      // navigation, where this same status gets resolved.
      setPayError(error.message || 'Er is iets misgegaan bij het betalen. Probeer het opnieuw.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent) {
      // No redirect happened — send the customer through the same return
      // page a redirect-based method would land on, so status confirmation
      // and cart-clearing always run through one code path.
      navigate(`/payment/return?purchase_id=${purchaseId}&token=${returnToken}`);
    }
  };

  return (
    <form onSubmit={handlePay}>
      <PaymentElement />

      {payError && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {payError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full mt-6 bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting && (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {submitting ? 'Bezig met betalen...' : 'Nu betalen'}
      </button>
    </form>
  );
};

export const Checkout = () => {
  const { navigate } = useRouter();
  const { items } = useCart();
  const { error: showError, success: showSuccess } = useToast();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [returnToken, setReturnToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerCheckEmail, setRegisterCheckEmail] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Nederland',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);

        const profile = await getCustomerProfile(currentUser.id);

        if (profile) {
          setFormData({
            email: currentUser.email || '',
            name: profile.full_name,
            phone: profile.phone,
            address: profile.address,
            city: profile.city,
            postalCode: profile.postal_code,
            country: profile.country,
          });
        } else {
          setFormData(prev => ({
            ...prev,
            email: currentUser.email || '',
            name: currentUser.user_metadata?.name || '',
          }));
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const applyLoggedInUser = async (loggedInUser: any) => {
    setUser(loggedInUser);
    setShowAuthModal(false);

    const profile = await getCustomerProfile(loggedInUser.id);

    if (profile) {
      setFormData({
        email: loggedInUser.email || '',
        name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        postalCode: profile.postal_code,
        country: profile.country,
      });
    } else {
      setFormData(prev => ({
        ...prev,
        email: loggedInUser.email || '',
      }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        showSuccess('Ingelogd! Je gegevens worden ingevuld...');
        await applyLoggedInUser(data.user);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showError(err.message || 'Fout bij inloggen');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      // Account creation runs through our own edge function instead of
      // supabase.auth.signUp() directly, so the confirmation mail is our
      // branded Resend email instead of Supabase's generic default one.
      const { data, error } = await supabase.functions.invoke('send-signup-confirmation', {
        body: {
          email: registerEmail,
          password: registerPassword,
          name: registerName,
        },
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Fout bij account aanmaken');

      // The account is created unconfirmed — there's no session yet, so the
      // customer confirms via email and can finish this order as a guest
      // in the meantime.
      setRegisterCheckEmail(true);
    } catch (err: any) {
      console.error('Register error:', err);
      showError(err.message || 'Fout bij account aanmaken');
    } finally {
      setIsRegistering(false);
    }
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthMode('login');
    setRegisterCheckEmail(false);
  };

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.product_variant?.price || 0) * item.quantity;
  }, 0);

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const currentUser = user;

      if (currentUser) {
        await upsertCustomerProfile(currentUser.id, {
          full_name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country,
        });
      }

      const productSlug = getProductSlugFromCart(items);

      const totalAmount = subtotal + shippingCost;

      const { purchase, return_token } = await createPurchase({
        product_slug: productSlug,
        customer_email: formData.email,
        customer_name: formData.name,
        metadata: {
          subtotal: subtotal.toFixed(2),
          shipping_cost: shippingCost.toFixed(2),
          total: totalAmount.toFixed(2),
          customer_phone: formData.phone,
          shipping_address: {
            street: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
            country: formData.country,
          },
          billing_address: {
            street: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
            country: formData.country,
          },
          items: items.map(item => ({
            legend_name: item.legend?.name || 'Onbekend',
            product_type_name: item.product_variant?.product_type_id === 'tshirt' ? 'T-Shirt' :
                               item.product_variant?.product_type_id === 'sweater' ? 'Sweater' : 'Hoodie',
            color_name: item.product_variant?.color_name || '',
            size: item.product_variant?.size || '',
            quantity: item.quantity,
            unit_price: (item.product_variant?.price || 0).toFixed(2),
            total_price: ((item.product_variant?.price || 0) * item.quantity).toFixed(2),
            mockup_preview_url: item.preview_url || '',
            preview_url: item.preview_url || '',
          })),
        },
      });

      const { client_secret } = await createStripeCheckout(purchase.id, return_token);

      // Cart stays filled until the payment actually succeeds — it's cleared
      // on the payment-return page once the status comes back "paid". The
      // customer never leaves cultheld.nl for the payment-method selection
      // itself: Stripe's Payment Element is mounted right here instead of
      // redirecting to checkout.stripe.com.
      setPurchaseId(purchase.id);
      setReturnToken(return_token);
      setClientSecret(client_secret);
    } catch (error: any) {
      console.error('Error processing order:', error);
      showError(error.message || 'Er is een fout opgetreden bij het verwerken van je bestelling');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0 && !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Je winkelwagen is leeg</h1>
            <button
              onClick={() => navigate('/')}
              className="text-black hover:underline"
            >
              Terug naar home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => (clientSecret ? setClientSecret(null) : navigate('/cart'))}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          {clientSecret ? 'Terug naar bestelgegevens' : 'Terug naar winkelwagen'}
        </button>

        <h1 className="text-4xl font-bold mb-8">Afrekenen</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {clientSecret && purchaseId && returnToken ? (
              <div className="bg-white rounded-lg p-4 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Lock size={20} />
                  Veilig betalen
                </h2>
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: stripeAppearance }}
                >
                  <PaymentForm purchaseId={purchaseId} returnToken={returnToken} />
                </Elements>
              </div>
            ) : (
              <>
                {!user && !loadingProfile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <User size={24} className="text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">Heb je al een account?</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Log in om je opgeslagen adresgegevens te gebruiken, of maak een account aan om je volgende bestelling sneller af te rekenen.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => {
                              setAuthMode('login');
                              setShowAuthModal(true);
                            }}
                            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                          >
                            <LogIn size={16} />
                            Inloggen
                          </button>
                          <button
                            onClick={() => {
                              setAuthMode('register');
                              setShowAuthModal(true);
                            }}
                            className="flex items-center gap-2 bg-white border-2 border-black text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                          >
                            <UserPlus size={16} />
                            Account aanmaken
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {user && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">Ingelogd als</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8">
                  <h2 className="text-2xl font-bold mb-6">Contactgegevens</h2>

                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                        placeholder="jouw@email.nl"
                        disabled={!!user}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Telefoonnummer (optioneel)</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                        placeholder="06 12345678"
                      />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-6">Verzendadres</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Volledige naam</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Adres</label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                        placeholder="Straat en huisnummer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Postcode</label>
                        <input
                          type="text"
                          required
                          value={formData.postalCode}
                          onChange={(e) =>
                            setFormData({ ...formData, postalCode: e.target.value })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                          placeholder="1234 AB"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Plaats</label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Land</label>
                      <input
                        type="text"
                        required
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                        required
                      />
                      <span className="text-sm text-gray-700">
                        Ik ga akkoord met de{' '}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black underline hover:no-underline font-semibold"
                        >
                          algemene voorwaarden
                        </a>
                        . Ik begrijp dat producten op maat worden gemaakt en daarom niet retourneerbaar zijn.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || !acceptedTerms}
                    className="w-full mt-6 bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing && (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {processing ? 'Bestelling voorbereiden...' : !acceptedTerms ? 'Accepteer eerst de voorwaarden' : 'Doorgaan naar betalen'}
                  </button>
                </form>
              </>
            )}
          </div>

          {processing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                <div className="mb-4">
                  <svg className="animate-spin h-12 w-12 text-black mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Bestelling verwerken...</h3>
                <p className="text-gray-600">
                  We bereiden je bestelling voor. Dit kan even duren.
                </p>
              </div>
            </div>
          )}

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">Overzicht</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                      {item.preview_url && (
                        <img
                          src={item.preview_url}
                          alt={item.legend?.name}
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {item.legend?.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.product_variant?.color_name} - {item.product_variant?.size} x{' '}
                        {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      €{((item.product_variant?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotaal</span>
                  <span className="font-semibold">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Verzending</span>
                  <span className="font-semibold">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">GRATIS</span>
                    ) : (
                      `€${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Totaal</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {authMode === 'login' ? 'Inloggen' : 'Account aanmaken'}
              </h2>
              <button
                onClick={closeAuthModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex mb-6 border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setRegisterCheckEmail(false);
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  authMode === 'login'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Inloggen
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  authMode === 'register'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Account aanmaken
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                    placeholder="jouw@email.nl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Wachtwoord</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isLoggingIn ? 'Bezig...' : 'Inloggen'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(false);
                      navigate('/forgot-password');
                    }}
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    Wachtwoord vergeten?
                  </button>
                </div>
              </form>
            ) : registerCheckEmail ? (
              <div className="text-center py-4">
                <p className="text-gray-700 mb-4">
                  Bijna klaar! We hebben een bevestigingsmail gestuurd naar{' '}
                  <span className="font-semibold">{registerEmail}</span>. Bevestig je e-mailadres om in te loggen.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Je kunt deze bestelling ondertussen gewoon als gast afronden.
                </p>
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Verder als gast
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Naam</label>
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                    placeholder="jouw@email.nl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Wachtwoord</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
                    placeholder="Minimaal 6 tekens"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isRegistering ? 'Bezig...' : 'Account aanmaken'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
