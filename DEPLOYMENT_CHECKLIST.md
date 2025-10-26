# Stripe Connect Partner Marketplace - Deployment Checklist

Quick checklist to deploy the PrivateCharterX Partner Marketplace to production.

---

## ✅ Phase 1: Database Setup (5 minutes)

### 1.1 Run SQL Migrations

Open Supabase SQL Editor and run in order:

- [ ] Run `supabase/migrations/partner_system.sql`
- [ ] Run `supabase/migrations/add_stripe_connect_fields.sql`

### 1.2 Verify Tables Created

Check these tables exist in Supabase:

- [ ] `users` (with Stripe Connect columns)
- [ ] `partner_details`
- [ ] `partner_services`
- [ ] `partner_bookings` (with commission columns)
- [ ] `partner_notifications`
- [ ] `partner_payouts`
- [ ] `partner_earnings` ✨ NEW
- [ ] `partner_stripe_accounts` ✨ NEW

### 1.3 Test Commission Function

Run in SQL Editor:
```sql
SELECT * FROM calculate_partner_commission('taxi', 100.00);
-- Should return: rate=0.10, commission=10.00, earnings=90.00
```

- [ ] Function returns correct values

### 1.4 Create Storage Bucket

1. Go to Supabase → **Storage**
2. Click **New bucket**
3. Name: `partner-logos`
4. Public: ✅ Yes
5. File size limit: 2 MB
6. Allowed types: `image/jpeg, image/png, image/webp`

- [ ] Bucket created

### 1.5 Set Storage RLS Policies

Run in SQL Editor:
```sql
CREATE POLICY "Partners can upload own logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'partner-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'partner-logos');
```

- [ ] RLS policies created

---

## ✅ Phase 2: Stripe Configuration (10 minutes)

### 2.1 Enable Stripe Connect

- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Connect** → **Settings**
- [ ] Click **Get Started** (if not enabled)
- [ ] Choose **Express** account type
- [ ] Complete onboarding questionnaire

### 2.2 Get Stripe Connect Client ID

- [ ] Go to **Connect** → **Settings** → **OAuth settings**
- [ ] Copy **Client ID**: `ca_...`
- [ ] Add redirect URI: `https://your-frontend-domain.com/partner-dashboard`
- [ ] Save Client ID (needed for backend deployment)

### 2.3 Verify API Keys

You already have:
- [x] Publishable key: `pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE`
- [x] Secret key: `sk_live_YOUR_STRIPE_SECRET_KEY_HERE`

### 2.4 Enable Required Capabilities

- [ ] Go to **Connect** → **Settings** → **Capabilities**
- [ ] Enable: Card payments ✅
- [ ] Enable: Transfers ✅

### 2.5 Configure Payout Settings

- [ ] Go to **Connect** → **Settings** → **Payouts**
- [ ] Set payout schedule: **Daily**
- [ ] Set payout delay: **2 days**

---

## ✅ Phase 3: Backend API Deployment (15-30 minutes)

### 3.1 Choose Deployment Platform

Pick one:
- [ ] **Vercel** (Recommended - easiest, free)
- [ ] **Railway** (Simple CLI, free tier)
- [ ] **Render** (Free tier, good for beginners)
- [ ] **Heroku** (Traditional PaaS, paid)

### 3.2 Deploy Backend

Follow [BACKEND_DEPLOYMENT_GUIDE.md](./BACKEND_DEPLOYMENT_GUIDE.md) for your chosen platform.

**Quick Vercel deployment:**
```bash
npm install -g vercel
vercel login
vercel --prod -c vercel-api.json
```

- [ ] Backend deployed successfully
- [ ] Copy API URL: `https://_________________.vercel.app`

### 3.3 Set Backend Environment Variables

On your deployment platform, set:

- [ ] `STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE`
- [ ] `STRIPE_CONNECT_CLIENT_ID=ca_...` (from step 2.2)
- [ ] `STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...` (will get in Phase 4)
- [ ] `VITE_SUPABASE_URL=https://your-project.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] `FRONTEND_URL=https://your-frontend-domain.com`
- [ ] `PORT=3000`

### 3.4 Test Health Endpoint

```bash
curl https://your-api-url.com/health
```

- [ ] Returns: `{"status": "ok", "stripeMode": "live"}`

---

## ✅ Phase 4: Stripe Webhook Configuration (5 minutes)

### 4.1 Create Webhook Endpoint

- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
- [ ] Click **Add endpoint**
- [ ] Endpoint URL: `https://your-api-url.com/webhooks/stripe-connect`
- [ ] Description: `Partner Marketplace Webhooks`

### 4.2 Select Events

Subscribe to these 7 events:

- [ ] `account.updated`
- [ ] `account.application.deauthorized`
- [ ] `transfer.created`
- [ ] `transfer.updated`
- [ ] `transfer.failed`
- [ ] `payout.paid`
- [ ] `payout.failed`

### 4.3 Get Webhook Secret

- [ ] Click **Add endpoint**
- [ ] Copy **Signing secret**: `whsec_...`
- [ ] Add to backend environment variables as `STRIPE_CONNECT_WEBHOOK_SECRET`
- [ ] Redeploy backend (if needed)

### 4.4 Test Webhook

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Test webhook
stripe listen --forward-to https://your-api-url.com/webhooks/stripe-connect
stripe trigger account.updated
```

- [ ] Webhook receives events successfully

---

## ✅ Phase 5: Frontend Configuration (5 minutes)

### 5.1 Update Frontend .env

Edit `.env` in your frontend project:

```env
VITE_API_BASE_URL=https://your-api-url.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] Environment variables updated

### 5.2 Redeploy Frontend

```bash
npm run build
# Deploy to your hosting (Vercel, Netlify, etc.)
```

- [ ] Frontend redeployed with new environment variables

---

## ✅ Phase 6: Testing (20 minutes)

### Test 1: Partner Registration

- [ ] Go to frontend → "Become a Partner"
- [ ] Fill out registration form
- [ ] Submit → Check backend logs
- [ ] Verify `stripe_connect_account_id` in Supabase `users` table
- [ ] Partner receives Stripe onboarding email

### Test 2: Partner Onboarding

- [ ] Partner clicks Stripe email link
- [ ] Completes identity verification
- [ ] Webhook fires: `account.updated`
- [ ] Check Supabase → `stripe_verification_status` = 'verified'
- [ ] Partner receives "Account Verified!" notification

### Test 3: Admin Approval

- [ ] Log in as admin
- [ ] Admin Dashboard → Partner Verification
- [ ] Find pending partner
- [ ] Click "Approve Partner"
- [ ] Partner receives "Application Approved!" notification

### Test 4: Partner Dashboard Access

- [ ] Partner logs in
- [ ] Clicks **"Manage Account"** button
- [ ] Stripe Express Dashboard opens in new tab
- [ ] Can update bank account details

### Test 5: Admin Stripe Dashboard

- [ ] Admin clicks Stripe Dashboard links
- [ ] "Partners" link opens Stripe Connect accounts
- [ ] "Transfers" link shows transfers
- [ ] "Payouts" link shows payouts
- [ ] "All Payments" link shows customer payments

### Test 6: Customer Booking

- [ ] Customer books a taxi service
- [ ] Enters payment details (use test card: 4242 4242 4242 4242)
- [ ] Check Stripe Dashboard → Payment is "Authorized" (not captured)
- [ ] Check `partner_bookings` → `payment_status` = 'held_escrow'
- [ ] Partner receives "New Booking Request" notification

### Test 7: Payment Capture & Transfer

- [ ] Partner accepts booking
- [ ] Partner clicks "Confirm Arrival"
- [ ] Backend captures €100 payment
- [ ] Backend transfers €90 to partner (10% commission)
- [ ] Platform keeps €10
- [ ] Check Stripe Dashboard → Transfer created
- [ ] Partner receives "Payment Received: €90.00. Commission: €10.00" notification
- [ ] Check `partner_earnings` table → New record with correct amounts

---

## ✅ Phase 7: Production Readiness (10 minutes)

### Security Checklist

- [ ] All API endpoints use authentication
- [ ] Webhook signature verification enabled
- [ ] Supabase RLS policies configured
- [ ] HTTPS enabled on all domains
- [ ] CORS configured properly (only allow your frontend domain)
- [ ] Environment variables secured (not in code)
- [ ] Service role key never exposed to frontend

### Stripe Business Verification

Before accepting real payments:

- [ ] Complete Stripe business verification
- [ ] Provide business details (name, address, tax ID)
- [ ] Verify bank account for platform payouts
- [ ] Go to **Settings** → **Business settings** → **Public details**

### Monitoring Setup

- [ ] Set up error logging (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up Stripe email alerts for failed payouts
- [ ] Create admin dashboard for monitoring partners

---

## 📊 Deployment Summary

Once all checkboxes are complete:

| Component | Status | URL |
|-----------|--------|-----|
| Database | ✅ | `https://your-project.supabase.co` |
| Backend API | ✅ | `https://_________________.vercel.app` |
| Frontend | ✅ | `https://your-frontend-domain.com` |
| Stripe Webhook | ✅ | `https://your-api-url.com/webhooks/stripe-connect` |
| Stripe Dashboard | ✅ | `https://dashboard.stripe.com` |

---

## 🚀 Next Steps After Deployment

1. Monitor first partner registration
2. Test full booking flow with real partner
3. Verify daily payouts work correctly
4. Monitor webhook events in Stripe Dashboard
5. Set up customer support for partners
6. Create partner onboarding documentation
7. Set up marketing for partner recruitment

---

## 🆘 Troubleshooting

If something doesn't work:

1. Check backend logs for errors
2. Verify all environment variables are set correctly
3. Test webhook with Stripe CLI
4. Check Supabase RLS policies
5. Verify Stripe Connect is enabled
6. Check browser console for CORS errors
7. See [STRIPE_CONNECT_IMPLEMENTATION_GUIDE.md](./STRIPE_CONNECT_IMPLEMENTATION_GUIDE.md) → Section 9: Troubleshooting

---

## 📚 Documentation References

- [STRIPE_CONNECT_IMPLEMENTATION_GUIDE.md](./STRIPE_CONNECT_IMPLEMENTATION_GUIDE.md) - Complete implementation guide
- [BACKEND_DEPLOYMENT_GUIDE.md](./BACKEND_DEPLOYMENT_GUIDE.md) - Backend deployment instructions
- [BACKEND_README.md](./BACKEND_README.md) - Backend API documentation
- [.env.example](./.env.example) - Frontend environment variables
- [.env.backend](./.env.backend) - Backend environment variables

---

**Estimated Total Time: 1-2 hours**

**You've got this! 🚀**
