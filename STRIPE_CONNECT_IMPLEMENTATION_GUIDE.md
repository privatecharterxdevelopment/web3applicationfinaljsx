# Stripe Connect Partner Marketplace Implementation Guide

## Overview

This guide covers the complete implementation of the Stripe Connect partner marketplace for PrivateCharterX, enabling an Uber-like payment system where:

- **Partners** register and create Stripe Connect Express accounts
- **Customers** book services (taxi, luxury car, adventure) and pay via escrow
- **Payment flow**: Customer pays → Escrow hold → Partner confirms arrival → Payment captured + transferred to partner minus commission
- **Commission structure**: Taxi (10%), Luxury Car (12%), Adventure (15%)
- **Payout schedule**: Daily automatic payouts to partners
- **Multi-region support**: Europe, Switzerland, USA, Asia

---

## Table of Contents

1. [Database Setup](#1-database-setup)
2. [Stripe Account Setup](#2-stripe-account-setup)
3. [Backend API Deployment](#3-backend-api-deployment)
4. [Webhook Configuration](#4-webhook-configuration)
5. [Frontend Environment Variables](#5-frontend-environment-variables)
6. [Supabase Storage Setup](#6-supabase-storage-setup)
7. [Testing the Flow](#7-testing-the-flow)
8. [Production Deployment](#8-production-deployment)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Database Setup

### Step 1.1: Run Database Migrations

Run both SQL migrations in your Supabase SQL Editor in this order:

```bash
# 1. First, run the existing partner_system.sql
supabase/migrations/partner_system.sql

# 2. Then, run the new Stripe Connect fields migration
supabase/migrations/add_stripe_connect_fields.sql
```

### Step 1.2: Verify Tables Created

Check that these tables exist in your Supabase database:

- `users` (with new Stripe Connect columns)
- `partner_details`
- `partner_services`
- `partner_bookings` (with commission columns)
- `partner_notifications`
- `partner_payouts`
- `partner_earnings` ✨ NEW
- `partner_stripe_accounts` ✨ NEW

### Step 1.3: Test Commission Calculation Function

```sql
-- Test the commission calculation function
SELECT * FROM calculate_partner_commission('taxi', 100.00);
-- Should return: rate=0.10, commission=10.00, earnings=90.00

SELECT * FROM calculate_partner_commission('luxury-car', 100.00);
-- Should return: rate=0.12, commission=12.00, earnings=88.00

SELECT * FROM calculate_partner_commission('adventure', 100.00);
-- Should return: rate=0.15, commission=15.00, earnings=85.00
```

---

## 2. Stripe Account Setup

### Step 2.1: Enable Stripe Connect

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Connect** → **Settings**
3. Click **Get Started** if not already enabled
4. Choose **Express** as your account type
5. Complete the onboarding questionnaire

### Step 2.2: Get Your API Keys

1. Go to **Developers** → **API keys**
2. Copy your keys:
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend)

### Step 2.3: Get Your Connect Client ID

1. Go to **Connect** → **Settings**
2. Scroll to **OAuth settings**
3. Copy your **Client ID**: `ca_...`
4. Add redirect URI: `https://your-frontend-domain.com/partner-dashboard`

### Step 2.4: Enable Required Capabilities

Under **Connect** → **Settings** → **Capabilities**, enable:
- ✅ Card payments
- ✅ Transfers

### Step 2.5: Configure Payout Settings

1. Go to **Connect** → **Settings** → **Payouts**
2. Set payout schedule: **Daily** (recommended)
3. Set payout delay: **2 days** (Stripe default)

---

## 3. Backend API Deployment

You need to deploy a Node.js/Express backend to handle Stripe Connect operations.

### Step 3.1: Create Backend Server

Create a new `server.js` file:

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import API modules
const stripeConnectApi = require('./api/stripe-connect-partners');
const stripeWebhook = require('./api/webhooks/stripe-connect-webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use('/webhooks/stripe-connect', express.raw({ type: 'application/json' })); // Raw body for webhook signature verification
app.use(bodyParser.json());

// Stripe Connect Partner API Routes
app.post('/api/partners/create-connect-account', stripeConnectApi.createConnectAccount);
app.post('/api/partners/onboarding-link', stripeConnectApi.getOnboardingLink);
app.get('/api/partners/account-status', stripeConnectApi.getAccountStatus);
app.post('/api/partners/create-booking-payment', stripeConnectApi.createPartnerBookingPayment);
app.post('/api/partners/accept-booking', stripeConnectApi.acceptBooking);
app.post('/api/partners/reject-booking', stripeConnectApi.rejectBooking);
app.post('/api/partners/capture-and-transfer', stripeConnectApi.captureAndTransferToPartner);
app.get('/api/partners/earnings', stripeConnectApi.getPartnerEarnings);

// Webhook endpoint
app.post('/webhooks/stripe-connect', stripeWebhook.handleStripeConnectWebhook);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

### Step 3.2: Install Dependencies

```bash
npm install express cors body-parser stripe @supabase/supabase-js dotenv
```

### Step 3.3: Deploy Options

**Option A: Vercel (Recommended)**
1. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/server.js" }]
}
```
2. Deploy: `vercel --prod`

**Option B: Heroku**
```bash
heroku create privatecharterx-api
git push heroku main
```

**Option C: Railway/Render**
- Connect your GitHub repo
- Set environment variables
- Deploy

### Step 3.4: Set Environment Variables on Backend

Add these to your deployment platform:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://your-frontend-domain.com
```

---

## 4. Webhook Configuration

### Step 4.1: Create Webhook Endpoint in Stripe

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://your-api-domain.com/webhooks/stripe-connect`
4. Select events to listen for:
   - `account.updated`
   - `account.application.deauthorized`
   - `transfer.created`
   - `transfer.updated`
   - `transfer.failed`
   - `payout.paid`
   - `payout.failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add it to your backend environment variables as `STRIPE_CONNECT_WEBHOOK_SECRET`

### Step 4.2: Test Webhook

Test using Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe-connect
stripe trigger account.updated
```

Check your backend logs to confirm webhook received.

---

## 5. Frontend Environment Variables

Update your frontend `.env` file:

```env
# Copy from .env.example
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 6. Supabase Storage Setup

### Step 6.1: Create Partner Logos Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `partner-logos`
4. **Public bucket**: ✅ Yes
5. File size limit: 2 MB
6. Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`
7. Click **Create bucket**

### Step 6.2: Set RLS Policies

Run this SQL in Supabase SQL Editor:

```sql
-- Allow authenticated partners to upload their own logos
CREATE POLICY "Partners can upload own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all logos
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'partner-logos');
```

---

## 7. Testing the Flow

### Test Flow 1: Partner Registration

1. Go to your frontend
2. Click "Become a Partner"
3. Fill out registration form
4. Submit → Check backend logs for Stripe Connect account creation
5. Check Supabase `users` table → `stripe_connect_account_id` should be populated
6. Partner receives email from Stripe to complete onboarding

### Test Flow 2: Partner Onboarding

1. Partner clicks Stripe onboarding link in email
2. Completes identity verification (use test data in test mode)
3. Webhook fires: `account.updated`
4. Check backend logs → Webhook received
5. Check Supabase `users` table → `stripe_verification_status` = 'verified'
6. Partner receives notification: "Account Verified!"

### Test Flow 3: Admin Approval

1. Log in as admin
2. Go to Admin Dashboard → Partner Verification
3. Find the pending partner
4. Click "Review"
5. Verify Stripe status shows "verified"
6. Click "Approve Partner"
7. Partner receives notification: "Partner Application Approved!"

### Test Flow 4: Customer Booking

1. Customer books a taxi service
2. Enters payment details
3. Payment Intent created with `capture_method: 'manual'` (escrow)
4. Check Stripe Dashboard → Payment is "Authorized" (not captured)
5. Check `partner_bookings` → `payment_status` = 'held_escrow'
6. Partner receives notification: "New Booking Request"

### Test Flow 5: Partner Accepts Booking

1. Partner logs in
2. Sees booking request with "Accept" and "Reject" buttons
3. Clicks "Accept"
4. Customer receives notification: "Booking Confirmed! Driver is on the way"
5. Check `partner_bookings` → `status` = 'confirmed'

### Test Flow 6: Payment Capture & Transfer

1. Partner arrives and clicks "Confirm Arrival"
2. Backend captures payment
3. Backend transfers to partner minus commission:
   - Example: €100 ride, 10% commission
   - Partner receives: €90
   - Platform keeps: €10
4. Check Stripe Dashboard → Transfer created to partner account
5. Partner receives notification: "Payment Received: €90.00. Commission: €10.00"
6. Customer receives notification: "Driver Confirmed Arrival"
7. Check `partner_earnings` table → New record created

### Test Flow 7: Daily Payout

1. Wait 24 hours (or trigger manually in Stripe Dashboard)
2. Stripe sends daily payout to partner's bank account
3. Webhook fires: `payout.paid`
4. Partner receives notification: "Payout Received: €90.00"
5. Check `partner_earnings` → `stripe_payout_id` populated

---

## 8. Production Deployment

### Step 8.1: Switch to Live Mode

1. Get your **live** API keys from Stripe:
   - `pk_live_...`
   - `sk_live_...`
2. Update environment variables in production
3. Recreate webhook endpoint with live mode URL
4. Get new webhook secret (`whsec_...` for live mode)

### Step 8.2: Complete Stripe Verification

Before going live, Stripe requires you to:
1. Complete business verification
2. Provide business details (company name, address, tax ID)
3. Verify bank account for platform payouts

Go to: **Settings** → **Business settings** → **Public details**

### Step 8.3: Security Checklist

- ✅ All API endpoints use authentication
- ✅ Webhook signature verification enabled
- ✅ Supabase RLS policies configured
- ✅ HTTPS enabled on all domains
- ✅ CORS configured properly
- ✅ Rate limiting implemented on API
- ✅ Environment variables secured (not in code)

---

## 9. Troubleshooting

### Issue: "Stripe Connect account not created"

**Solution:**
- Check backend logs for errors
- Verify `STRIPE_SECRET_KEY` is correct
- Ensure partner country is supported by Stripe (CH, US, DE, etc.)
- Check API endpoint is accessible

### Issue: "Webhook not receiving events"

**Solution:**
- Verify webhook URL is correct
- Check webhook is enabled in Stripe Dashboard
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/webhooks/stripe-connect`
- Ensure endpoint uses `express.raw()` for signature verification
- Check `STRIPE_CONNECT_WEBHOOK_SECRET` matches Stripe Dashboard

### Issue: "Partner can't receive payments"

**Solution:**
- Check `stripe_charges_enabled` = true in database
- Verify partner completed Stripe onboarding
- Check Stripe Dashboard → Connect → Accounts → View partner account
- Look for "Requirements" section - partner may need to provide more info

### Issue: "Transfer to partner failed"

**Solution:**
- Check partner's `stripe_payouts_enabled` = true
- Verify partner's bank account is connected in Stripe
- Check transfer amount is >= minimum (usually $1 / €1)
- Look at Stripe Dashboard → Transfers → View error details

### Issue: "Commission not calculated correctly"

**Solution:**
- Verify `service_type` field matches one of: taxi, luxury-car, adventure
- Check `calculate_partner_commission()` function works:
  ```sql
  SELECT * FROM calculate_partner_commission('taxi', 100.00);
  ```
- Ensure `partner_bookings.commission_rate` is set before transfer

### Issue: "Partner not seeing earnings"

**Solution:**
- Check `partner_earnings` table has records for that partner_id
- Verify `status` = 'paid' (not 'pending')
- Check PartnerDashboard component is querying correct partner_id
- Look at browser console for errors

---

## Support & Resources

- **Stripe Connect Docs**: https://stripe.com/docs/connect
- **Stripe Testing**: https://stripe.com/docs/testing
- **Test Cards**: 4242 4242 4242 4242 (any CVC, future expiry)
- **Webhook Testing**: https://stripe.com/docs/webhooks/test

---

## Stripe Dashboard Access

### For Partners (Embedded Dashboard)

Partners can manage their Stripe account details by clicking **"Manage Account"** button in their dashboard:
- Update IBAN/bank account details
- View payout history
- Download tax forms (1099, etc.)
- Update business information
- View transaction history
- Manage payment methods

**How it works:**
1. Partner clicks "Manage Account" in dashboard
2. Backend generates short-lived login link (valid for 5 minutes)
3. Partner redirected to Stripe Express Dashboard
4. Changes sync automatically

**API Endpoint:** `POST /api/partners/express-dashboard-link`

### For Admins (Stripe Dashboard Links)

Admins have direct access to Stripe Dashboard sections from the Partner Verification page:
- **Partners** - View all connected accounts, verification status
- **Transfers** - See all transfers to partners with commission breakdown
- **Payouts** - Monitor daily payouts to partner bank accounts
- **Disputes** - Handle chargebacks and disputes
- **All Payments** - View all customer payments

**Links automatically adjust for test/live mode.**

---

## Summary of Files Created/Modified

### New Files Created:
1. `supabase/migrations/add_stripe_connect_fields.sql` - Database schema
2. `api/stripe-connect-partners.js` - Backend API with Express Dashboard support
3. `api/webhooks/stripe-connect-webhook.js` - Webhook handler
4. `src/pages/admin/components/PartnerVerificationManagement.tsx` - Admin UI with Stripe links
5. `.env.example` - Environment variable template
6. `STRIPE_CONNECT_IMPLEMENTATION_GUIDE.md` - This guide

### Files Modified:
1. `src/components/PartnerRegistrationModal.tsx` - Added Stripe account creation
2. `src/components/PartnerDashboard.tsx` - Added accept/reject/confirm arrival + Stripe Dashboard button
3. `src/pages/admin/components/AdminDashboard.tsx` - Added Partner Verification nav

---

## Next Steps

1. ✅ Run database migrations
2. ✅ Set up Stripe Connect account
3. ✅ Deploy backend API
4. ✅ Configure webhooks
5. ✅ Create partner-logos storage bucket
6. ✅ Test full flow in test mode
7. ✅ Switch to live mode for production
8. ✅ Monitor first real partner registration

**You're ready to launch! 🚀**
