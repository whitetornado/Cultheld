import { useState, useEffect } from 'react';
import { supabase, isAdmin } from '../lib/supabase';
import { useRouter, Link } from '../lib/router';
import { LogIn, UserPlus, Mail } from 'lucide-react';

type AuthTab = 'login' | 'register';

export const Login = () => {
  const [tab, setTab] = useState<AuthTab>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerCheckEmail, setRegisterCheckEmail] = useState(false);

  const { navigate } = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const userIsAdmin = await isAdmin();
      if (userIsAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/profile');
      }
    }
  };

  const afterAuth = async () => {
    const userIsAdmin = await isAdmin();
    if (userIsAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/profile');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.session) {
        await afterAuth();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het inloggen');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegisterError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: { full_name: registerName },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        // Email confirmation is disabled — the account is active right away.
        await afterAuth();
      } else {
        // Email confirmation required — no session yet, ask the customer to
        // check their inbox instead of leaving them on a form that "did
        // nothing".
        setRegisterCheckEmail(true);
      }
    } catch (err) {
      console.error('Register error:', err);
      setRegisterError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het aanmaken van je account');
    } finally {
      setIsRegistering(false);
    }
  };

  if (registerCheckEmail) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4">
              <Mail className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Bijna klaar!</h1>
            <p className="text-gray-600 mb-8">
              We hebben een bevestigingsmail gestuurd naar <strong>{registerEmail}</strong>. Klik op de link
              in die mail om je account te activeren.
            </p>
            <button
              onClick={() => {
                setRegisterCheckEmail(false);
                setTab('login');
              }}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Naar inloggen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4">
              {tab === 'login' ? <LogIn className="text-white" size={28} /> : <UserPlus className="text-white" size={28} />}
            </div>
            <h1 className="text-3xl font-bold mb-2">{tab === 'login' ? 'Inloggen' : 'Account aanmaken'}</h1>
            <p className="text-gray-600">
              {tab === 'login' ? 'Log in met je account' : 'Maak een account aan om je bestellingen te volgen'}
            </p>
          </div>

          <div className="flex mb-8 border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === 'login' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Inloggen
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === 'register' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Account aanmaken
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold">
                    Wachtwoord
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    Wachtwoord vergeten?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Inloggen...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Inloggen
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label htmlFor="register-name" className="block text-sm font-semibold mb-2">
                  Naam
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-semibold mb-2">
                  Wachtwoord
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {registerError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{registerError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Account aanmaken...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Account aanmaken
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Terug naar home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
