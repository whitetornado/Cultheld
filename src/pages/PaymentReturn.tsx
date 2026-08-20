import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useRouter } from '../lib/router';
import { getPaymentStatus, type PaymentStatusResponse } from '../lib/payments';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart';

const isDev = import.meta.env.DEV;

export const PaymentReturn = () => {
  const { navigate, params } = useRouter();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'checking' | 'paid' | 'failed' | 'canceled' | 'pending' | 'open' | 'error'>('checking');
  const [statusData, setStatusData] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [hasSession, setHasSession] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [pollCount, setPollCount] = useState(0);
  const [checkStartTime] = useState<number>(Date.now());

  const purchaseId = params.purchase_id;
  const token = params.token;
  // Legacy param from the old Embedded Checkout flow — kept for any stale
  // bookmarked/cached links.
  const wasCanceled = params.canceled === 'true';
  // Redirect-based payment methods (iDEAL, Bancontact) send the customer
  // back here with Stripe's own ?redirect_status=... appended alongside our
  // purchase_id/token. "failed" covers both a declined payment and the
  // customer backing out at the bank — either way nothing was charged and
  // there's no point polling for a status that already came back negative.
  const redirectFailed = params.redirect_status === 'failed' || params.redirect_status === 'requires_payment_method';

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!purchaseId) {
      return;
    }

    setDebugInfo({
      purchaseId,
      hasToken: !!token,
      canceled: wasCanceled,
      timestamp: new Date().toISOString(),
    });

    if (wasCanceled) {
      setStatus('canceled');
      setLoading(false);
      return;
    }

    if (redirectFailed) {
      setStatus('failed');
      setLoading(false);
      return;
    }

    checkPaymentStatus();
  }, [purchaseId, token]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setHasSession(!!session);
  };

  const triggerEmailFallback = async (paymentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('resend-order-confirmation', {
        body: { payment_id: paymentId }
      });

      if (error) {
        console.error('Email fallback failed:', error);
      } else {
        console.log('Email fallback triggered successfully:', data);
      }
    } catch (err) {
      console.error('Email fallback error:', err);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const startTime = Date.now();
      const maxDuration = 30000;
      let attempts = 0;

      while (Date.now() - startTime < maxDuration) {
        attempts++;
        setPollCount(attempts);

        const data = await getPaymentStatus(purchaseId!, token);
        setStatusData(data);

        setDebugInfo((prev: any) => ({
          ...prev,
          lastStatusCheck: data.last_synced_at,
          purchaseStatus: data.purchase?.status,
          paymentRecordStatus: data.payment?.status,
          checkoutStatus: data.payment_status,
          attempts,
        }));

        if (data.payment_status === 'paid' || data.payment?.status === 'paid') {
          setStatus('paid');
          setLoading(false);

          // Only clear the cart once payment is actually confirmed — this is
          // the single place that happens, so a cancelled or failed attempt
          // always leaves the cart intact for a retry.
          clearCart();

          if (data.payment && data.payment.webhook_called_at === null) {
            console.log('Webhook not called yet, triggering email fallback...');
            triggerEmailFallback(data.payment.id);
          }

          return;
        }

        if (['failed', 'canceled', 'expired'].includes(data.payment_status || '')) {
          setStatus('failed');
          setLoading(false);
          return;
        }

        if (data.payment_status === 'open') {
          const elapsedSeconds = (Date.now() - checkStartTime) / 1000;
          if (elapsedSeconds > 15) {
            setStatus('open');
            setLoading(false);
            return;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const finalPaymentStatus = statusData?.payment_status;
      if (finalPaymentStatus === 'open') {
        setStatus('open');
      } else {
        setStatus('pending');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error checking payment status:', err);

      const statusCode = (err as { status?: number })?.status;

      if (statusCode === 401 || statusCode === 404) {
        // We couldn't verify this purchase belongs to this visitor/token —
        // most often because the checkout attempt was abandoned or the
        // return link is stale, not because anything actually broke. Route
        // to the same reassuring "cancelled" screen instead of an alarming
        // error page: either way, the cart was never touched (it's only
        // cleared above, once payment_status === 'paid' is confirmed), so
        // there's nothing at risk and nothing for the customer to worry about.
        setStatus('canceled');
        setLoading(false);
        return;
      }

      setStatus('error');
      setError(err instanceof Error ? err.message : 'Onbekende fout');
      setLoading(false);
    }
  };

  // Embedded Checkout has no separate hosted page to redirect back to —
  // "reopening" the payment just means going back to /checkout, where a
  // fresh embedded session is created/resumed inline.
  const resumeCheckout = () => {
    navigate('/checkout');
  };

  const refreshStatus = () => {
    setLoading(true);
    setStatus('checking');
    setPollCount(0);
    checkPaymentStatus();
  };

  const DebugPanel = () => {
    if (!isDev) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg max-w-sm text-xs font-mono">
        <div className="font-bold mb-2">Debug Info</div>
        <div className="space-y-1">
          <div>Purchase ID: {purchaseId?.substring(0, 8)}...</div>
          <div>Has Token: {token ? '✓' : '✗'}</div>
          <div>Has Session: {hasSession ? '✓' : '✗'}</div>
          <div>UI Status: {status}</div>
          <div>Poll Count: {pollCount}</div>
          {debugInfo.checkoutStatus && <div>Checkout Status: {debugInfo.checkoutStatus}</div>}
          {debugInfo.purchaseStatus && <div>Purchase Status: {debugInfo.purchaseStatus}</div>}
          {debugInfo.paymentRecordStatus && <div>Payment Status: {debugInfo.paymentRecordStatus}</div>}
          {debugInfo.lastStatusCheck && <div>Last Check: {new Date(debugInfo.lastStatusCheck).toLocaleTimeString()}</div>}
          {error && <div className="text-red-300">Error: {error}</div>}
        </div>
      </div>
    );
  };

  if (!purchaseId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Ongeldige link</h1>
            <p className="text-gray-600 mb-8">
              De betalingslink is ongeldig of onvolledig. Controleer of je de juiste link hebt gebruikt.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Terug naar home
            </button>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-xl text-gray-600">Betaling wordt verwerkt...</p>
          <p className="text-sm text-gray-500 mt-2">Poging {pollCount} van 30</p>
        </div>
        <DebugPanel />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Er is een fout opgetreden</h1>
            <p className="text-gray-600 mb-4">{error || 'Onbekende fout bij verwerken betaling'}</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Purchase ID:</strong> {purchaseId || 'Niet beschikbaar'}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Token aanwezig:</strong> {token ? 'Ja' : 'Nee'}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Opnieuw proberen
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="w-full border-2 border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Contact opnemen
              </button>
            </div>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  if (status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Betaling geslaagd!</h1>
            <p className="text-xl text-gray-600 mb-2">Bedankt voor je bestelling</p>
            {statusData?.purchase?.customer_email && (
              <p className="text-gray-600 mb-8">
                Je ontvangt een bevestigingsmail op {statusData.purchase.customer_email}
              </p>
            )}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <p className="text-gray-600 mb-1">Bedrag</p>
                  <p className="font-semibold">€{statusData?.purchase?.amount_value}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 mb-1">Status</p>
                  <p className="font-semibold text-green-600">Betaald</p>
                </div>
              </div>
              {statusData?.last_synced_at && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Laatst gecontroleerd: {new Date(statusData.last_synced_at).toLocaleString('nl-NL')}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Terug naar home
              </button>
              <button
                onClick={() => navigate('/legends')}
                className="w-full border-2 border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Verder shoppen
              </button>
            </div>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  if (status === 'open') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={48} className="text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Betaling nog niet voltooid</h1>
            <p className="text-gray-600 mb-4">
              De betaling staat nog open. Rond de betaling af op de betaalpagina of probeer opnieuw.
            </p>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3 text-left">
                <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Let op:</p>
                  <p>Als je het betaalscherm hebt gesloten zonder te betalen, kun je de betaling hieronder opnieuw openen.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="text-left">
                  <p className="text-gray-600 mb-1">Betaalstatus</p>
                  <p className="font-semibold text-yellow-600 uppercase">{statusData?.payment_status || 'open'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 mb-1">Bedrag</p>
                  <p className="font-semibold">€{statusData?.purchase?.amount_value}</p>
                </div>
              </div>
              {statusData?.last_synced_at && (
                <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Laatst gecontroleerd: {new Date(statusData.last_synced_at).toLocaleString('nl-NL')}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={resumeCheckout}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink size={20} />
                Ga terug naar afrekenen
              </button>
              <button
                onClick={refreshStatus}
                className="w-full border-2 border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Ververs status
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Terug naar home
              </button>
            </div>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={48} className="text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Betaling in behandeling</h1>
            <p className="text-gray-600 mb-8">
              Je betaling wordt nog verwerkt. Je ontvangt een bevestigingsmail zodra de betaling is voltooid.
            </p>
            {statusData?.last_synced_at && (
              <div className="bg-gray-50 rounded-lg p-4 mb-8 text-sm text-gray-600">
                Laatst gecontroleerd: {new Date(statusData.last_synced_at).toLocaleString('nl-NL')}
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={refreshStatus}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Status opnieuw controleren
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full border-2 border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Terug naar home
              </button>
            </div>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} className="text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Betaling geannuleerd</h1>
            <p className="text-gray-600 mb-2">
              Je hebt de betaling afgebroken. Er is niets in rekening gebracht.
            </p>
            <p className="text-gray-600 mb-8">
              Je winkelwagen staat nog klaar — je kunt gewoon opnieuw afrekenen.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Opnieuw afrekenen
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="w-full border-2 border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Winkelwagen bekijken
              </button>
            </div>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Betaling mislukt</h1>
            <p className="text-gray-600 mb-2">
              Er is iets misgegaan met je betaling, bijvoorbeeld een geweigerde kaart of een verlopen betaalsessie.
            </p>
            <p className="text-gray-600 mb-8">
              Je winkelwagen staat nog klaar — je hoeft niets opnieuw te selecteren.
            </p>
            {statusData?.last_synced_at && (
              <div className="bg-gray-50 rounded-lg p-4 mb-8 text-xs text-gray-500">
                Laatst gecontroleerd: {new Date(statusData.last_synced_at).toLocaleString('nl-NL')}
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Opnieuw proberen
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="w-full border-2 border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Winkelwagen bekijken
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="w-full text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact opnemen
              </button>
            </div>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  // Unreachable in normal operation — every known status is handled above —
  // kept as a safe fallback rather than assuming exhaustiveness.
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={48} className="text-red-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Onbekende betaalstatus</h1>
          <p className="text-gray-600 mb-8">
            We kunnen de status van je betaling niet bepalen. Je winkelwagen staat nog klaar.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/cart')}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Terug naar winkelwagen
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full border-2 border-black text-black py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Contact opnemen
            </button>
          </div>
        </div>
      </div>
      <DebugPanel />
    </div>
  );
};
