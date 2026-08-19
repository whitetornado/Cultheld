# Edge Function Authentication Setup

## Overview

All Cultheld edge functions use **manual JWT verification** with `verify_jwt=false` to support ES256/JWKS tokens from Supabase Auth.

## Why Manual Verification?

Supabase Edge Functions gateway's built-in JWT verification (`verify_jwt=true`) only supports HS256 tokens. When Supabase Auth uses ES256 (asymmetric) tokens with JWKS, the gateway rejects them with "Invalid JWT" errors.

**Solution**: Disable gateway JWT verification and verify tokens manually inside each function using `supabase.auth.getUser()`.

## Current Function Configuration

All auth-required functions have `verifyJWT: false`:

- ✓ `auth-debug` - Auth testing/debugging tool
- ✓ `purchases-create` - Create purchase records
- ✓ `mollie-create-payment` - Create Mollie payments
- ✓ `mollie-payment-status` - Check payment status
- ✓ `mollie-webhook` - Mollie webhook (public, no auth needed)

## Auth Pattern Implementation

All authenticated functions follow this pattern:

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Read Authorization header (case-insensitive)
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header', error_code: 'auth_missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create Supabase client with forwarded auth header
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // 3. Verify user with manual auth check
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          error_code: 'auth_invalid',
          details: authError?.message
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. User is authenticated, create service role client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Continue with function logic...
    // user.id is available
    // user.email is available

  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Key Points

1. **Case-Insensitive Headers**: Check both `Authorization` and `authorization` headers
2. **ANON Key for Auth**: Use ANON key (not service key) when creating client for auth verification
3. **Forward Auth Header**: Pass the Authorization header to the client via global headers
4. **Service Key for DB**: After auth, use service role key for database operations
5. **Error Codes**: Return structured errors with `error_code` for easier debugging

## Testing Auth

### 1. Use the Debug Page

Visit `/#/debug/supabase` in your app:

1. Log in as admin (admin@cultheld.nl)
2. Click "Run Auth Check"
3. Verify:
   - ✓ Frontend session exists
   - ✓ Edge function authenticates successfully
   - ✓ User ID and email are returned

### 2. Direct Function Test

```bash
# Get your access token from browser console
# localStorage.getItem('supabase.auth.token')

# Test auth-debug
curl https://kraszqrhydhhkknyapxa.supabase.co/functions/v1/auth-debug \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST

# Expected response:
{
  "authenticated": true,
  "userId": "...",
  "userEmail": "admin@cultheld.nl",
  ...
}
```

### 3. Test Purchase Creation

```bash
curl https://kraszqrhydhhkknyapxa.supabase.co/functions/v1/purchases-create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "product_slug": "custom-legend-tee",
    "customer_email": "test@example.com",
    "customer_name": "Test User",
    "metadata": {}
  }'

# Expected response:
{
  "purchase": {
    "id": "...",
    "user_id": "...",
    "status": "created",
    ...
  }
}
```

## Frontend Integration

The frontend (`src/lib/payments.ts`) correctly:

1. Gets session: `await supabase.auth.getSession()`
2. Checks session exists: `if (!session) throw new Error('Not authenticated')`
3. Passes token: `Authorization: Bearer ${session.access_token}`

## Common Issues

### "Invalid JWT" Error

**Cause**: Gateway JWT verification is enabled (`verifyJWT: true`)

**Solution**: Redeploy function with `verify_jwt=false`:
```bash
supabase functions deploy function-name --no-verify-jwt
```

### "Unauthorized" from auth.getUser()

**Possible causes**:
1. Token expired - User needs to refresh session
2. Token invalid - User needs to log in again
3. Wrong Supabase project - Check SUPABASE_URL matches

**Debug**: Use `/debug/supabase` page to see exact error

### CORS Errors

**Cause**: Missing CORS headers in function response

**Solution**: All responses must include corsHeaders:
```typescript
headers: { ...corsHeaders, 'Content-Type': 'application/json' }
```

## Environment Variables

All functions automatically have access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for DB operations)

Additional secrets (configured in Supabase dashboard):
- `MOLLIE_API_KEY` - Mollie payment API key
- `APP_BASE_URL` - Your app's base URL (for redirects)

## Security Notes

1. **Never expose service role key** - Only use in edge functions, never in frontend
2. **Always verify auth** - Don't trust client-side checks
3. **Use RLS policies** - Database has row-level security enabled
4. **Validate input** - Check all user input before using
5. **Rate limiting** - Consider adding rate limits to public endpoints

## Deployment

Deploy all functions with correct settings:

```bash
supabase functions deploy auth-debug --no-verify-jwt
supabase functions deploy purchases-create --no-verify-jwt
supabase functions deploy mollie-create-payment --no-verify-jwt
supabase functions deploy mollie-payment-status --no-verify-jwt
supabase functions deploy mollie-webhook --no-verify-jwt
```

Or via Supabase API (done automatically in this project).
