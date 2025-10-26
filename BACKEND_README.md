# PrivateCharterX Partner Marketplace API

Express.js backend API for Stripe Connect partner marketplace integration.

## Features

- 🔌 **Stripe Connect Integration** - Partner account creation and onboarding
- 💳 **Escrow Payments** - Uber-style payment flow with manual capture
- 💰 **Commission System** - Automatic calculation: Taxi (10%), Luxury Car (12%), Adventure (15%)
- 📊 **Partner Dashboard** - Embedded Stripe Express Dashboard access
- 🔔 **Webhooks** - Real-time Stripe event handling
- 🏦 **Daily Payouts** - Automatic transfers to partner bank accounts
- 🌍 **Multi-region** - Support for EU, Switzerland, USA, Asia

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Using the backend package.json
npm install --prefix . -D package-backend.json
```

Or manually:

```bash
npm install express cors body-parser stripe @supabase/supabase-js dotenv
npm install -D nodemon
```

### 2. Configure Environment Variables

Copy `.env.backend` to `.env` and fill in your credentials:

```bash
cp .env.backend .env
```

Required variables:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_CONNECT_CLIENT_ID` - From Stripe Connect settings
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `FRONTEND_URL` - Your frontend domain for CORS

### 3. Run Database Migrations

Before starting the API, run these SQL files in your Supabase SQL Editor:

1. `supabase/migrations/partner_system.sql`
2. `supabase/migrations/add_stripe_connect_fields.sql`

### 4. Start Development Server

```bash
npm run dev
# or
node server.js
```

Server will start on http://localhost:3000

### 5. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 5.123,
  "environment": "development",
  "stripeMode": "live"
}
```

## API Endpoints

### Partner Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/partners/create-connect-account` | Create Stripe Connect account for partner |
| POST | `/api/partners/onboarding-link` | Generate Stripe onboarding link |
| GET | `/api/partners/account-status` | Get partner account verification status |
| POST | `/api/partners/express-dashboard-link` | Generate login link for Stripe Express Dashboard |

### Booking & Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/partners/create-booking-payment` | Create payment intent with escrow |
| POST | `/api/partners/accept-booking` | Partner accepts booking |
| POST | `/api/partners/reject-booking` | Partner rejects booking |
| POST | `/api/partners/capture-and-transfer` | Capture payment and transfer to partner |

### Earnings & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/partners/earnings` | Get partner earnings history |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stripe-dashboard-links` | Get Stripe Dashboard URLs for admin |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/stripe-connect` | Stripe Connect webhook handler |

## Webhook Events Handled

- `account.updated` - Partner verification status changes
- `account.application.deauthorized` - Partner disconnects account
- `transfer.created` - Money transferred to partner
- `transfer.updated` - Transfer status updated
- `transfer.failed` - Transfer failed
- `payout.paid` - Partner received payout
- `payout.failed` - Payout failed

## Testing with Stripe CLI

### Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe-connect
```

### Trigger Test Events

```bash
# Test account verification
stripe trigger account.updated

# Test transfer
stripe trigger transfer.created

# Test payout
stripe trigger payout.paid
```

## Deployment

See [BACKEND_DEPLOYMENT_GUIDE.md](./BACKEND_DEPLOYMENT_GUIDE.md) for detailed deployment instructions for:

- ✅ **Vercel** (Recommended - Easiest)
- ✅ **Railway** (Simple with CLI)
- ✅ **Render** (Free tier available)
- ✅ **Heroku** (Traditional PaaS)

## Project Structure

```
.
├── server.js                              # Express server entry point
├── api/
│   ├── stripe-connect-partners.js         # Partner API handlers
│   └── webhooks/
│       └── stripe-connect-webhook.js      # Webhook event handlers
├── supabase/
│   └── migrations/
│       ├── partner_system.sql             # Partner tables schema
│       └── add_stripe_connect_fields.sql  # Stripe Connect fields
├── package-backend.json                   # Backend dependencies
├── vercel-api.json                        # Vercel deployment config
├── .env.backend                           # Environment variable template
├── BACKEND_README.md                      # This file
└── BACKEND_DEPLOYMENT_GUIDE.md           # Deployment instructions
```

## Security Best Practices

- ✅ **Webhook Signature Verification** - All webhooks verify Stripe signature
- ✅ **Row Level Security** - Supabase RLS policies enforce data access
- ✅ **Environment Variables** - No secrets in code
- ✅ **CORS Configuration** - Only allow requests from your frontend domain
- ✅ **HTTPS Only** - Enforced on all deployments
- ✅ **Service Role Key** - Never exposed to frontend

## Troubleshooting

### "Cannot find module 'express'"

Install dependencies:
```bash
npm install
```

### "Webhook signature verification failed"

1. Check `STRIPE_CONNECT_WEBHOOK_SECRET` in `.env`
2. Ensure it matches the webhook secret from Stripe Dashboard
3. Verify webhook endpoint uses raw body parser

### "Supabase connection failed"

1. Check `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Verify Supabase project is active (not paused)
3. Check database migrations have been run

### "CORS error"

1. Verify `FRONTEND_URL` matches your frontend domain exactly
2. Remove trailing slashes from URLs
3. Check CORS middleware is configured in server.js

## Commission Rates

| Service Type | Commission | Partner Receives |
|--------------|------------|------------------|
| Taxi | 10% | 90% |
| Luxury Car | 12% | 88% |
| Adventure | 15% | 85% |
| Auto/Limousine | 12% | 88% |
| Other | 10% | 90% (default) |

## Payout Schedule

- **Frequency**: Daily (automatic)
- **Delay**: 2 days (Stripe standard)
- **Method**: Bank transfer (ACH/SEPA/Wire)

## Support

For issues related to:
- **Stripe Connect**: https://stripe.com/docs/connect
- **Supabase**: https://supabase.com/docs
- **Partner Marketplace**: See STRIPE_CONNECT_IMPLEMENTATION_GUIDE.md

## License

MIT
