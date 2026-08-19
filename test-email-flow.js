/**
 * Test Email Flow Script
 *
 * Tests alle email notificaties door naar info@cultheld.nl te versturen:
 * 1. Orderbevestiging
 * 2. Verzendbevestiging
 *
 * Run: node test-email-flow.js
 */

const SUPABASE_URL = 'https://kraszqrhydhhkknyapxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYXN6cXJoeWRoaGtrbnlhcHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDM3NzcsImV4cCI6MjA4Mzg3OTc3N30.dJA6hNpvAcNueNIHfz7tp6_fs-ND3UkoclTcOqWS-qY';

async function testOrderConfirmation() {
  console.log('\n=== Testing Order Confirmation Email ===\n');

  const orderData = {
    order_number: 'TEST-' + Date.now(),
    customer_email: 'info@cultheld.nl',
    customer_name: 'Cultheld Test Admin',
    customer_phone: '+31612345678',
    shipping_address: {
      street: 'Teststraat 123',
      city: 'Amsterdam',
      postal_code: '1012 AB',
      country: 'Nederland'
    },
    subtotal: 39.99,
    shipping_cost: 5.95,
    tax: 9.65,
    total: 55.59,
    items: [
      {
        legend_name: 'Johan Cruijff',
        product_type_name: 'T-Shirt',
        color_name: 'Zwart',
        size: 'M',
        quantity: 1,
        unit_price: 39.99,
        total_price: 39.99
      },
      {
        legend_name: 'Marco van Basten',
        product_type_name: 'Sweater',
        color_name: 'Grijs',
        size: 'L',
        quantity: 2,
        unit_price: 49.99,
        total_price: 99.98
      }
    ]
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS: Order confirmation email sent');
      console.log(`   To: info@cultheld.nl`);
      console.log(`   Order: ${orderData.order_number}`);
      console.log(`   Total: €${orderData.total.toFixed(2)}`);
      if (result.emailId) {
        console.log(`   Email ID: ${result.emailId}`);
      }
      return orderData.order_number;
    } else {
      console.error('❌ FAILED: Order confirmation email');
      console.error(`   Error: ${result.error || 'Unknown error'}`);
      console.error(`   Status: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error.message);
    return null;
  }
}

async function testShippingNotification(orderNumber) {
  console.log('\n=== Testing Shipping Notification Email ===\n');

  const shippingData = {
    order_number: orderNumber || 'TEST-' + Date.now(),
    customer_email: 'info@cultheld.nl',
    customer_name: 'Cultheld Test Admin',
    tracking_number: '3SABCD123456789',
    carrier: 'PostNL'
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-shipping-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(shippingData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS: Shipping notification email sent');
      console.log(`   To: info@cultheld.nl`);
      console.log(`   Order: ${shippingData.order_number}`);
      console.log(`   Carrier: ${shippingData.carrier}`);
      console.log(`   Tracking: ${shippingData.tracking_number}`);
      if (result.emailId) {
        console.log(`   Email ID: ${result.emailId}`);
      }
      return true;
    } else {
      console.error('❌ FAILED: Shipping notification email');
      console.error(`   Error: ${result.error || 'Unknown error'}`);
      console.error(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR:', error.message);
    return false;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteFlow() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Testing Complete Email Flow to info@cultheld.nl     ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Test 1: Order Confirmation
  const orderNumber = await testOrderConfirmation();

  if (!orderNumber) {
    console.log('\n❌ Flow stopped: Order confirmation failed\n');
    return;
  }

  // Wait between emails
  console.log('\n⏳ Waiting 3 seconds before sending shipping notification...\n');
  await sleep(3000);

  // Test 2: Shipping Notification
  const shippingSuccess = await testShippingNotification(orderNumber);

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                     SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  if (shippingSuccess) {
    console.log('✅ Complete email flow SUCCESS');
    console.log(`   Order: ${orderNumber}`);
    console.log('   All emails sent to: info@cultheld.nl\n');
    console.log('📧 Check your inbox at info@cultheld.nl');
    console.log('   - Order confirmation email');
    console.log('   - Shipping notification email\n');
  } else {
    console.log('⚠️  Partial success');
    console.log('   Order confirmation: ✅');
    console.log('   Shipping notification: ❌\n');
  }
}

// Run the test
testCompleteFlow().catch(console.error);
