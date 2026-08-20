import { loadStripe } from '@stripe/stripe-js';

// Stripe.js should only be loaded once per page — loadStripe() caches the
// script tag internally, but keeping a single shared promise here avoids
// re-triggering it if <Checkout> re-renders.
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn(
    'VITE_STRIPE_PUBLISHABLE_KEY is not set — embedded checkout will fail to load. ' +
      'Add it to .env (and to the Netlify build environment) with your Stripe publishable key (pk_live_... or pk_test_...).'
  );
}

export const stripePromise = loadStripe(publishableKey || '');
