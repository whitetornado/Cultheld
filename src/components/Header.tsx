import { ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { useCart } from '../lib/cart';
import { supabase, isAdmin } from '../lib/supabase';

export const Header = () => {
  const { navigate } = useRouter();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || null);

      (async () => {
        if (session) {
          const adminStatus = await isAdmin();
          setUserIsAdmin(adminStatus);
        } else {
          setUserIsAdmin(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
    setUserEmail(session?.user?.email || null);
    if (session) {
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleAuthClick = async () => {
    if (isLoggedIn) {
      const userIsAdmin = await isAdmin();
      if (userIsAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/profile');
      }
    } else {
      navigate('/login');
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-black text-white sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            CULTHELD
          </button>

          <nav className="hidden md:flex items-center justify-center space-x-8 flex-1">
            <button
              onClick={() => navigate('/seizoenen')}
              className="hover:text-gray-300 transition-colors"
            >
              Seizoenen
            </button>
            <button
              onClick={() => navigate('/legends')}
              className="hover:text-gray-300 transition-colors"
            >
              Legends
            </button>
            <button
              onClick={() => navigate('/faq')}
              className="hover:text-gray-300 transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="hover:text-gray-300 transition-colors"
            >
              Contact
            </button>
          </nav>

          <div className="flex items-center space-x-4 ml-auto">
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={handleAuthClick}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title={userIsAdmin ? 'Admin Dashboard' : 'Mijn Profiel'}
                >
                  <User size={24} />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Uitloggen"
                >
                  <LogOut size={24} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuthClick}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                <User size={20} />
                Login
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-black">
          <nav className="px-4 py-4 space-y-3">
            <button
              onClick={() => {
                navigate('/seizoenen');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 hover:text-gray-300 transition-colors"
            >
              Seizoenen
            </button>
            <button
              onClick={() => {
                navigate('/legends');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 hover:text-gray-300 transition-colors"
            >
              Legends
            </button>
            <button
              onClick={() => {
                navigate('/faq');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 hover:text-gray-300 transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => {
                navigate('/contact');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 hover:text-gray-300 transition-colors"
            >
              Contact
            </button>
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleAuthClick}
                  className="block w-full text-left py-2 hover:text-gray-300 transition-colors"
                >
                  {userIsAdmin ? 'Admin Dashboard' : 'Mijn Profiel'}
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 hover:text-gray-300 transition-colors text-red-400"
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <button
                onClick={handleAuthClick}
                className="block w-full text-left py-2 bg-white text-black rounded px-3 font-semibold hover:bg-gray-200 transition-colors"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
