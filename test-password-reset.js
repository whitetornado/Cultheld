/**
 * Test Password Reset Email
 *
 * Tests de wachtwoord reset email flow naar henk@websandapp.nl
 *
 * Run: node test-password-reset.js
 */

const SUPABASE_URL = 'https://kraszqrhydhhkknyapxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYXN6cXJoeWRoaGtrbnlhcHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDM3NzcsImV4cCI6MjA4Mzg3OTc3N30.dJA6hNpvAcNueNIHfz7tp6_fs-ND3UkoclTcOqWS-qY';

async function testPasswordResetEmail() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Testing Password Reset Email Flow                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Test with henk@websandapp.nl as requested
  const testEmail = 'henk@websandapp.nl';

  console.log(`📧 Sending password reset email to: ${testEmail}\n`);

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
      }
      console.log(`   Message: ${result.message}\n`);

      console.log('📋 What to check in the email:');
      console.log('   ✓ Cultheld logo in header');
      console.log('   ✓ Professional branded design');
      console.log('   ✓ "Wachtwoord Resetten" button');
      console.log('   ✓ Link expires in 1 hour warning');
      console.log('   ✓ Alternative link to copy');
      console.log('   ✓ Security notice');
      console.log('   ✓ Contact information\n');

      console.log('🔗 The reset link will redirect to:');
      console.log('   https://cultheld.nl/#/reset-password\n');

      console.log('✨ Check your inbox at henk@websandapp.nl');
      console.log('   (Also check spam folder if not found)\n');
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
