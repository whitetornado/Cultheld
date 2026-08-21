import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing',
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});

// Browsers throttle/pause JS timers in a background tab, so supabase-js's
// autoRefreshToken can miss its window while an admin has the tab open but
// unfocused for a while (e.g. positioning a print area, then tabbing away).
// By the time they come back and click save, the access token has quietly
// expired and the request fails with "JWT expired". Proactively checking
// the session whenever the tab regains focus makes supabase-js refresh it
// right away if needed, so it's already fresh before any button is clicked.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.getSession();
    }
  });
}

// Belt-and-braces for admin save flows: call this right before a write if
// the form may have been open for a while (e.g. spent time in the print
// area editor). getSession() makes supabase-js check expiry and refresh in
// the background if needed — normally invisible, since the visibility-based
// refresh above already covers most cases.
export const ensureFreshSession = async () => {
  await supabase.auth.getSession();
};

// Turns Supabase's raw "JWT expired" error into an actionable message —
// the technical string means nothing to someone filling in a form; this
// tells them exactly what happened and what to do about it.
export const friendlySupabaseError = (err: unknown, fallback: string): string => {
  // Supabase query errors (PostgrestError) are plain objects with a
  // `.message` string, not actual Error instances — check for that shape
  // too, or the JWT-expired case below would never match.
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : String(err);
  if (/jwt expired/i.test(message)) {
    return 'Je sessie was verlopen. Ververs de pagina en probeer het opnieuw — je gegevens in dit formulier blijven daarbij helaas niet bewaard.';
  }
  return fallback + message;
};

export const getSessionId = () => {
  let sessionId = localStorage.getItem('cultheld_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cultheld_session_id', sessionId);
  }
  return sessionId;
};

export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const email = user.email;
  const isAdminInAppMetadata = user.app_metadata?.is_admin === true;

  return email === 'admin@cultheld.nl' || isAdminInAppMetadata;
};
