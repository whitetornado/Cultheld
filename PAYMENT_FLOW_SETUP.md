# Payment Flow Setup & Configuration

## Critical Configuration

### 1. APP_BASE_URL Environment Variable

The `APP_BASE_URL` **MUST** be configured in Supabase Edge Function secrets:

```bash
# In Supabase Dashboard → Project Settings → Edge Functions → Secrets
APP_BASE_URL=https://cultheld.nl
```

**Important:** This URL MUST match your deployed domain exactly. It's used for:
- Stripe Checkout Session `success_url` / `cancel_url` (where users return after payment)
- Email links in order confirmations
- Password reset links

### 2. Stripe Configuration

Required secrets in Supabase (Project Settings → Edge Functions → Secrets):
```bash
STRIPE_SECRET_KEY=sk_live_...       # or sk_test_... while testing
STRIPE_WEBHOOK_SECRET=whsec_...     # signing secret of the webhook endpoint below
```

Stripe Dashboard configuration:
- Developers → Webhooks → Add endpoint: `https://kraszqrhydhhkknyapxa.supabase.co/functions/v1/stripe-webhook`
- Events to send: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
- Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`
- Test mode: use test API keys + Stripe's test cards while developing
- Production: switch to live API keys and re-create the webhook endpoint in live mode (test and live webhooks are separate)

No publishable key is needed on the frontend — checkout uses Stripe's hosted Checkout page, so the browser only ever sees the redirect URL Stripe returns.

## Payment Flow Overview

### 1. Customer Places Order (Checkout)

**File:** `src/pages/Checkout.tsx`

Steps:
1. User fills in shipping details
2. If not logged in: creates account or prompts to login
3. Saves customer profile (NAW data)
4. Calls `purchases-create` edge function
5. Calls `stripe-create-checkout-session` edge function
6. Redirects to the Stripe-hosted checkout URL

### 2. Stripe Checkout Session Creation

**Edge Function:** `supabase/functions/stripe-create-checkout-session/index.ts`

What it does:
- Builds itemized line items from the cart (legend + product + color/size) plus a shipping line item
- Creates a Checkout Session via the Stripe API (`mode: payment`)
- Stores the session in the `payments` table (`stripe_checkout_session_id`, `checkout_url`)
- Sets `success_url`: `${APP_BASE_URL}/#/payment/return?purchase_id=...&token=...&session_id={CHECKOUT_SESSION_ID}`
- Sets `cancel_url`: `${APP_BASE_URL}/#/checkout`
- Updates purchase status to `pending_payment`

**Critical:** If APP_BASE_URL is not set or wrong, users will be redirected to the wrong domain!

### 3. Webhook Updates

**Edge Function:** `supabase/functions/stripe-webhook/index.ts`

Triggered by Stripe when a Checkout Session's payment status changes:
- Verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`
- Updates `payments` table (status, `stripe_payment_intent_id`, `paid_at`, `webhook_called_at`)
- Updates `purchases` table status:
  - `paid` if the session's `payment_status` is `paid`
  - `failed` if the payment failed or the session expired
  - `pending_payment` otherwise
- Sends order confirmation + admin notification emails when a session completes as paid

**Idempotent:** Can be called multiple times safely; every event is logged in `webhook_logs`.

### 4. Return URL Handling

**Page:** `src/pages/PaymentReturn.tsx`

When user returns from Stripe:
1. Extracts `purchase_id` (and `token`) from the URL query
2. Polls `stripe-payment-status`, which re-checks the Checkout Session directly with Stripe as a backup to the webhook
3. Shows appropriate UI:
   - Success: if status is `paid`
   - Pending/open: if still processing or the session wasn't completed yet
   - Failed: if payment failed or the session expired

**Route:** `/#/payment/return?purchase_id=xxx&token=xxx&session_id=xxx`

## Troubleshooting

### Issue: User returns to homepage instead of payment return page

**Cause:** APP_BASE_URL not configured or incorrect

**Fix:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Add/update: `APP_BASE_URL=https://cultheld.nl`
3. Redeploy edge functions if needed

**Verify:**
- Check diagnostics page: `/#/admin/payments/diagnostics`
- Look at recent purchase in database
- Check payments table for correct checkout_url

### Issue: Purchase stays in pending_payment after successful payment

**Cause:** Webhook not being called or failing

**Fix:**
1. Check Stripe Dashboard → Developers → Webhooks → recent deliveries for the endpoint
2. Verify webhook URL is: `https://kraszqrhydhhkknyapxa.supabase.co/functions/v1/stripe-webhook`
3. Check Edge Function logs for webhook errors
4. Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are configured and match the endpoint's mode (test vs live)

**Verify:**
- Check `webhook_called_at` in payments table (should be set)
- Check Stripe Dashboard for webhook delivery status/response code
- Use diagnostics page to see recent webhook calls

### Issue: Orders not visible in admin panel

**Cause:** Purchase status not updated to 'paid'

**Fix:**
1. Check webhook is working (see above)
2. Verify RLS policies allow admin to read purchases
3. Check admin user has role='admin' in metadata

**Verify:**
- Go to `/#/admin/purchases` to see all purchases
- Filter by status to see pending vs paid
- Check diagnostics page for recent purchases

## Admin Pages

### Purchases Management
**URL:** `/#/admin/purchases`

Shows all purchases with:
- Customer details
- Product information
- Payment status
- Order status
- Search and filter functionality
- Statistics dashboard

### Payment Diagnostics
**URL:** `/#/admin/payments/diagnostics`

Debug information:
- Last 20 purchases with status
- Last 20 payments with Stripe Checkout Session IDs
- Environment configuration check
- Common issues & fixes
- Troubleshooting tips

## Customer Profile System

### Database Table: `customer_profiles`

Fields:
- `full_name` - Customer full name
- `phone` - Phone number (optional)
- `address` - Street address
- `city` - City
- `postal_code` - Postal code
- `country` - Country (default: Nederland)

### User Profile Page
**URL:** `/#/profile`

Logged-in users can:
- View and edit their profile
- Update NAW (Name, Address, City) data
- Update phone number
- Change email (via Supabase auth)

### Checkout Integration

**Smart checkout flow:**
1. If user logged in → prefill profile data
2. If user not logged in → show login prompt
3. If user chooses to continue as guest → create account automatically
4. Save/update profile data after successful order

**Admin capabilities:**
- Admins can view all customer profiles
- Admins can edit customer profiles
- Access via `/#/admin/customers`

## Testing Payment Flow

### 1. Test Stripe Payment

1. Use Stripe test-mode API keys (`sk_test_...`) and register a test-mode webhook endpoint
2. Place a test order
3. Use Stripe's test cards, e.g.:
   - Success: `4242 4242 4242 4242`, any future expiry, any CVC
   - Declined: `4000 0000 0000 0002`
   - Requires authentication (3D Secure): `4000 0025 0000 3155`

### 2. Verify Flow

1. Place order → should redirect to Stripe Checkout
2. Complete payment → should return to `/#/payment/return`
3. Check purchase status → should be 'paid'
4. Check admin panel → order should be visible
5. Check email → confirmation sent (if configured)

### 3. Check Diagnostics

1. Go to `/#/admin/payments/diagnostics`
2. Verify recent purchase appears
3. Check payment has a Stripe Checkout Session ID
4. Verify webhook_called_at is set
5. Confirm statuses match

## Security Notes

- All edge functions use manual JWT verification (verify_jwt=false)
- Customer profiles have RLS policies
- Admins can access all data
- Users can only access their own data
- Webhook signature is verified with `STRIPE_WEBHOOK_SECRET` before any DB writes; webhook uses service role key for DB updates
- Stripe Checkout Session URLs are one-time use (Stripe handles this)

## Production Checklist

Before going live:

- [ ] Set APP_BASE_URL to production domain
- [ ] Switch to live Stripe API key (`sk_live_...`)
- [ ] Create a live-mode webhook endpoint in Stripe and set `STRIPE_WEBHOOK_SECRET` accordingly
- [ ] Test complete payment flow end-to-end with a real low-value payment
- [ ] Verify email notifications work
- [ ] Check SSL certificate is valid
- [ ] Test on mobile devices
- [ ] Verify return URL redirects correctly
- [ ] Test failed / declined payment scenario
- [ ] Check admin panel shows orders
- [ ] Verify customer can see order history

## Email Notifications

Edge functions for emails:
- `send-order-confirmation` - Sends confirmation to customer
- `send-admin-notification` - Notifies admin of new order
- `send-shipping-notification` - Shipping updates

**Configuration:** Check email templates and sender in edge function code.
