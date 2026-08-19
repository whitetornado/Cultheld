/**
 * Test Password Reset Email - Real User
 *
 * Tests de wachtwoord reset email met een bestaande gebruiker
 *
 * Run: node test-password-reset-real.js
 */

const SUPABASE_URL = 'https://kraszqrhydhhkknyapxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYXN6cXJoeWRoaGtrbnlhcHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDM3NzcsImV4cCI6MjA4Mzg3OTc3N30.dJA6hNpvAcNueNIHfz7tp6_fs-ND3UkoclTcOqWS-qY';

async function testPasswordResetEmail() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Testing Password Reset - Existing User              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const testEmail = 'admin@cultheld.nl'; // Admin user that should exist

  console.log(`📧 Sending password reset email to: ${testEmail} (existing user)\n`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: testEmail,
        redirect_url: 'https://cultheld.nl/#/reset-password',
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ SUCCESS: Password reset email sent!\n');
      console.log('📧 Email Details:');
      console.log(`   To: ${testEmail}`);
      if (result.emailId) {
        console.log(`   Email ID: ${result.emailId}`);
        console.log(`   Status: Email verzonden via Resend`);
      }
      console.log(`   Message: ${result.message}\n`);

      console.log('✨ Check your inbox at info@cultheld.nl');
      console.log('   The email contains:');
      console.log('   • Cultheld branding');
      console.log('   • Reset button that redirects to reset password page');
      console.log('   • Alternative copy/paste link');
      console.log('   • 1 hour expiration warning');
      console.log('   • Security notice\n');
    } else {
      console.error('❌ FAILED: Password reset email');
      console.error(`   Error: ${result.error || 'Unknown error'}`);
      console.error(`   Status: ${response.status}\n`);
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error.message, '\n');
  }
}

// Run the test
testPasswordResetEmail().catch(console.error);
