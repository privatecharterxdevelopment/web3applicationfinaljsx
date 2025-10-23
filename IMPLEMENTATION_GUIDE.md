# Complete Implementation Guide
## Subscription System, NFT Benefits, Event Tickets & Calendar Integration

---

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Database Setup](#database-setup)
3. [Stripe Configuration](#stripe-configuration)
4. [API Keys Setup](#api-keys-setup)
5. [Backend Endpoints](#backend-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## 🚀 Quick Start

### Prerequisites
- ✅ Supabase account with project created
- ✅ Stripe account (can be Test Mode initially)
- ✅ Ticketmaster API key
- ✅ Eventbrite API token
- ✅ Google Cloud Console project with Calendar API enabled

### Implementation Steps (4-6 hours)

1. **Database** (30 mins) - Run migration, verify tables
2. **Stripe Setup** (1-2 hours) - Products, webhooks, test checkout
3. **Environment Variables** (15 mins) - Add all API keys
4. **Backend Endpoints** (2-3 hours) - Netlify functions for Stripe
5. **Frontend Updates** (1 hour) - Integrate components, test flows
6. **Testing** (30 mins) - End-to-end validation

---

## 🗄️ Database Setup

### Step 1: Run Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy content from `database/subscription_system_migration.sql`
3. Execute the SQL script
4. Verify tables created:

```sql
-- Verification queries
SELECT COUNT(*) FROM user_subscriptions;
SELECT COUNT(*) FROM nft_benefits_used;
SELECT COUNT(*) FROM calendar_events;
SELECT COUNT(*) FROM referrals;

-- Test helper functions
SELECT get_user_subscription_tier(auth.uid());
SELECT get_user_commission_rate(auth.uid());
SELECT get_referral_stats(auth.uid());
```

### Step 2: Verify RLS Policies

```sql
-- Check policies are active
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('user_subscriptions', 'nft_benefits_used', 'calendar_events', 'referrals');
```

### Step 3: Fix Chat Requests (if not done)

Run `database/fix_tokenization_services_and_chat_requests.sql` to:
- Fix admin policy error
- Create chat_requests table
- Add RLS policies

---

## 💳 Stripe Configuration

### Step 1: Create Products

**Login to Stripe Dashboard** → Products → Create Product

#### Product 1: Starter Monthly
- **Name:** Sphera Starter (Monthly)
- **Description:** AI-powered booking with 15% commission
- **Price:** €79.00 / month
- **Recurring:** Yes, monthly
- **Metadata:**
  - `tier: starter`
  - `commission_rate: 0.15`
  - `features: AI booking, email support, standard response`

#### Product 2: Starter Annual
- **Name:** Sphera Starter (Annual)
- **Description:** AI-powered booking with 15% commission (17% savings)
- **Price:** €790.00 / year
- **Recurring:** Yes, yearly
- **Metadata:**
  - `tier: starter`
  - `commission_rate: 0.15`
  - `billing_cycle: annual`

#### Product 3: Professional Monthly
- **Name:** Sphera Professional (Monthly)
- **Description:** Priority support with 12% commission
- **Price:** €149.00 / month
- **Recurring:** Yes, monthly
- **Metadata:**
  - `tier: professional`
  - `commission_rate: 0.12`
  - `features: Priority support, dedicated manager, exclusive deals`

#### Product 4: Professional Annual
- **Name:** Sphera Professional (Annual)
- **Description:** Priority support with 12% commission (17% savings)
- **Price:** €1,490.00 / year
- **Recurring:** Yes, yearly
- **Metadata:**
  - `tier: professional`
  - `commission_rate: 0.12`
  - `billing_cycle: annual`

#### Product 5: Elite Monthly
- **Name:** Sphera Elite (Monthly)
- **Description:** VIP concierge with 10% commission
- **Price:** €299.00 / month
- **Recurring:** Yes, monthly
- **Metadata:**
  - `tier: elite`
  - `commission_rate: 0.10`
  - `features: 24/7 VIP support, concierge, custom planning, exclusive events`

#### Product 6: Elite Annual
- **Name:** Sphera Elite (Annual)
- **Description:** VIP concierge with 10% commission (17% savings)
- **Price:** €2,990.00 / year
- **Recurring:** Yes, yearly
- **Metadata:**
  - `tier: elite`
  - `commission_rate: 0.10`
  - `billing_cycle: annual`

### Step 2: Copy Price IDs

After creating each product, copy the **Price ID** (starts with `price_`):

```
STARTER_MONTHLY: price_xxxxxxxxxxxxx
STARTER_ANNUAL: price_xxxxxxxxxxxxx
PROFESSIONAL_MONTHLY: price_xxxxxxxxxxxxx
PROFESSIONAL_ANNUAL: price_xxxxxxxxxxxxx
ELITE_MONTHLY: price_xxxxxxxxxxxxx
ELITE_ANNUAL: price_xxxxxxxxxxxxx
```

### Step 3: Configure Webhooks

**Stripe Dashboard** → Developers → Webhooks → Add Endpoint

- **Endpoint URL:** `https://yourapp.netlify.app/.netlify/functions/stripe-webhook`
- **Events to listen to:**
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `checkout.session.completed`

**Save Webhook Signing Secret** (starts with `whsec_`)

---

## 🔑 API Keys Setup

### Step 1: Create `.env` File

Create `.env` in project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_ELITE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
VITE_STRIPE_ELITE_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx

# Ticketmaster
VITE_TICKETMASTER_API_KEY=your-ticketmaster-key

# Eventbrite
VITE_EVENTBRITE_TOKEN=your-eventbrite-token

# Google Calendar
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-google-api-key
GOOGLE_CLIENT_SECRET=your-client-secret

# API Base URL
VITE_API_BASE_URL=https://yourapp.netlify.app/api
```

### Step 2: Set Netlify Environment Variables

**Netlify Dashboard** → Site Settings → Environment Variables

Add all variables from `.env` (excluding `VITE_` prefix for server-side vars)

---

## 🔧 Backend Endpoints

Create these Netlify Functions:

### `netlify/functions/create-checkout-session.ts`

```typescript
import Stripe from 'stripe';
import { Handler } from '@netlify/functions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { priceId, customerId, successUrl, cancelUrl, metadata } = JSON.parse(event.body || '{}');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### `netlify/functions/create-customer.ts`

```typescript
import Stripe from 'stripe';
import { Handler } from '@netlify/functions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, metadata } = JSON.parse(event.body || '{}');

    const customer = await stripe.customers.create({
      email,
      metadata,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ customerId: customer.id }),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### `netlify/functions/create-portal-session.ts`

```typescript
import Stripe from 'stripe';
import { Handler } from '@netlify/functions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { customerId, returnUrl } = JSON.parse(event.body || '{}');

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### `netlify/functions/stripe-webhook.ts`

```typescript
import Stripe from 'stripe';
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig!,
      webhookSecret
    );

    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(stripeEvent.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object as Stripe.Invoice);
        break;
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (error: any) {
    return { statusCode: 400, body: `Webhook Error: ${error.message}` };
  }
};

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  
  await supabase.from('user_subscriptions').upsert({
    user_id: metadata.user_id,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    tier: metadata.tier,
    status: subscription.status,
    billing_cycle: metadata.billing_cycle || 'monthly',
    commission_rate: parseFloat(metadata.commission_rate || '0.15'),
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  // Add payment tracking logic here if needed
}
```

---

## 🎨 Frontend Integration

### Step 1: Update Dashboard Sidebar

Edit `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx`:

```jsx
import MembershipCard from '../MembershipCard';
import ReferralCard from '../ReferralCard';

// Add to sidebar bottom section (around line 1100)
<div className="mt-auto space-y-4 p-4">
  {/* Membership Card */}
  <MembershipCard compact />
  
  {/* Referral Card */}
  <ReferralCard compact />
  
  {/* Existing user profile section */}
  {/* ... */}
</div>
```

### Step 2: Update AIChat to Include Events

Edit `src/components/Landingpagenew/AIChat.jsx`:

```jsx
import eventsService from '../../services/eventsService';
import EventCard from '../EventCard';

// In handleSearch function, add event search
const events = await eventsService.searchEvents({
  keyword: userMessage,
  city: extractedParams.destination,
  startDate: extractedParams.departure_date
});

// Add events to results display
{events.length > 0 && (
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-white">📅 Upcoming Events</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.slice(0, 4).map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  </div>
)}
```

### Step 3: Add Calendar Integration to Chat Requests

Edit `src/components/ChatRequestsView.jsx`:

```jsx
import calendarService from '../services/calendarService';

// Add "Add to Calendar" button
<button
  onClick={() => handleAddToCalendar(request)}
  className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300"
>
  <Calendar className="w-4 h-4" />
  <span>Add to Calendar</span>
</button>

// Handler function
const handleAddToCalendar = async (request) => {
  if (!calendarService.isConnected()) {
    const connected = await calendarService.signInToGoogle();
    if (!connected) {
      alert('Failed to connect to Google Calendar');
      return;
    }
  }
  
  const result = await calendarService.quickAddFromChatRequest(request);
  if (result.success) {
    alert('✅ Added to your Google Calendar!');
  } else {
    alert(`❌ Failed to add: ${result.error}`);
  }
};
```

---

## ✅ Testing

### Database Tests

```sql
-- Test subscription creation
INSERT INTO user_subscriptions (user_id, tier, status, commission_rate)
VALUES (auth.uid(), 'professional', 'active', 0.12);

-- Test NFT benefit tracking
INSERT INTO nft_benefits_used (user_id, wallet_address, nft_token_id, service_type, service_name, service_value)
VALUES (auth.uid(), '0x123...', 'NFT-001', 'jet', 'Paris to Monaco', 1200.00);

-- Verify functions
SELECT get_user_subscription_tier(auth.uid());
SELECT get_user_commission_rate(auth.uid());
```

### Stripe Tests (Test Mode)

1. Use test card: `4242 4242 4242 4242`
2. Create checkout session for Starter Monthly
3. Complete payment
4. Verify subscription appears in Supabase
5. Test webhook delivery in Stripe Dashboard

### API Tests

```javascript
// Test Ticketmaster
const events = await eventsService.searchTicketmaster({ keyword: 'concert', city: 'London' });
console.log('Ticketmaster events:', events);

// Test Eventbrite
const events2 = await eventsService.searchEventbrite({ keyword: 'tech', city: 'San Francisco' });
console.log('Eventbrite events:', events2);

// Test NFT benefits
const pricing = nftBenefitsService.calculatePrice(5000, 'professional', true);
console.log('Pricing with NFT:', pricing);
```

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Database migration executed successfully
- [ ] All Stripe products created
- [ ] Webhook endpoint configured
- [ ] Environment variables set in Netlify
- [ ] Backend functions deployed
- [ ] Frontend components integrated
- [ ] Test Mode validation passed

### Go Live Steps

1. **Switch Stripe to Live Mode**
   - Create same products in Live Mode
   - Update price IDs in environment variables
   - Configure live webhook endpoint
   - Update API keys to live keys

2. **Update Environment Variables**
   ```bash
   # Netlify CLI
   netlify env:set STRIPE_SECRET_KEY sk_live_xxxxx
   netlify env:set VITE_STRIPE_PUBLIC_KEY pk_live_xxxxx
   ```

3. **Deploy**
   ```bash
   git add .
   git commit -m "feat: subscription system with NFT benefits"
   git push origin main
   ```

4. **Verify Production**
   - Test real subscription creation
   - Verify webhook delivery
   - Check database entries
   - Test NFT discount calculation

---

## 📊 Monitoring

### Key Metrics to Track

- MRR (Monthly Recurring Revenue)
- Subscription tier distribution
- NFT benefits usage rate
- Commission revenue per tier
- Referral conversion rate
- Calendar integration adoption

### Supabase Queries

```sql
-- MRR by tier
SELECT tier, COUNT(*) as subscribers, SUM(price_eur) as monthly_revenue
FROM user_subscriptions
WHERE status = 'active' AND billing_cycle = 'monthly'
GROUP BY tier;

-- NFT benefits used
SELECT service_type, COUNT(*) as redemptions, AVG(service_value) as avg_value
FROM nft_benefits_used
GROUP BY service_type;

-- Referral stats
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') as successful_referrals,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_referrals,
  AVG(reward_value) as avg_reward
FROM referrals;
```

---

## 🆘 Troubleshooting

### Issue: Webhook not receiving events
**Solution:** Verify endpoint URL, check webhook signing secret, ensure HTTPS

### Issue: Subscription not syncing to database
**Solution:** Check webhook handler logs, verify Supabase service role key

### Issue: NFT discount not applying
**Solution:** Verify wallet connection, check NFT contract address, test web3Service

### Issue: Calendar events not creating
**Solution:** Check Google API credentials, verify OAuth consent screen, test token refresh

---

## 📞 Support

For implementation assistance:
- Check error logs in Netlify Functions
- Review Stripe webhook logs
- Query Supabase logs in Dashboard
- Test in isolation: database → backend → frontend

---

**Ready to implement? Start with Database Setup! 🚀**
