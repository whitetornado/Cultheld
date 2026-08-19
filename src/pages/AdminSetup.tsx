import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const createAdminUser = async () => {
    setLoading(true);
    setError(null);

    const adminEmail = 'admin@cultheld.nl';
    const adminPassword = 'Admin123!Cultheld';

    try {
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession.session) {
        await supabase.auth.signOut();
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            role: 'admin',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Admin user already exists. Use the credentials below to login.');
          setCredentials({ email: adminEmail, password: adminPassword });
          setComplete(true);
        } else {
          throw signUpError;
        }
      } else if (data.user) {
        setCredentials({ email: adminEmail, password: adminPassword });
        setComplete(true);
      }
    } catch (err) {
      console.error('Error creating admin:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Admin Account Setup</h1>
          <p className="text-gray-600 mb-6">
            Klik op de knop hieronder om een admin account aan te maken voor Cultheld.nl
          </p>

          {complete ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-green-800 font-semibold mb-4 text-xl">
                Admin account succesvol aangemaakt!
              </h2>
              {credentials && (
                <div className="bg-white rounded-lg p-4 mb-4 font-mono text-sm">
                  <div className="mb-2">
                    <span className="text-gray-600">Email:</span>
                    <div className="font-bold text-black">{credentials.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Password:</span>
                    <div className="font-bold text-black">{credentials.password}</div>
                  </div>
                </div>
              )}
              <p className="text-green-700 text-sm mb-4">
                Bewaar deze gegevens veilig. Je kunt nu inloggen via de admin dashboard.
              </p>
              <div className="space-y-2">
                <a
                  href="#/admin"
                  className="block w-full bg-black text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Ga naar Admin Dashboard
                </a>
                <a
                  href="#/"
                  className="block w-full bg-gray-200 text-black text-center py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Ga naar Home
                </a>
              </div>
            </div>
          ) : error ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-800 font-semibold mb-2">{error}</p>
              {credentials && (
                <div className="bg-white rounded-lg p-4 my-4 font-mono text-sm">
                  <div className="mb-2">
                    <span className="text-gray-600">Email:</span>
                    <div className="font-bold text-black">{credentials.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Password:</span>
                    <div className="font-bold text-black">{credentials.password}</div>
                  </div>
                </div>
              )}
              <a
                href="#/admin"
                className="block w-full bg-black text-white text-center py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Ga naar Admin Dashboard
              </a>
            </div>
          ) : (
            <button
              onClick={createAdminUser}
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Admin account aanmaken...' : 'Maak admin account aan'}
            </button>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-900">Volgende stappen:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Maak admin account aan met deze pagina</li>
              <li>
                Ga naar <a href="#/seed" className="underline font-semibold">Database Seeding</a> om demo data toe te voegen
              </li>
              <li>
                Bezoek <a href="#/admin" className="underline font-semibold">Admin Dashboard</a> om content te beheren
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
