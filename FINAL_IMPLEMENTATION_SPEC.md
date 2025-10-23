# 🚀 Final Implementation Specification

## ✅ Confirmed Requirements

### 1. **Pricing Display**
- ❌ **NEVER show** "Platform Fee" or "Commission" to users
- ✅ **ONLY show** final price (base + commission calculated internally)
- ✅ Users see clean pricing without fee breakdown

### 2. **NFT Holder Benefits**
- ✅ **10% discount** on all bookings (applied automatically)
- ✅ **1 FREE service per NFT** (≤$1,500 USD value)
- ✅ **Visual indicator:** Green pulsing frame around eligible services
- ✅ **Badge:** "FREE with NFT" on eligible items
- ❌ **Don't mention** the $1,500 limit to users (just show badge)

### 3. **Event Tickets Integration**
- ✅ Fetch from **Ticketmaster API**
- ✅ Fetch from **Eventbrite API**
- ✅ Display in dashboard with other services
- ✅ Redirect to external site for booking
- ✅ Show in AI chat search results

### 4. **Google Calendar Integration**
- ✅ Save bookings to Google Calendar
- ✅ Sidebar calendar view (left side)
- ✅ Edit/adjust dates anytime
- ✅ Sync with user's Google account

### 5. **Stripe Subscription System**
- ✅ Implement all 5 tiers (Explorer, Starter, Professional, Elite, NFT)
- ✅ Monthly & annual billing
- ✅ Subscription management dashboard
- ✅ Webhook handling
- ✅ Commission calculation based on tier

---

## 📐 Pricing Logic (Backend Only)

### Internal Calculation (Never Shown to User):
```javascript
// Backend calculation
const basePrice = 50000; // Operator price
const userTier = getUserTier(userId);
const commissionRate = COMMISSION_RATES[userTier];
const hasNFT = userHasNFT(userId);

// Calculate commission
let commission = basePrice * commissionRate;

// Apply NFT discount (10% on final price)
if (hasNFT) {
  const totalBeforeDiscount = basePrice + commission;
  const discount = totalBeforeDiscount * 0.10;
  commission = commission - discount;
}

const finalPrice = basePrice + commission;

// What user sees:
return {
  displayPrice: finalPrice, // €57,000 (just one number)
  isNFTEligibleFree: hasNFT && finalPrice <= 1500,
  showNFTDiscount: hasNFT
};
```

### User Sees (Frontend):
```
Gulfstream G650
€57,000
[Book Now]

// If NFT holder:
💎 NFT Discount Applied

// If eligible for free:
🎁 FREE with NFT (green pulsing border)
```

---

## 🎨 Visual Design

### NFT-Eligible Service Card:
```css
/* Green pulsing border animation */
@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
}

.nft-eligible-free {
  border: 2px solid #22c55e;
  animation: pulse-green 2s infinite;
}
```

### Badge Display:
```jsx
{isNFTEligibleFree && (
  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
    🎁 FREE with NFT
  </div>
)}
```

---

## 🎫 Event Tickets Integration

### APIs to Integrate:
1. **Ticketmaster Discovery API**
   - Endpoint: `https://app.ticketmaster.com/discovery/v2/events`
   - Auth: API Key
   - Returns: Events, venues, prices, availability

2. **Eventbrite API**
   - Endpoint: `https://www.eventbriteapi.com/v3/events/search/`
   - Auth: OAuth token
   - Returns: Events, organizers, tickets, prices

### Event Card Display:
```jsx
<EventCard
  title="Formula 1 Monaco Grand Prix"
  date="May 25, 2026"
  venue="Circuit de Monaco"
  price="From €850"
  provider="Ticketmaster"
  externalUrl="https://ticketmaster.com/..."
  image="https://..."
/>
```

---

## 📅 Google Calendar Integration

### Calendar Features:
1. **OAuth Setup**
   - Google Calendar API
   - User authorization
   - Token storage

2. **Booking Actions**
   - "Add to Calendar" button on every booking
   - Auto-sync confirmed bookings
   - Edit dates directly from calendar
   - Delete/cancel events

3. **Sidebar Calendar**
   - Mini calendar view (left sidebar)
   - Show all upcoming bookings
   - Quick date adjustments
   - Color-coded by service type

---

## 💳 Stripe Integration

### Products to Create:
```javascript
const stripeProducts = [
  {
    name: "Starter Monthly",
    price: 79,
    currency: "EUR",
    interval: "month",
    metadata: { tier: "starter", commission_rate: 0.15 }
  },
  {
    name: "Starter Annual",
    price: 790,
    currency: "EUR",
    interval: "year",
    metadata: { tier: "starter", commission_rate: 0.15 }
  },
  // ... more products
];
```

### Webhook Events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## 📂 Files to Create/Modify

### New Files:
1. `src/services/nftBenefitsService.js` - NFT discount & free service logic
2. `src/services/eventsService.js` - Ticketmaster & Eventbrite API
3. `src/services/googleCalendarService.js` - Calendar integration
4. `src/services/stripeService.js` - Payment & subscription handling
5. `src/components/EventCard.jsx` - Event ticket display
6. `src/components/MembershipCard.jsx` - Sidebar subscription display
7. `src/components/ReferralCard.jsx` - Sidebar referral display
8. `src/components/CalendarSidebar.jsx` - Calendar widget
9. `database/subscription_schema.sql` - Database tables

### Modified Files:
1. `src/components/BookableServiceCard.jsx` - Add NFT visual indicators
2. `src/components/Landingpagenew/AIChat.jsx` - Hide fees, add events
3. `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx` - Sidebar integration
4. `src/components/Landingpagenew/Subscriptionplans.jsx` - Update with final pricing
5. `src/services/supabaseService.js` - Add event search

---

## 🔐 Environment Variables Needed

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Ticketmaster
VITE_TICKETMASTER_API_KEY=your_api_key
TICKETMASTER_API_SECRET=your_secret

# Eventbrite
VITE_EVENTBRITE_API_KEY=your_api_key
EVENTBRITE_OAUTH_TOKEN=your_token

# Google Calendar
VITE_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=https://yoursite.com/auth/google

# Existing
VITE_ANTHROPIC_API_KEY=your_claude_key
```

---

## 🚀 Implementation Order

### Phase 1: Core Pricing (Week 1)
1. ✅ Update pricing logic to hide fees
2. ✅ NFT discount calculation (10%)
3. ✅ Free service tracking (≤$1,500)
4. ✅ Visual indicators (pulsing border, badge)

### Phase 2: Stripe Integration (Week 1-2)
1. ✅ Create Stripe products
2. ✅ Subscription checkout flow
3. ✅ Webhook handlers
4. ✅ Subscription management UI
5. ✅ Membership card in sidebar

### Phase 3: Events Integration (Week 2)
1. ✅ Ticketmaster API integration
2. ✅ Eventbrite API integration
3. ✅ Event card component
4. ✅ Add to AI chat search
5. ✅ Display in dashboard

### Phase 4: Calendar Integration (Week 2-3)
1. ✅ Google Calendar OAuth
2. ✅ Calendar sidebar widget
3. ✅ Add/edit/delete events
4. ✅ Sync bookings automatically

### Phase 5: Referral System (Week 3)
1. ✅ Referral card in sidebar
2. ✅ Tracking system
3. ✅ Reward distribution

### Phase 6: Testing & Launch (Week 4)
1. ✅ End-to-end testing
2. ✅ Beta user testing
3. ✅ Bug fixes
4. ✅ Public launch

---

## 📊 Database Schema Updates

```sql
-- Subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  tier TEXT, -- 'starter', 'professional', 'elite'
  stripe_subscription_id TEXT,
  status TEXT, -- 'active', 'cancelled', 'expired'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false
);

-- NFT Benefits Tracking
CREATE TABLE nft_benefits_used (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  nft_token_id TEXT,
  service_id UUID,
  service_type TEXT,
  service_value DECIMAL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Events
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  booking_id UUID,
  google_event_id TEXT,
  event_title TEXT,
  event_date TIMESTAMPTZ,
  service_type TEXT
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  referrer_user_id UUID REFERENCES auth.users,
  referred_user_id UUID REFERENCES auth.users,
  referral_code TEXT UNIQUE,
  status TEXT, -- 'pending', 'successful'
  reward_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Success Metrics

### Track These:
- Subscription conversion rate (free → paid)
- NFT holder booking frequency
- Average booking value by tier
- Event ticket click-through rate
- Calendar usage rate
- Referral conversion rate

---

## 📝 Next Steps

Ready to implement! Shall I start with:

1. **Phase 1:** Pricing logic & NFT visuals?
2. **Phase 2:** Stripe integration?
3. **Phase 3:** Event tickets API?
4. **Phase 4:** Google Calendar?
5. **All at once?** (Full implementation)

Let me know and I'll start building! 🚀
