import { useState, useEffect } from 'react';
import { seedDatabase } from '../seed-data';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { Link } from '../lib/router';

export const Seed = () => {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [checking, setChecking] = useState(true);
  const { success, error: showError } = useToast();

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      const { count } = await supabase
        .from('legends')
        .select('*', { count: 'exact', head: true });

      setHasData((count || 0) > 0);
    } catch (err) {
      console.error('Error checking database:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    setError(null);

    try {
      await seedDatabase();
      setComplete(true);
      setHasData(true);
      success('Database succesvol gevuld met demo data!');
    } catch (err) {
      console.error('Seed error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showError(`Fout bij het vullen van de database: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Database Seeding</h1>

          {hasData && !complete && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm font-medium">
                De database bevat al data. Seeden zal extra data toevoegen.
              </p>
            </div>
          )}

          <p className="text-gray-600 mb-6">
            Klik op de knop hieronder om de database te vullen met demo data:
          </p>

          <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-2">
            <li>2 seizoenen (2022/23 en 2023/24)</li>
            <li>18 Eredivisie clubs</li>
            <li>51 legends (3 wereldlegends + 48 Eredivisie legends)</li>
            <li>Product types en variants</li>
          </ul>

          {complete ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-green-800 font-semibold mb-2">Database succesvol gevuld!</p>
              <div className="flex gap-3 justify-center mt-4">
                <Link
                  to="/"
                  className="bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Ga naar home
                </Link>
                <Link
                  to="/legends"
                  className="bg-white text-black px-6 py-2 rounded-lg font-semibold border-2 border-black hover:bg-gray-100 transition-colors"
                >
                  Bekijk Legends
                </Link>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-semibold mb-2">Fout opgetreden</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={handleSeed}
                className="mt-4 bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Opnieuw proberen
              </button>
            </div>
          ) : (
            <button
              onClick={handleSeed}
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Database vullen...' : 'Vul database met demo data'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
