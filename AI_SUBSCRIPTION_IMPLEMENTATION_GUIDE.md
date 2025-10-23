# 🤖 AI Chat Subscription System - Implementation Guide

## 📋 Overview

Complete subscription system for AI chat with Claude 3.5 Sonnet + Voice support.

**NO COMMISSIONS** - Pure subscription model for AI access only.

---

## 💰 Pricing Packages

| Plan | Price/Month | Chats/Month | Cost per Chat | Features |
|------|-------------|-------------|---------------|----------|
| **Explorer** | FREE | 2 (lifetime) | $0 | Text only, try Sphera AI |
| **Starter** | $29 | 10 | $2.90 | Voice + Text, email support |
| **Pro** | $79 | 30 | $2.63 | Priority support, analytics |
| **Business** | $199 | 100 | $1.99 | Dedicated concierge, team access |
| **Elite** | $499 | Unlimited | $0 | VIP treatment, instant support |

### Top-Up Packages (One-time purchases):

| Package | Price | Chats | Price per Chat | Savings |
|---------|-------|-------|----------------|---------|
| 5 Chats | $15 | 5 | $3.00 | - |
| 10 Chats | $25 | 10 | $2.50 | 17% OFF |
| 25 Chats | $50 | 25 | $2.00 | 33% OFF |
| 50 Chats | $85 | 50 | $1.70 | 43% OFF |

**Top-up benefits:**
- Never expire
- Stack with subscription
- Instant activation

---

## 🗄️ Database Setup

### 1. Run the Migration

```bash
psql "your_supabase_connection_string" -f database/ai_subscription_migration.sql
```

This creates:
- `user_profiles` - User subscription tracking
- `chat_usage` - Individual chat session records
- `chat_topups` - Top-up purchase history
- `subscription_tiers` - Available plans (pre-populated)

### 2. Tables Created

#### `user_profiles`
```sql
{
  id: UUID,
  user_id: UUID (FK to auth.users),
  email: TEXT,
  subscription_tier: TEXT (explorer|starter|pro|business|elite),
  subscription_status: TEXT (active|past_due|canceled|trialing|incomplete),
  stripe_customer_id: TEXT,
  stripe_subscription_id: TEXT,
  chats_limit: INTEGER (NULL = unlimited),
  chats_used: INTEGER,
  chats_reset_date: TIMESTAMP,
  current_period_start: TIMESTAMP,
  current_period_end: TIMESTAMP,
  cancel_at_period_end: BOOLEAN
}
```

#### `chat_usage`
```sql
{
  id: UUID,
  user_id: UUID,
  chat_session_id: TEXT,
  message_count: INTEGER (max 25),
  started_at: TIMESTAMP,
  last_message_at: TIMESTAMP,
  completed: BOOLEAN
}
```

#### `chat_topups`
```sql
{
  id: UUID,
  user_id: UUID,
  package_type: TEXT (5_chats|10_chats|25_chats|50_chats),
  chats_added: INTEGER,
  price_usd: DECIMAL,
  stripe_payment_intent_id: TEXT,
  status: TEXT (pending|completed|failed|refunded),
  purchased_at: TIMESTAMP
}
```

---

## 🔧 Implementation Files

### Services

#### 1. `src/services/subscriptionService.js`
Main service for subscription management.

**Key Functions:**
```javascript
// Get user's profile
await subscriptionService.getUserProfile(userId);

// Check if user can start new chat
await subscriptionService.canStartNewChat(userId);

// Increment chat usage
await subscriptionService.incrementChatUsage(userId);

// Create chat session
await subscriptionService.createChatSession(userId, sessionId);

// Update message count
await subscriptionService.updateChatMessageCount(sessionId, count);

// Complete chat
await subscriptionService.completeChat(sessionId);

// Upgrade subscription
await subscriptionService.upgradeSubscription(userId, newTier, stripeSubId, stripeCustomerId);

// Purchase top-up
await subscriptionService.purchaseTopUp(userId, packageType, chatsAdded, priceUsd, stripePaymentIntentId);

// Get chat stats
await subscriptionService.getChatStats(userId);
```

### Components

#### 1. `src/components/ChatCounter.jsx`
Displays chat usage in header with dropdown.

**Features:**
- Shows chats used/limit (e.g., "5/10")
- Progress bar visualization
- Warning when low on chats
- "Upgrade Plan" button
- "Buy More Chats" button
- Stats: total chats, avg messages

**Usage:**
```jsx
import ChatCounter from './ChatCounter';

// In Header or anywhere
<ChatCounter />
```

#### 2. `src/components/SubscriptionModal.jsx`
Full-screen modal for plan selection.

**Features:**
- 5 plan tiers displayed
- Current plan highlighted
- Popular plan badge
- Detailed feature lists
- "Continue to Payment" button

**Usage:**
```jsx
import SubscriptionModal from './SubscriptionModal';

<SubscriptionModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  currentTier="starter"
  onUpgrade={async (tierId) => {
    // Handle Stripe checkout
    console.log('Upgrade to:', tierId);
  }}
/>
```

#### 3. `src/components/TopUpModal.jsx`
Modal for purchasing extra chats.

**Features:**
- 4 top-up packages
- Savings badges
- Best value highlighting
- "Never expires" messaging

**Usage:**
```jsx
import TopUpModal from './TopUpModal';

<TopUpModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  currentChats={{ chatsRemaining: 3 }}
  onPurchase={async (pkg) => {
    // Handle Stripe payment
    console.log('Purchase:', pkg);
  }}
/>
```

---

## 🎨 Header Integration

The Chat Counter is now displayed in the header next to the menu icons.

**Location:** Between logo and burger menu
**Visibility:** Only shown when user is authenticated
**File:** `src/components/Header.tsx`

**Example:**
```
[Logo] ................ [Chat: 5/10] [Menu] [User] [Wallet]
```

---

## 🔐 Chat Cap Enforcement

### How It Works:

1. **Before Starting Chat:**
```javascript
const canStartChat = await subscriptionService.canStartNewChat(userId);

if (!canStartChat.canStart) {
  // Show upgrade/top-up modal
  setShowSubscriptionModal(true);
  return;
}
```

2. **When User Sends First Message:**
```javascript
// Increment usage
const result = await subscriptionService.incrementChatUsage(userId);

if (!result.success) {
  // Limit reached mid-conversation
  alert('Chat limit reached! Please upgrade or buy more chats.');
  return;
}

// Create session record
await subscriptionService.createChatSession(userId, sessionId);
```

3. **During Conversation:**
```javascript
// Track message count
await subscriptionService.updateChatMessageCount(sessionId, messageCount);

// When chat ends (25 messages or user closes)
await subscriptionService.completeChat(sessionId);
```

### Integration with AIChat.jsx:

```javascript
// Add to AIChat.jsx before sending message
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';

const AIChat = () => {
  const { user } = useAuth();
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random()}`);

  const handleSendMessage = async (message) => {
    // Check if first message in new chat
    if (messages.length === 0) {
      // Check if user can start new chat
      const canStart = await subscriptionService.canStartNewChat(user.id);

      if (!canStart.canStart) {
        // Show upgrade modal
        setShowUpgradeModal(true);
        return;
      }

      // Increment usage
      const result = await subscriptionService.incrementChatUsage(user.id);

      if (!result.success) {
        alert(`Chat limit reached! You've used ${result.chats_used}/${result.chats_limit} chats.`);
        setShowUpgradeModal(true);
        return;
      }

      // Create session
      await subscriptionService.createChatSession(user.id, sessionId);
    }

    // Send message normally
    const response = await sendToAI(message);

    // Update message count
    await subscriptionService.updateChatMessageCount(sessionId, messages.length + 1);

    // If 25 messages reached, complete chat
    if (messages.length + 1 >= 25) {
      await subscriptionService.completeChat(sessionId);
      alert('Chat session completed! Start a new chat to continue.');
    }
  };

  return (
    // ... chat UI
  );
};
```

---

## 💳 Stripe Integration (TODO)

### Environment Variables:

```env
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### Webhooks to Implement:

1. **`customer.subscription.created`**
   - Update `user_profiles` with stripe_subscription_id
   - Set subscription_status = 'active'

2. **`customer.subscription.updated`**
   - Update subscription_tier if changed
   - Update current_period_start/end

3. **`customer.subscription.deleted`**
   - Set subscription_status = 'canceled'
   - Downgrade to 'explorer' tier

4. **`payment_intent.succeeded`** (for top-ups)
   - Add chats to user's limit
   - Create record in `chat_topups`

### Stripe Product IDs:

Create products in Stripe Dashboard:

```
Starter Monthly: price_starter_monthly_29
Pro Monthly: price_pro_monthly_79
Business Monthly: price_business_monthly_199
Elite Monthly: price_elite_monthly_499

Top-up 5 Chats: price_topup_5_15
Top-up 10 Chats: price_topup_10_25
Top-up 25 Chats: price_topup_25_50
Top-up 50 Chats: price_topup_50_85
```

Store these in `subscription_tiers` table:

```sql
UPDATE subscription_tiers
SET stripe_price_id = 'price_starter_monthly_29'
WHERE id = 'starter';
```

---

## 📊 Profit Margins

### Subscription Revenue (per user):

**AI Cost per Chat:** ~$0.30 (with Claude 3.5 Sonnet + Caching)

| Plan | Revenue | AI Cost | Profit | Margin |
|------|---------|---------|--------|--------|
| Explorer | $0 | -$0.60 | -$0.60 | Loss (lead gen) |
| Starter | $29 | $3.00 | $26.00 | 90% |
| Pro | $79 | $9.00 | $70.00 | 89% |
| Business | $199 | $30.00 | $169.00 | 85% |
| Elite | $499 | ~$60-90 | $409.00 | 82% |

### Top-Up Revenue:

| Package | Revenue | AI Cost | Profit | Margin |
|---------|---------|---------|--------|--------|
| 5 Chats | $15 | $1.50 | $13.50 | 90% |
| 10 Chats | $25 | $3.00 | $22.00 | 88% |
| 25 Chats | $50 | $7.50 | $42.50 | 85% |
| 50 Chats | $85 | $15.00 | $70.00 | 82% |

---

## 🚀 Deployment Steps

### 1. Database
```bash
# Run migration
psql "your_connection_string" -f database/ai_subscription_migration.sql

# Verify tables
psql "your_connection_string" -c "\dt"
```

### 2. Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Claude API (already set)
CLAUDE_API_KEY=sk-ant-api03-...
```

### 3. Stripe Setup
1. Create products in Stripe Dashboard
2. Copy price IDs
3. Update `subscription_tiers` table with stripe_price_ids
4. Set up webhooks pointing to your backend

### 4. Test Flow
1. Create new user → should get Explorer profile (2 free chats)
2. Use 2 chats → should block further chats
3. Click "Upgrade Plan" → modal opens
4. Select Starter → redirects to Stripe checkout
5. Complete payment → webhook updates profile
6. Verify chats_limit = 10, chats_used = 0

---

## 📝 Next Steps

- [ ] Implement Stripe checkout flow
- [ ] Set up Stripe webhooks
- [ ] Add subscription cancellation flow
- [ ] Build admin dashboard to view user stats
- [ ] Add email notifications (low chats, upgrade successful)
- [ ] Implement monthly reset cron job
- [ ] Add analytics tracking (conversion rates, popular plans)
- [ ] Create referral system (bonus chats for referrals)

---

## 🆘 Support

If you encounter issues:

1. Check Supabase logs for errors
2. Verify user_profiles table has correct data
3. Check browser console for API errors
4. Ensure Stripe webhooks are receiving events

---

**Implementation Complete!** 🎉

All components are ready - just need to add Stripe integration.
