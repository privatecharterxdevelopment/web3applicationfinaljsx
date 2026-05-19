/**
 * PrivateCharterX - Stripe Connect Partner Marketplace API Server
 *
 * This Express server handles all Stripe Connect operations for the partner marketplace:
 * - Partner account creation and onboarding
 * - Payment processing with escrow (Uber-style)
 * - Commission-based transfers to partners
 * - Webhook handling for Stripe events
 * - Admin dashboard management
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import API modules
// Partner marketplace disabled - uncomment if needed
// const stripeConnectApi = require('./api/stripe-connect-partners.cjs');
// const stripeWebhook = require('./api/webhooks/stripe-connect-webhook.cjs');
const stripeSubscriptionWebhook = require('./api/webhooks/stripe-subscription-webhook.cjs');
const newsletterApi = require('./api/newsletter.cjs');
const coingateApi = require('./api/coingate.cjs');
const { handleCrmAdmin } = require('./api/crm-admin.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Middleware Configuration
// ============================================================

// CORS - Allow frontend to make requests
const corsOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5178',
      'https://www.privatecharterx.com',
      'https://privatecharterx.com',
      'https://web3applicationfinaljsx-1.vercel.app',
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Webhook endpoints need raw body for signature verification
// app.use('/webhooks/stripe-connect', express.raw({ type: 'application/json' }));
app.use('/webhooks/stripe-subscription', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================
// Stripe Connect Partner API Routes - DISABLED
// ============================================================

// Partner marketplace features disabled - uncomment if needed
// app.post('/api/partners/create-connect-account', stripeConnectApi.createConnectAccount);
// app.post('/api/partners/onboarding-link', stripeConnectApi.getOnboardingLink);
// app.get('/api/partners/account-status', stripeConnectApi.getAccountStatus);
// app.post('/api/partners/express-dashboard-link', stripeConnectApi.getExpressDashboardLink);
// app.post('/api/partners/create-booking-payment', stripeConnectApi.createPartnerBookingPayment);
// app.post('/api/partners/accept-booking', stripeConnectApi.acceptBooking);
// app.post('/api/partners/reject-booking', stripeConnectApi.rejectBooking);
// app.post('/api/partners/capture-and-transfer', stripeConnectApi.captureAndTransferToPartner);
// app.get('/api/partners/earnings', stripeConnectApi.getPartnerEarnings);
// app.get('/api/admin/stripe-dashboard-links', stripeConnectApi.getAdminStripeDashboardLinks);

// ============================================================
// Newsletter API Routes
// ============================================================

// Public Newsletter Routes
app.post('/api/newsletter/subscribe', newsletterApi.subscribe);
app.post('/api/newsletter/unsubscribe', newsletterApi.unsubscribe);
app.patch('/api/newsletter/preferences', newsletterApi.updatePreferences);
app.get('/api/newsletter/preferences', newsletterApi.getPreferences);

// WordPress Integration
app.post('/api/newsletter/wordpress-subscribe', newsletterApi.wordpressSubscribe);

// Admin Newsletter Routes
app.get('/api/newsletter/subscribers', newsletterApi.getSubscribers);
app.get('/api/newsletter/stats', newsletterApi.getStats);
app.post('/api/newsletter/send', newsletterApi.sendNewsletter);

// Newsletter Template Management (Admin)
app.get('/api/newsletter/templates', newsletterApi.getTemplates);
app.post('/api/newsletter/templates', newsletterApi.createTemplate);
app.patch('/api/newsletter/templates/:id', newsletterApi.updateTemplate);
app.delete('/api/newsletter/templates/:id', newsletterApi.deleteTemplate);

// ============================================================
// CoinGate Crypto Payment API Routes
// ============================================================

app.post('/api/coingate/create-order', coingateApi.createOrder);

// ============================================================
// CRM Admin API (service role server-side only)
// ============================================================

app.post('/api/crm-admin', handleCrmAdmin);

// ============================================================
// Webhook Endpoints
// ============================================================

// app.post('/webhooks/stripe-connect', stripeWebhook.handleStripeConnectWebhook);
app.post('/webhooks/stripe-subscription', stripeSubscriptionWebhook.handleStripeSubscriptionWebhook);

// ============================================================
// Health Check and Status
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'test' : 'live'
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'PrivateCharterX API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      newsletter: '/api/newsletter/*',
      coingate: '/api/coingate/*',
      crmAdmin: '/api/crm-admin',
      webhooks: '/webhooks/stripe-subscription'
    }
  });
});

// ============================================================
// Error Handling
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// Server Start
// ============================================================

// Export app for Vercel serverless deployment
module.exports = app;

// Only start server if running directly (not imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 PrivateCharterX API');
    console.log('='.repeat(60));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Stripe Mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'TEST' : 'LIVE'}`);
    console.log(`✅ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log('='.repeat(60));
    console.log('📡 Endpoints:');
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Newsletter API: http://localhost:${PORT}/api/newsletter/*`);
    console.log(`   CoinGate API: http://localhost:${PORT}/api/coingate/*`);
    console.log(`   Webhooks: http://localhost:${PORT}/webhooks/stripe-subscription`);
    console.log('='.repeat(60));
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
  });
}
