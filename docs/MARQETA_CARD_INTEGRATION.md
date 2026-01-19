# Marqeta Card Integration Guide

## Overview

This document describes the PrivateCharterX Card integration with Marqeta for issuing Mastercard/Visa cards to users.

## Files Created

### 1. Frontend Component
- **`/src/components/Landingpagenew/MarqetaCardDashboard.jsx`**
  - Full card management dashboard
  - Features: Card display, freeze/unfreeze, top-up, transactions, spending chart, settings

### 2. Database Migration
- **`/database/marqeta_cards_migration.sql`**
  - Tables: `user_cards`, `card_transactions`, `card_topups`, `card_subscriptions`, `card_spending_limits`
  - Includes RLS policies, triggers, and views

### 3. Edge Functions
- **`/supabase/functions/marqeta-create-card/index.ts`** - Create new card
- **`/supabase/functions/marqeta-card-status/index.ts`** - Freeze/unfreeze/terminate
- **`/supabase/functions/marqeta-topup/index.ts`** - Fund card (bank/crypto/card)
- **`/supabase/functions/marqeta-get-balance/index.ts`** - Get card balance & details
- **`/supabase/functions/marqeta-webhook/index.ts`** - Process Marqeta webhooks

---

## Sidebar Integration

To add the Card section to the dashboard sidebar, make the following changes in **`tokenized-assets-glassmorphic.jsx`**:

### Step 1: Add to `categoryToUrl` mapping (around line 1218)
```javascript
'card': '/dashboard/card',
```

### Step 2: Add to `serviceRoutes` mapping (around line 2268)
```javascript
'/dashboard/card': 'card',
```

### Step 3: Add to sidebar menu `rwsCategoryMenu` (around line 4342)
```javascript
{ id: 'card', label: 'Card', icon: CreditCard, category: 'card' },
```

### Step 4: Import the component (at top of file)
```javascript
import MarqetaCardDashboard from './MarqetaCardDashboard';
```

### Step 5: Add the section render (around line 10600, with other sections)
```jsx
{/* CARD DASHBOARD */}
{!isTransitioning && activeCategory === 'card' && (
  <MarqetaCardDashboard setActiveCategory={setActiveCategory} />
)}
```

### Step 6: Import CreditCard icon (add to existing lucide imports)
```javascript
import { ..., CreditCard } from 'lucide-react';
```

---

## Environment Variables Required

Add these to your Supabase Edge Functions secrets:

```bash
# Marqeta API Credentials (Sandbox)
MARQETA_BASE_URL=https://sandbox-api.marqeta.com/v3
MARQETA_APP_TOKEN=your_app_token
MARQETA_ADMIN_TOKEN=your_admin_token
MARQETA_CARD_PRODUCT_TOKEN=your_card_product_token
MARQETA_FUNDING_SOURCE_TOKEN=your_funding_source_token
MARQETA_WEBHOOK_SECRET=your_webhook_secret
```

---

## Marqeta Setup Steps

### 1. Create Marqeta Sandbox Account
- Go to https://www.marqeta.com/
- Apply for sandbox access

### 2. Configure Card Product
- Create a card product in Marqeta dashboard
- Configure: BIN, card network (Mastercard), card type, etc.

### 3. Set Up Funding Source
- Configure your program funding source
- This is where card balances are funded from

### 4. Configure Webhooks
- In Marqeta dashboard, set webhook URL to:
  `https://YOUR_SUPABASE_URL/functions/v1/marqeta-webhook`
- Select events: transactions, card state changes, etc.

### 5. Apple Wallet Setup (Optional)
- Apply for Apple Pay In-App Provisioning
- Integrate Marqeta's Push Provisioning SDK

---

## Database Setup

Run the migration:
```bash
supabase db push
# or
psql -f database/marqeta_cards_migration.sql
```

---

## Features Included

| Feature | Status |
|---------|--------|
| Virtual card issuance | ✅ Ready |
| Physical card ordering | ✅ Ready |
| Card freeze/unfreeze | ✅ Ready |
| Top-up via Bank | ✅ Ready |
| Top-up via Crypto | ✅ Ready (needs payment processor) |
| Top-up via Debit Card | ✅ Ready |
| Transaction history | ✅ Ready |
| Spending chart | ✅ Ready |
| Spending limits | ✅ Ready |
| Apple Wallet | 🔄 Needs SDK integration |
| PIN management | ✅ Ready |
| Settings (international, contactless) | ✅ Ready |

---

## Subscription Model

- **Price**: $299/year
- **Includes**:
  - Virtual card (instant)
  - Physical metal card (free shipping)
  - No FX fees
  - Crypto top-up
  - Apple/Google Pay
  - $50,000/month spending limit

---

## Testing

### Sandbox Test Cards
Marqeta provides test card numbers and scenarios:
- Use test merchant simulators
- Test authorization, clearing, refunds
- Test decline scenarios

### Test Webhooks
Use Marqeta's webhook testing tool or ngrok for local development.

---

## Security Notes

1. Never expose full card numbers in frontend
2. Use `showpan` endpoint only when user explicitly requests
3. Implement rate limiting on sensitive endpoints
4. Verify webhook signatures
5. Use RLS policies for data access control

---

## Next Steps

1. Run database migration
2. Configure Marqeta sandbox credentials
3. Add sidebar integration (see above)
4. Test card creation flow
5. Integrate crypto payment processor for top-ups
6. Apply for Apple Pay provisioning (optional)
