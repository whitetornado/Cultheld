import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';

export const AuthDebug = () => {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      setSessionInfo({
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        accessTokenPrefix: session?.access_token ? session.access_token.substring(0, 30) + '...' : null,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      });

      if (!session) {
        setError('No active session found. Please log in first.');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/auth-debug`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setDebugInfo(data);

      if (!data.authenticated) {
        setError('Authentication failed on edge function');
      }
    } catch (err) {
      console.error('Debug error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-600 hover:text-black transition-colors"
          >
            ← Back to Admin
          </button>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h1 className="text-3xl font-bold mb-6">Auth Debug Tool</h1>
          <p className="text-gray-600 mb-6">
            This tool helps diagnose authentication issues with edge functions.
          </p>

          <button
            onClick={runDebug}
            disabled={loading}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Running...' : 'Run Auth Check'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {sessionInfo && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">Frontend Session</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium text-blue-900">Has Session:</span>
                  <span className={sessionInfo.hasSession ? 'text-green-600' : 'text-red-600'}>
                    {sessionInfo.hasSession ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                {sessionInfo.userId && (
                  <>
                    <div className="flex gap-2">
                      <span className="font-medium text-blue-900">User ID:</span>
                      <span className="text-blue-700 font-mono text-xs">{sessionInfo.userId}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-blue-900">Email:</span>
                      <span className="text-blue-700">{sessionInfo.userEmail}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-blue-900">Token:</span>
                      <span className="text-blue-700 font-mono text-xs">{sessionInfo.accessTokenPrefix}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-blue-900">Expires:</span>
                      <span className="text-blue-700">{sessionInfo.expiresAt}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Edge Function Response</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium text-gray-900">Authenticated:</span>
                  <span className={debugInfo.authenticated ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.authenticated ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                {debugInfo.authenticated && (
                  <>
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-900">User ID:</span>
                      <span className="text-gray-700 font-mono text-xs">{debugInfo.userId}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-900">Email:</span>
                      <span className="text-gray-700">{debugInfo.userEmail}</span>
                    </div>
                  </>
                )}
                {debugInfo.authError && (
                  <div className="mt-2 p-2 bg-red-50 rounded">
                    <span className="font-medium text-red-900">Auth Error:</span>
                    <p className="text-red-700 text-xs mt-1">{debugInfo.authError}</p>
                  </div>
                )}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer font-medium text-gray-700 hover:text-black">
                  Full Debug Data
                </summary>
                <pre className="mt-2 p-3 bg-gray-800 text-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {debugInfo?.authenticated && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✓ Auth Working</h3>
              <p className="text-green-700">
                Authentication is working correctly. You should be able to create purchases.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
