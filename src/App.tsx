import { useEffect } from 'react';
import { Router, Route } from './lib/router';
import { CartProvider } from './lib/cart';
import { ToastProvider } from './lib/toast';
import { Layout } from './components/Layout';
import { supabase } from './lib/supabase';
import { Home } from './pages/Home';
import { Seasons } from './pages/Seasons';
import { SeasonDetail } from './pages/SeasonDetail';
import { ClubDetail } from './pages/ClubDetail';
import { Legends } from './pages/Legends';
import { LegendDetail } from './pages/LegendDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { PaymentReturn } from './pages/PaymentReturn';
import { Admin } from './pages/Admin';
import { Seed } from './pages/Seed';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { UserProfile } from './pages/UserProfile';
import { TrackOrder } from './pages/TrackOrder';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { Terms } from './pages/Terms';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OrdersManagement } from './pages/admin/OrdersManagement';
import { OrderDetail } from './pages/admin/OrderDetail';
import { CustomersManagement } from './pages/admin/CustomersManagement';
import { FAQManagement } from './pages/admin/FAQManagement';
import { PurchasesManagement } from './pages/admin/PurchasesManagement';
import { PaymentDiagnostics } from './pages/admin/PaymentDiagnostics';
import { Diagnostics } from './pages/admin/Diagnostics';
import { AuthDebug } from './pages/AuthDebug';

function App() {
  // Check for password recovery token on app load
  useEffect(() => {
    const hash = window.location.hash;

    // Handle recovery tokens by redirecting to reset-password page
    if (hash && hash.includes('type=recovery')) {
      const currentPath = hash.split('#')[0] || '';

      // If not already on reset-password, navigate there
      if (!currentPath.includes('/reset-password')) {
        // Keep the auth tokens in the URL - Supabase will automatically process them
        const authFragment = hash.substring(hash.indexOf('#', 1));
        window.location.hash = `/reset-password${authFragment}`;
      }
    }
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('sb-kraszqrhydhhkknyapxa-auth-token');
      }
    });

    const checkSession = async () => {
      try {
        await supabase.auth.getSession();
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && err.message.toLowerCase().includes('refresh')) {
          console.warn('Invalid session detected, signing out');
          await supabase.auth.signOut();
        }
      }
    };

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <ToastProvider>
      <CartProvider>
        <Router>
          <Layout>
            <Route path="/" component={Home} />
            <Route path="/seizoenen" component={Seasons} />
            <Route path="/seizoen/:seasonSlug" component={SeasonDetail} />
            <Route path="/seizoen/:seasonSlug/club/:clubSlug" component={ClubDetail} />
            <Route path="/legends" component={Legends} />
            <Route path="/legend/:legendSlug" component={LegendDetail} />
            <Route path="/cart" component={Cart} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/payment/return" component={PaymentReturn} />
            <Route path="/track-order" component={TrackOrder} />
            <Route path="/contact" component={Contact} />
            <Route path="/faq" component={FAQ} />
            <Route path="/terms" component={Terms} />
            <Route path="/login" component={Login} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/profile" component={UserProfile} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/orders/:orderId" component={OrderDetail} />
            <Route path="/admin/orders" component={OrdersManagement} />
            <Route path="/admin/purchases" component={PurchasesManagement} />
            <Route path="/admin/payments/diagnostics" component={PaymentDiagnostics} />
            <Route path="/admin/diagnostics" component={Diagnostics} />
            <Route path="/admin/customers" component={CustomersManagement} />
            <Route path="/admin/faq" component={FAQManagement} />
            <Route path="/admin" component={Admin} />
            <Route path="/debug/supabase" component={AuthDebug} />
            <Route path="/seed" component={Seed} />
          </Layout>
        </Router>
      </CartProvider>
    </ToastProvider>
  );
}

export default App;
