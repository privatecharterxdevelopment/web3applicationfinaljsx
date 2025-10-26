# Backend API Deployment Guide

This guide covers deploying the Stripe Connect Partner Marketplace API server.

## Prerequisites

Before deploying, ensure you have:

1. ✅ Stripe account with Connect enabled
2. ✅ Stripe API keys (live mode):
   - Publishable key: `pk_live_...` (get from Stripe Dashboard)
   - Secret key: `sk_live_...` (get from Stripe Dashboard)
3. ✅ Stripe Connect Client ID (get from Dashboard → Connect → Settings)
4. ✅ Supabase project with database migrations completed
5. ✅ Supabase service role key

---

## Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel provides free serverless deployments with automatic HTTPS.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# From the project root directory
vercel --prod -c vercel-api.json
```

### Step 4: Set Environment Variables

After deployment, set environment variables in Vercel Dashboard:

```bash
# Or set via CLI
vercel env add STRIPE_SECRET_KEY
# Paste: sk_live_YOUR_STRIPE_SECRET_KEY_HERE

vercel env add STRIPE_CONNECT_CLIENT_ID
# Paste: ca_... (get from Stripe Dashboard)

vercel env add STRIPE_CONNECT_WEBHOOK_SECRET
# Paste: whsec_... (create webhook first)

vercel env add VITE_SUPABASE_URL
# Paste: https://your-project.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add FRONTEND_URL
# Paste: https://your-frontend-domain.com
```

### Step 5: Redeploy with Environment Variables

```bash
vercel --prod -c vercel-api.json
```

### Step 6: Get Your API URL

After deployment, Vercel will provide a URL like:
```
https://privatecharterx-api.vercel.app
```

Copy this URL - you'll need it for:
1. Frontend `.env` file (`VITE_API_BASE_URL`)
2. Stripe webhook endpoint configuration

---

## Option 2: Deploy to Railway

Railway provides simple deployments with automatic HTTPS and database support.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login and Initialize

```bash
railway login
railway init
```

### Step 3: Deploy

```bash
railway up
```

### Step 4: Set Environment Variables

```bash
railway variables set STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
railway variables set STRIPE_CONNECT_CLIENT_ID=ca_...
railway variables set STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
railway variables set VITE_SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
railway variables set FRONTEND_URL=https://your-frontend-domain.com
railway variables set PORT=3000
```

### Step 5: Get Your API URL

```bash
railway domain
```

This will show your API URL like:
```
https://privatecharterx-api.up.railway.app
```

---

## Option 3: Deploy to Render

Render provides free deployments with automatic HTTPS.

### Step 1: Create Account

Go to [render.com](https://render.com) and sign up.

### Step 2: Create New Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `privatecharterx-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### Step 3: Set Environment Variables

In Render Dashboard, add environment variables:

```
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://your-frontend-domain.com
PORT=3000
```

### Step 4: Deploy

Click **Create Web Service** - Render will automatically deploy.

Your API URL will be:
```
https://privatecharterx-api.onrender.com
```

---

## Option 4: Deploy to Heroku

### Step 1: Install Heroku CLI

```bash
npm install -g heroku
```

### Step 2: Login and Create App

```bash
heroku login
heroku create privatecharterx-api
```

### Step 3: Set Environment Variables

```bash
heroku config:set STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
heroku config:set STRIPE_CONNECT_CLIENT_ID=ca_...
heroku config:set STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
heroku config:set VITE_SUPABASE_URL=https://your-project.supabase.co
heroku config:set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
heroku config:set FRONTEND_URL=https://your-frontend-domain.com
```

### Step 4: Create Procfile

```bash
echo "web: node server.js" > Procfile
```

### Step 5: Deploy

```bash
git add .
git commit -m "Add backend server"
git push heroku main
```

Your API URL will be:
```
https://privatecharterx-api.herokuapp.com
```

---

## Post-Deployment Steps

After deploying to any platform:

### 1. Test Health Endpoint

```bash
curl https://your-api-url.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "stripeMode": "live"
}
```

### 2. Update Frontend Environment Variables

Edit your frontend `.env` file:

```env
VITE_API_BASE_URL=https://your-api-url.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
```

Redeploy your frontend after updating.

### 3. Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set **Endpoint URL**: `https://your-api-url.com/webhooks/stripe-connect`
4. Select events:
   - `account.updated`
   - `account.application.deauthorized`
   - `transfer.created`
   - `transfer.updated`
   - `transfer.failed`
   - `payout.paid`
   - `payout.failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add to your backend environment variables:
   ```bash
   # Example for Vercel
   vercel env add STRIPE_CONNECT_WEBHOOK_SECRET
   # Paste: whsec_...

   # Then redeploy
   vercel --prod -c vercel-api.json
   ```

### 4. Test Webhook

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your deployed API
stripe listen --forward-to https://your-api-url.com/webhooks/stripe-connect

# In another terminal, trigger test event
stripe trigger account.updated
```

Check your backend logs to confirm webhook received.

### 5. Get Stripe Connect Client ID

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Connect** → **Settings**
2. Scroll to **OAuth settings**
3. Copy **Client ID** (starts with `ca_...`)
4. Add redirect URI: `https://your-frontend-domain.com/partner-dashboard`
5. Update backend environment variable:
   ```bash
   vercel env add STRIPE_CONNECT_CLIENT_ID
   # Paste: ca_...
   ```

---

## Testing the Deployed API

### Test Partner Account Creation

```bash
curl -X POST https://your-api-url.com/api/partners/create-connect-account \
  -H "Content-Type: application/json" \
  -d '{
    "partnerId": "test-user-id-123",
    "email": "partner@example.com",
    "country": "US"
  }'
```

### Test Dashboard Link Generation

```bash
curl -X POST https://your-api-url.com/api/partners/express-dashboard-link \
  -H "Content-Type: application/json" \
  -d '{
    "partnerId": "test-user-id-123"
  }'
```

### Test Admin Dashboard Links

```bash
curl https://your-api-url.com/api/admin/stripe-dashboard-links
```

---

## Monitoring and Logs

### Vercel
```bash
vercel logs
```

### Railway
```bash
railway logs
```

### Render
- Go to Dashboard → Your Service → Logs

### Heroku
```bash
heroku logs --tail
```

---

## Security Checklist

Before going live:

- ✅ All environment variables use live Stripe keys (not test)
- ✅ Webhook signature verification enabled
- ✅ CORS configured to only allow your frontend domain
- ✅ HTTPS enabled (automatic on all platforms)
- ✅ Supabase RLS policies configured
- ✅ Service role key kept secret (never exposed to frontend)
- ✅ Rate limiting implemented (optional but recommended)

---

## Troubleshooting

### "Stripe API key is invalid"
- Verify you're using the correct key format: `sk_live_...` or `sk_test_...`
- Check for extra spaces or line breaks when pasting

### "Webhook signature verification failed"
- Ensure `STRIPE_CONNECT_WEBHOOK_SECRET` matches Stripe Dashboard
- Verify webhook endpoint uses `express.raw({ type: 'application/json' })`

### "CORS error from frontend"
- Check `FRONTEND_URL` environment variable matches your frontend domain exactly
- Ensure no trailing slash in `FRONTEND_URL`

### "Cannot connect to Supabase"
- Verify `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is not paused

---

## Next Steps

1. ✅ Deploy backend API
2. ✅ Configure Stripe webhook
3. ✅ Update frontend environment variables
4. ✅ Test partner registration flow
5. ✅ Test booking and payment flow
6. ✅ Monitor first real transactions

**You're ready to go live! 🚀**
