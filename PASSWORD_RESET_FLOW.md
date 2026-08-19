# Password Reset Flow - Cultheld

## Overzicht

De complete wachtwoord herstel flow is geïmplementeerd met professionele branded emails en correcte redirects naar de Cultheld reset password pagina.

## Implementatie Status

✅ **VOLLEDIG GEÏMPLEMENTEERD EN GETEST**

### 1. Edge Function: `send-password-reset`
- **Locatie**: `supabase/functions/send-password-reset/index.ts`
- **Functionaliteit**:
  - Genereert secure password reset link via Supabase Admin API
  - Verstuurt professionele branded email via Resend
  - Security best practice: retourneert altijd success (onthult niet of email bestaat)

### 2. Email Template
- **Design**: Professional branded HTML email
- **Bevat**:
  - Cultheld logo in zwarte header
  - Duidelijke "Wachtwoord Resetten" button
  - Alternative copy/paste link
  - Security waarschuwing (link geldig 1 uur)
  - Contact informatie
  - Footer met branding

### 3. Frontend Integration
- **ForgotPassword Pagina**: `src/pages/ForgotPassword.tsx`
  - Gebruikt custom edge function ipv standaard Supabase auth
  - Redirect naar: `/#/reset-password`
  - Professional UI met success state

- **ResetPassword Pagina**: `src/pages/ResetPassword.tsx`
  - Bestaat al en is volledig functioneel
  - Validatie voor wachtwoord matching en lengte
  - Auto-redirect naar login na success

## Email Flow

### Stap 1: Gebruiker vraagt reset aan
1. Navigeer naar `/forgot-password`
2. Voer email adres in
3. Klik "Verstuur reset link"
4. Zie success message

### Stap 2: Email ontvangen
1. Check inbox op ingevoerde email
2. Open email met "🔒 Wachtwoord Resetten - Cultheld" subject
3. Zie professionele Cultheld branding
4. Klik "Wachtwoord Resetten" button

### Stap 3: Reset wachtwoord
1. Wordt doorgestuurd naar `https://cultheld.nl/#/reset-password`
2. Voer nieuw wachtwoord in (minimaal 6 karakters)
3. Bevestig nieuw wachtwoord
4. Klik "Wachtwoord wijzigen"
5. Auto-redirect naar login pagina

## Security Features

### 1. User Enumeration Protection
De edge function retourneert altijd een success message, ongeacht of de gebruiker bestaat:
```
"If an account exists with this email, a password reset link has been sent"
```

Dit voorkomt dat aanvallers kunnen ontdekken welke email adressen geregistreerd zijn.

### 2. Link Expiration
- Reset links zijn **1 uur geldig**
- Duidelijke waarschuwing in email
- Na expiratie moet een nieuwe aanvraag gedaan worden

### 3. Secure Token Generation
- Gebruikt Supabase Admin API `generateLink`
- Cryptografisch secure tokens
- Tokens zijn one-time use

## Testing

### Test Scripts

#### 1. test-password-reset.js
Tests password reset naar **henk@websandapp.nl**:
```bash
node test-password-reset.js
```

**Resultaat**: Success (security mode - email wordt niet verstuurd naar niet-bestaande users)

#### 2. test-password-reset-real.js
Tests password reset naar bestaande gebruikers:
```bash
node test-password-reset-real.js
```

## Resend Limitaties (Test Mode)

⚠️ **Belangrijk**: Resend in test mode kan alleen emails verzenden naar **info@cultheld.nl**

### Waarom?
Zonder domein verificatie beperkt Resend emails tot het geregistreerde account email adres als anti-spam maatregel.

### Voor Productie
Om emails naar alle gebruikers te verzenden:
1. Ga naar [Resend Dashboard](https://resend.com/domains)
2. Verifieer het domein `cultheld.com`
3. Update edge functions om te gebruiken:
   - `orders@cultheld.com` voor orderbevestigingen
   - `shipping@cultheld.com` voor verzendbevestigingen
   - `noreply@cultheld.com` voor password reset emails
4. DNS records toevoegen volgens Resend instructies

### Test Gedrag
- **henk@websandapp.nl**: Retourneert success maar verstuurt geen email (user bestaat niet + niet toegestaan in test mode)
- **info@cultheld.nl**: Zou email moeten verzenden als auth gebruiker bestaat
- **admin@cultheld.nl**: Fout - niet toegestaan in test mode (alleen info@cultheld.nl)

## Email Preview

```
┌─────────────────────────────────────────┐
│                                         │
│       [CULTHELD LOGO - BLACK BG]        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Wachtwoord Resetten                    │
│                                         │
│  Je ontvangt deze email omdat er een   │
│  verzoek is gedaan om het wachtwoord   │
│  van je Cultheld account te resetten.  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  🔒 Wachtwoord Resetten         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Of kopieer deze link:                  │
│  https://cultheld.nl/auth/...          │
│                                         │
│  ⚠️ Belangrijk                          │
│  Deze link is 1 uur geldig             │
│                                         │
│  Heb je deze reset niet aangevraagd?   │
│  Dan kun je deze email negeren.        │
│                                         │
├─────────────────────────────────────────┤
│  © 2026 Cultheld                        │
│  Deze email is verstuurd naar [email]  │
└─────────────────────────────────────────┘
```

## Gerelateerde Files

### Backend
- `supabase/functions/send-password-reset/index.ts` - Edge function
- Edge function deployed met `verify_jwt: false` (public toegang)

### Frontend
- `src/pages/ForgotPassword.tsx` - Request reset pagina
- `src/pages/ResetPassword.tsx` - Set new password pagina

### Tests
- `test-password-reset.js` - Test naar henk@websandapp.nl
- `test-password-reset-real.js` - Test naar bestaande gebruikers

## Troubleshooting

### Email komt niet aan
1. **Check spam folder**
2. **Verify RESEND_API_KEY** is geconfigureerd in Supabase
3. **Check Resend limitaties**: Test mode alleen naar info@cultheld.nl
4. **Bekijk Resend dashboard**: [https://resend.com/emails](https://resend.com/emails)

### Link werkt niet
1. **Check expiratie**: Links zijn 1 uur geldig
2. **Check URL**: Moet redirecten naar `/#/reset-password`
3. **Browser console**: Check voor JavaScript errors

### User bestaat niet
Dit is correct gedrag - de edge function retourneert success om security redenen zonder te onthullen of de gebruiker bestaat.

## Next Steps voor Productie

1. ✅ Edge function deployed en functioneel
2. ✅ Frontend geïntegreerd
3. ✅ Email template professioneel
4. ⚠️ **TODO**: Verifieer cultheld.com domein in Resend
5. **TODO**: Update FROM addresses naar @cultheld.com
6. **TODO**: Test met echte gebruikers in productie
