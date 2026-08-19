import { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';

export const ResetPassword = () => {
  const { navigate } = useRouter();
  const { success, error } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    const extractAuthParams = () => {
      const hash = window.location.hash;
      console.log('Full hash:', hash);

      // Extract auth parameters after the second #
      const secondHashIndex = hash.indexOf('#', 1);
      if (secondHashIndex === -1) return null;

      const authFragment = hash.substring(secondHashIndex + 1);
      console.log('Auth fragment:', authFragment);

      const params = new URLSearchParams(authFragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      console.log('Extracted params:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type
      });

      if (accessToken && refreshToken && type === 'recovery') {
        return { accessToken, refreshToken };
      }

      return null;
    };

    const checkSession = async () => {
      try {
        // First, try to extract and set session from URL parameters
        const authParams = extractAuthParams();

        if (authParams) {
          console.log('📝 Setting session from URL parameters...');

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: authParams.accessToken,
            refresh_token: authParams.refreshToken,
          });

          if (sessionError) {
            console.error('❌ Error setting session:', sessionError);
            if (mounted) {
              setHasValidSession(false);
              setSessionChecked(true);
            }
            return;
          }

          if (data.session) {
            console.log('✓ Valid recovery session set from URL');
            if (mounted) {
              setHasValidSession(true);
              setSessionChecked(true);
              // Clean up URL by removing auth parameters
              window.location.hash = '/reset-password';
            }
            return;
          }
        }

        // Fallback: check if session already exists
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('✓ Valid existing session found');
          if (mounted) {
            setHasValidSession(true);
            setSessionChecked(true);
          }
        } else {
          console.log('✗ No valid recovery session');
          if (mounted) {
            setHasValidSession(false);
            setSessionChecked(true);
          }
        }
      } catch (err) {
        console.error('Error in checkSession:', err);
        if (mounted) {
          setHasValidSession(false);
          setSessionChecked(true);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session ? '✓ has session' : '✗ no session');

      if (mounted && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        console.log('✓ Password recovery session active');
        setHasValidSession(true);
        setSessionChecked(true);
      }
    });

    // Timeout after 5 seconds to show error
    timeoutId = setTimeout(() => {
      if (mounted && !hasValidSession) {
        console.log('⏰ Timeout - no valid session detected');
        setSessionChecked(true);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      error('Wachtwoorden komen niet overeen');
      return;
    }

    if (newPassword.length < 6) {
      error('Wachtwoord moet minimaal 6 karakters zijn');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      success('Wachtwoord succesvol gewijzigd');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      error('Fout bij wijzigen wachtwoord');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <img
            src="/logo-met-kader.jpg"
            alt="Cultheld"
            className="h-24 mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold mb-4">Ongeldige of verlopen link</h1>
          <p className="text-gray-600 mb-6">
            Deze wachtwoord reset link is niet meer geldig. Vraag een nieuwe aan.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Nieuwe reset link aanvragen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src="/logo-met-kader.jpg"
            alt="Cultheld"
            className="h-24 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold mb-2">Nieuw wachtwoord instellen</h1>
          <p className="text-gray-600">
            Kies een nieuw wachtwoord voor je account
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="new-password" className="block text-sm font-semibold mb-2">
              Nieuw wachtwoord
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Minimaal 6 karakters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-semibold mb-2">
              Bevestig wachtwoord
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              placeholder="Herhaal je nieuwe wachtwoord"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Wachtwoord wijzigen'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-black transition-colors"
            >
              Terug naar login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
