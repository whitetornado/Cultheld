import { useState } from 'react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';

export const ForgotPassword = () => {
  const { navigate } = useRouter();
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          email: email,
          redirect_url: `${window.location.origin}/reset-password`,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send reset email');
      }

      setEmailSent(true);
      success('Reset link verzonden naar je email');
    } catch (err) {
      console.error('Forgot password error:', err);
      error('Fout bij versturen reset link');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-6">
            <div className="text-6xl mb-4">✉️</div>
            <h1 className="text-2xl font-bold mb-4">Check je email</h1>
            <p className="text-gray-600 mb-4">
              We hebben een wachtwoord reset link gestuurd naar:
            </p>
            <p className="font-semibold mb-6">{email}</p>
            <p className="text-sm text-gray-500">
              Klik op de link in de email om je wachtwoord te resetten.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-black transition-colors"
          >
            Terug naar login
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
          <h1 className="text-3xl font-bold mb-2">Wachtwoord vergeten?</h1>
          <p className="text-gray-600">
            Geen probleem! Voer je email in en we sturen je een reset link.
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2">
              Email adres
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              placeholder="je@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Verstuur reset link'}
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
