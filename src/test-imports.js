// Quick test file to verify all imports work correctly
// Run this with: node --loader ts-node/esm src/test-imports.js

console.log('Testing imports...');

// Test 1: subscriptionService
try {
  const { subscriptionService } = require('./services/subscriptionService');
  console.log('✅ subscriptionService imported successfully');
} catch (error) {
  console.error('❌ subscriptionService import failed:', error.message);
}

// Test 2: chatService
try {
  const { chatService } = require('./services/chatService');
  console.log('✅ chatService imported successfully');
} catch (error) {
  console.error('❌ chatService import failed:', error.message);
}

// Test 3: SubscriptionModal
try {
  const SubscriptionModal = require('./components/SubscriptionModal');
  console.log('✅ SubscriptionModal imported successfully');
} catch (error) {
  console.error('❌ SubscriptionModal import failed:', error.message);
}

console.log('\nAll import tests completed!');
