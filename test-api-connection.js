/**
 * API Connection Test Script
 * Run this to verify your Ticketmaster and Eventbrite API keys are working
 *
 * Usage: node test-api-connection.js
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

const TICKETMASTER_KEY = process.env.VITE_TICKETMASTER_CONSUMER_KEY;
const EVENTBRITE_TOKEN = process.env.VITE_EVENTBRITE_TOKEN;

console.log('\n🔍 Testing API Connections...\n');

// Test Ticketmaster API
async function testTicketmaster() {
  console.log('📍 Testing Ticketmaster API...');

  if (!TICKETMASTER_KEY) {
    console.log('❌ Ticketmaster API Key not found in .env file');
    console.log('   Set VITE_TICKETMASTER_CONSUMER_KEY in your .env file\n');
    return false;
  }

  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_KEY}&city=New+York&size=1`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      if (data._embedded && data._embedded.events) {
        console.log('✅ Ticketmaster API: Connected successfully!');
        console.log(`   Found events: ${data._embedded.events[0]?.name || 'N/A'}\n`);
        return true;
      }
    } else {
      console.log(`❌ Ticketmaster API Error: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        console.log('   Invalid API key. Please check your VITE_TICKETMASTER_CONSUMER_KEY\n');
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Ticketmaster API Error:', error.message);
    return false;
  }
}

// Test Eventbrite API
async function testEventbrite() {
  console.log('🎫 Testing Eventbrite API...');

  if (!EVENTBRITE_TOKEN) {
    console.log('❌ Eventbrite Token not found in .env file');
    console.log('   Set VITE_EVENTBRITE_TOKEN in your .env file\n');
    return false;
  }

  try {
    const url = 'https://www.eventbriteapi.com/v3/events/search/?location.address=New+York';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.events) {
        console.log('✅ Eventbrite API: Connected successfully!');
        console.log(`   Found ${data.events.length} events\n`);
        return true;
      }
    } else {
      console.log(`❌ Eventbrite API Error: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        console.log('   Invalid token. Please check your VITE_EVENTBRITE_TOKEN\n');
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Eventbrite API Error:', error.message);
    return false;
  }
}

// Run tests
(async () => {
  const ticketmasterOk = await testTicketmaster();
  const eventbriteOk = await testEventbrite();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Ticketmaster: ${ticketmasterOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`Eventbrite:   ${eventbriteOk ? '✅ Working' : '❌ Failed'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!ticketmasterOk && !eventbriteOk) {
    console.log('⚠️  No API keys configured. App will use mock data.');
    console.log('📖 See QUICKSTART_EVENTS.md for setup instructions.\n');
  } else if (ticketmasterOk && eventbriteOk) {
    console.log('🎉 All APIs connected! Your Events page is ready to use.\n');
  } else {
    console.log('⚠️  Some APIs failed. App will use mixed data (API + mock).\n');
  }
})();
