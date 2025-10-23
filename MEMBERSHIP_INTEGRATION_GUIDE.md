# Membership & Subscription Integration Guide

## ✅ What's Been Implemented

### 1. **AIChat Header Enhancements**
The AIChat component now includes:

#### Chat Sessions Overview Dropdown
- **Location**: Top header, next to cart icon
- **Features**:
  - Shows total number of chats
  - Displays chat usage progress (X/Y used)
  - Lists all chat sessions with titles and message counts
  - "+ New Chat" button with subscription limit validation
  - Shows "Unlimited chats" for Elite tier users

#### Current Plan Button
- **Location**: Top header, rightmost position (next to volume icon)
- **Design**: Black button with Crown icon
- **Features**:
  - Displays current subscription tier (Explorer, Starter, Pro, Business, Elite)
  - Opens SubscriptionModal when clicked
  - Shows upgrade options

### 2. **Subscription Validation**
- Chat creation now validates subscription limits
- If user is out of chats, shows SubscriptionModal
- Auto-increments chat usage counter when new chat is created
- Profile updates in real-time

### 3. **MembershipPackages Page Component**
**File**: `src/components/Landingpagenew/MembershipPackages.jsx`

A full-page component that displays all 5 subscription tiers:

#### Plans Available:
1. **EXPLORER** (Free)
   - 2 AI Conversations (lifetime)
   - Text chat only

2. **STARTER** ($29/month)
   - 10 Conversations/month
   - Voice & Text Support

3. **PROFESSIONAL** ($79/month) - MOST POPULAR
   - 30 Conversations/month
   - Priority Support
   - Advanced Analytics

4. **BUSINESS** ($199/month)
   - 100 Conversations/month
   - Dedicated Concierge Manager
   - Team collaboration

5. **ELITE** ($499/month) - VIP
   - Unlimited Conversations
   - Dedicated Account Team
   - Exclusive deals

#### Features:
- Beautiful glassmorphic design
- Current plan highlighting
- Plan selection and comparison
- FAQ section
- Ready for Stripe integration

---

## 🔄 How to Use the MembershipPackages Page

### Option 1: As a Standalone Route
Add to your router (e.g., in `App.tsx` or routing configuration):

```jsx
import MembershipPackages from './components/Landingpagenew/MembershipPackages';

// In your routes:
<Route path="/membership" element={<MembershipPackages />} />
```

### Option 2: As a Modal/Overlay
```jsx
import MembershipPackages from './components/Landingpagenew/MembershipPackages';

const [showMembership, setShowMembership] = useState(false);

{showMembership && (
  <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
    <MembershipPackages onBack={() => setShowMembership(false)} />
  </div>
)}
```

### Option 3: Navigate from Current Plan Button
The "Current Plan" button in AIChat header already opens the SubscriptionModal.
You can change it to navigate to the full page:

```jsx
// In AIChat.jsx, change the Current Plan button onClick to:
onClick={() => window.location.href = '/membership'}
// or use your router's navigation method
```

---

## 💳 Stripe Integration (TODO)

### What Needs to be Done:

1. **Create Stripe Products & Prices**
   - Create products for each tier in Stripe Dashboard
   - Set up recurring prices (monthly)
   - Save Stripe Price IDs in your database

2. **Implement Checkout Flow**

In `SubscriptionModal.jsx` and `MembershipPackages.jsx`, update the `onUpgrade` handler:

```jsx
import { stripeService } from '../services/stripeService';

const handleUpgrade = async (tierId) => {
  try {
    // Create Stripe checkout session
    const { sessionId } = await stripeService.createCheckoutSession({
      userId: user.id,
      tierId: tierId,
      successUrl: window.location.origin + '/success',
      cancelUrl: window.location.origin + '/membership'
    });

    // Redirect to Stripe Checkout
    const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
    await stripe.redirectToCheckout({ sessionId });
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Payment failed. Please try again.');
  }
};
```

3. **Handle Stripe Webhooks**

Create webhook endpoint to handle:
- `checkout.session.completed` - Activate subscription
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Cancel subscription

4. **Update Database Schema**

Ensure your `user_profiles` table has:
- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_status` ('active', 'canceled', 'past_due')
- `current_period_start`
- `current_period_end`

---

## 🎨 Customization

### Change Colors
The plans use these color schemes (in both components):
- Explorer: Gray
- Starter: Blue
- Pro: Black (Most Popular)
- Business: Purple
- Elite: Gold

### Modify Features
Edit the `plans` array in either:
- `src/components/SubscriptionModal.jsx`
- `src/components/Landingpagenew/MembershipPackages.jsx`

### Update Pricing
Change the `price` field in the plans array.

---

## 📊 Database Functions Required

The following database functions must exist (they're already referenced):

1. **`increment_chat_usage(p_user_id UUID)`**
   - Increments `chats_used` for the user
   - Called when a new chat is created

2. **`add_topup_chats(p_user_id UUID, p_chats INT)`**
   - Adds purchased chat credits to user's limit
   - Used for one-time top-ups

---

## 🚀 Next Steps

1. **Set up Stripe**
   - Create Stripe account
   - Create products and prices
   - Get API keys

2. **Implement Payment Flow**
   - Update `stripeService.js`
   - Add checkout session creation
   - Handle webhooks

3. **Test Subscription Flow**
   - Free tier → Paid tier upgrade
   - Paid tier → Higher tier upgrade
   - Chat limit enforcement
   - Payment success/failure handling

4. **Add Navigation**
   - Add "Membership" link to main navigation
   - Add "Upgrade" prompts when chat limit reached
   - Add "Manage Subscription" in user settings

---

## 📝 Files Modified/Created

### Modified:
- `src/components/Landingpagenew/AIChat.jsx`
  - Added chat sessions dropdown
  - Added Current Plan button
  - Added subscription validation
  - Integrated SubscriptionModal

### Created:
- `src/components/Landingpagenew/MembershipPackages.jsx`
  - Full membership page component
  - Plan comparison and selection
  - FAQ section

### Existing Components Used:
- `src/components/SubscriptionModal.jsx` - Already exists
- `src/components/ChatCounter.jsx` - Already exists
- `src/services/subscriptionService.js` - Already exists

---

## 🎯 User Flow

1. User starts using AIChat (Explorer tier - 2 free chats)
2. After 2 chats, they see upgrade prompt
3. Click "Current Plan" button or see modal
4. View plans in modal OR navigate to `/membership` page
5. Select desired plan
6. Proceed to Stripe checkout
7. After payment, subscription activates
8. User gets increased chat limits
9. Can manage subscription from profile

---

## 🔧 Troubleshooting

### "Cannot read property 'subscription_tier' of null"
- User profile not loaded yet
- Add null checks: `userProfile?.subscription_tier || 'explorer'`

### Chat creation not validating limits
- Ensure `subscriptionService.canStartNewChat()` is called
- Check that `increment_chat_usage` RPC function exists in database

### Subscription modal not showing
- Check that `showSubscriptionModal` state is properly set
- Ensure SubscriptionModal is imported and rendered

---

**Need help?** Check the console for errors and ensure all database migrations are applied.
