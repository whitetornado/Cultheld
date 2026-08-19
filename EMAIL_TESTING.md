# Email Testing Guide

## Overzicht

Het Cultheld email systeem is volledig getest en werkend. Emails worden verstuurd via Resend.com.

## Test Emails Verzonden

Alle test emails zijn succesvol verzonden naar **info@cultheld.nl** op 13 januari 2026:

### 1. Orderbevestiging
- **Order nummer**: TEST-1768344035952
- **Email ID**: 8767b3cc-93bc-4b0c-9bba-24e8058886c3
- **Status**: ✅ Verzonden
- **Inhoud**: Volledige orderbevestiging met:
  - Cultheld logo
  - Ordernummer
  - Productlijst
  - Prijsoverzicht (subtotaal, verzendkosten, BTW)
  - Verzendadres
  - Contactinformatie

### 2. Verzendbevestiging
- **Order nummer**: TEST-1768344035952
- **Email ID**: 26062c02-f297-45cd-84cd-36fb10d117ad
- **Status**: ✅ Verzonden
- **Inhoud**: Verzendbevestiging met:
  - Cultheld logo
  - Groene succes banner
  - Vervoerder: PostNL
  - Track & Trace: 3SABCD123456789
  - Link naar track & trace
  - Verwachte levertijd

## Email Templates

### Order Confirmation
- **Functie**: `send-order-confirmation`
- **Trigger**: Direct na succesvolle checkout
- **Van**: Cultheld <onboarding@resend.dev>
- **Template**: Professional HTML email met responsive design

### Shipping Notification
- **Functie**: `send-shipping-notification`
- **Trigger**: Wanneer admin tracking info toevoegt en "Verzendbevestiging Versturen" klikt
- **Van**: Cultheld <onboarding@resend.dev>
- **Template**: Professional HTML email met groene succes styling

## Admin Workflow

### Orderstatus Bijwerken (Gefixt)
Het probleem met het bijwerken van orderstatussen is opgelost:

1. **RLS Policies Update**: De Row Level Security policies voor `order_status_history` zijn gefixt
2. **Admin Check**: Gebruikt nu de correcte admin check: `auth.jwt()->>'email' = 'admin@cultheld.nl'`
3. **Resultaat**: Admins kunnen nu zonder errors:
   - Order status wijzigen
   - Tracking info toevoegen
   - Status notities toevoegen
   - Admin notities bijwerken

### Verzendbevestiging Versturen

In het admin order detail scherm:
1. Vul tracking nummer in
2. Selecteer vervoerder (PostNL, DHL, DPD, UPS, FedEx)
3. Klik "Wijzigingen Opslaan"
4. Klik "Verzendbevestiging Versturen"
5. Email wordt automatisch verstuurd naar klant

## Test Tools

### 1. Node.js Script
```bash
node test-email-flow.js
```

Dit script test:
- Orderbevestiging
- Verzendbevestiging (na 3 seconden)
- Volledige email flow

### 2. HTML Test Pagina
Open `test-emails.html` in browser voor interactieve testing:
- Test individuele emails
- Test complete flow
- Real-time feedback

## Belangrijke Notities

### Email Verzender
Momenteel gebruiken we `onboarding@resend.dev` als afzender omdat:
- Het cultheld.com domein nog niet geverifieerd is in Resend
- Dit is een test/development email adres van Resend
- Voor productie moet het domein geverifieerd worden

### Productie Setup
Voor productie moet je:
1. Domein cultheld.com verifiëren in Resend dashboard
2. Update edge functions om te gebruiken:
   - `orders@cultheld.com` voor orderbevestigingen
   - `shipping@cultheld.com` voor verzendbevestigingen
   - `noreply@cultheld.com` voor password reset emails

### RESEND_API_KEY
De API key is automatisch geconfigureerd in Supabase edge functions via environment variables.

## Email Monitoring

Alle verzonden emails zijn te bekijken in:
- Resend dashboard: https://resend.com/emails
- Email logs tonen delivery status
- Email IDs zijn beschikbaar voor tracking

## Password Reset Email Flow

### Test Scripts

**test-password-reset.js** - Test naar henk@websandapp.nl:
```bash
node test-password-reset.js
```

### Password Reset Email
- **Subject**: 🔒 Wachtwoord Resetten - Cultheld
- **Van**: Cultheld <onboarding@resend.dev>
- **Bevat**:
  - Cultheld logo in zwarte header
  - "Wachtwoord Resetten" button die redirect naar reset pagina
  - Alternative copy/paste link
  - Security waarschuwing (link 1 uur geldig)
  - Contact informatie

### Security Features
- Retourneert altijd success (onthult niet of email bestaat)
- Links zijn 1 uur geldig
- One-time use tokens
- Redirect naar `/#/reset-password`

## Troubleshooting

### Emails komen niet aan
1. Check spam folder
2. Verify RESEND_API_KEY is geconfigureerd
3. **Resend test mode limitatie**: Kan alleen emails verzenden naar info@cultheld.nl
4. Check Resend dashboard: https://resend.com/emails

### Domain verification errors
- Gebruik `onboarding@resend.dev` voor testing
- Configureer domein in Resend voor productie
- Voor andere emails dan info@cultheld.nl: verifieer eerst cultheld.com domein

### Admin kan order niet updaten
- Verify admin is ingelogd met admin@cultheld.nl
- Check RLS policies in Supabase dashboard

### Verzendbevestiging error (500)
- Verify JWT was disabled (verify_jwt: false) voor edge function
- Check admin permissions in database
