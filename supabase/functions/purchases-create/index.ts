import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Try to get authenticated user, but allow guest checkout
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let user = null;

    if (authHeader) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      });

      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();

      if (!authError && authUser) {
        user = authUser;
        console.log('Authenticated user checkout:', user.id);
      } else {
        console.log('Auth header present but invalid, proceeding as guest');
      }
    } else {
      console.log('No auth header, proceeding as guest checkout');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { product_slug, customer_email, customer_name, metadata } = body;

    if (!product_slug || !customer_email || !customer_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', product_slug)
      .eq('active', true)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const returnToken = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(returnToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const returnTokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const totalAmount = metadata?.total || product.amount_value;

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user?.id || null,
        product_id: product.id,
        product_slug: product.slug,
        product_name: product.name,
        customer_email,
        customer_name,
        amount_value: totalAmount,
        currency: product.currency,
        status: 'created',
        metadata: metadata || {},
        return_token_hash: returnTokenHash,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Purchase creation error:', purchaseError);
      return new Response(
        JSON.stringify({ error: 'Failed to create purchase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ purchase, return_token: returnToken }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
