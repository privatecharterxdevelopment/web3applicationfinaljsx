# Subscription System - Quick Reference Card 🚀

## 📍 Where Everything Is

### **User Access Points:**
```
Dashboard Sidebar:
├── 👑 Subscription Menu Item → Full subscription page
├── 💳 Membership Card (sidebar bottom) → Shows current tier
└── 🎁 Referral Card (sidebar bottom) → Referral progress
```

### **Key Files:**
```
src/components/
├── SubscriptionManagement.jsx ← Full subscription page
├── MembershipCard.jsx ← Sidebar tier card
├── ReferralCard.jsx ← Sidebar referral card
└── Landingpagenew/
    └── tokenized-assets-glassmorphic.jsx ← Dashboard (modified)

src/services/
├── stripeService.js ← All Stripe operations
└── nftBenefitsService.js ← NFT benefits logic

netlify/functions/
├── create-checkout-session.ts ← Upgrade flow
├── create-portal-session.ts ← Billing management
└── stripe-webhook.ts ← Payment events
```

---

## 💰 Pricing Tiers

| Tier | Price | Commission | Features |
|------|-------|------------|----------|
| **Explorer** | FREE | 20% | Basic access |
| **Starter** | €79/mo | 15% | AI assistant, email support |
| **Professional** | €149/mo | 12% | Priority support, account manager |
| **Elite** | €299/mo | 10% | VIP support, concierge, events |
| **NFT Holder** | 0.5 ETH | 8% | All Elite + 10% discount + free service |

**Annual Discount:** 17% off (€790, €1,490, €2,990)

---

## 🔄 User Flows

### **Upgrade:**
```
Sidebar → "Subscription" → Scroll to plans → Click "Upgrade Monthly" 
→ Stripe Checkout → Pay → Webhook → Upgraded!
```

### **Cancel:**
```
Sidebar → "Subscription" → "Cancel Subscription" → Confirm 
→ Cancelled (access until period end) → "Reactivate" button available
```

### **Manage Billing:**
```
Sidebar → "Subscription" → "Manage Billing" 
→ Stripe Portal (new tab) → Update payment/view invoices
```

---

## 🛠️ Setup Requirements

### **Stripe Dashboard:**
1. Create 3 products: Starter, Professional, Elite
2. Add monthly + annual prices for each
3. Copy price IDs to `.env`
4. Set webhook endpoint: `https://your-domain.netlify.app/.netlify/functions/stripe-webhook`
5. Copy webhook secret to `.env`

### **Supabase:**
1. Run `subscription_system_migration.sql`
2. Verify tables: `user_subscriptions`, `nft_benefits_used`, `referrals`, `calendar_events`
3. Check RLS policies enabled

### **Environment Variables:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
STRIPE_STARTER_ANNUAL_PRICE_ID=price_...
STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_...
STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_...
STRIPE_ELITE_MONTHLY_PRICE_ID=price_...
STRIPE_ELITE_ANNUAL_PRICE_ID=price_...
```

---

## 🔥 Key Functions

### **Frontend (stripeService.js):**
```javascript
// Get current subscription
const sub = await stripeService.getCurrentSubscription();

// Get benefits (tier, commission, price)
const benefits = await stripeService.getSubscriptionBenefits();

// Create checkout session (upgrade)
const { url } = await stripeService.createCheckoutSession('professional', 'monthly');

// Open billing portal
const { url } = await stripeService.createPortalSession();

// Cancel subscription
await stripeService.cancelSubscription();

// Reactivate subscription
await stripeService.reactivateSubscription();
```

### **Backend (Netlify Functions):**
```javascript
// Create checkout (called by createCheckoutSession)
POST /.netlify/functions/create-checkout-session
Body: { tier: 'professional', billingCycle: 'monthly' }

// Create portal (called by createPortalSession)
POST /.netlify/functions/create-portal-session

// Webhook (called by Stripe)
POST /.netlify/functions/stripe-webhook
Events: checkout.session.completed, subscription.updated, etc.
```

---

## 🎨 Styling

### **Glassmorphic Classes:**
```css
backdrop-blur-xl       /* Blurred background */
bg-white/10           /* Semi-transparent white */
border border-white/20 /* Subtle border */
hover:bg-white/20      /* Hover effect */
rounded-2xl           /* Rounded corners */
```

### **Tier Gradients:**
```css
Explorer: from-gray-500 to-gray-600
Starter: from-green-500 to-emerald-600
Professional: from-blue-500 to-cyan-600
Elite: from-purple-500 to-pink-600
NFT: from-yellow-500 to-orange-600
```

---

## ✅ Testing Checklist

### **Quick Tests:**
- [ ] Click "Subscription" in sidebar → Page loads
- [ ] Current plan displays correctly
- [ ] Click "Upgrade Monthly" → Stripe Checkout opens
- [ ] Complete payment → Subscription updates
- [ ] MembershipCard shows new tier
- [ ] Click "Manage Billing" → Stripe portal opens
- [ ] Click "Cancel" → Confirmation modal appears
- [ ] Confirm cancel → Warning banner shows
- [ ] Click "Reactivate" → Subscription reactivates

---

## 🐛 Troubleshooting

### **"Subscription not loading"**
- Check Supabase connection
- Verify user_subscriptions table exists
- Check RLS policies allow user to read their own data

### **"Upgrade button not working"**
- Check STRIPE_PUBLISHABLE_KEY in .env
- Verify price IDs are correct
- Check Netlify function deployed
- Check browser console for errors

### **"Webhook not firing"**
- Verify webhook URL in Stripe Dashboard
- Check STRIPE_WEBHOOK_SECRET matches
- Test with Stripe CLI: `stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook`
- Check Netlify function logs

### **"NFT benefits not showing"**
- Verify wallet connected
- Check NFT contract address in nftBenefitsService
- Verify user owns NFT on correct chain

---

## 📊 Commission Impact Calculator

**Example: €10,000 booking**

| Tier | Commission | User Pays | You Earn |
|------|-----------|----------|----------|
| Explorer | 20% | €10,000 | €2,000 |
| Starter | 15% | €10,000 | €1,500 |
| Professional | 12% | €10,000 | €1,200 |
| Elite | 10% | €10,000 | €1,000 |
| NFT | 8% + 10% off | €9,000 | €720 |

**User Savings on Professional vs Explorer:**
- Saves: €800 per €10,000 booking
- Monthly cost: €149
- Break-even: 2 bookings/month (€20,000 volume)

---

## 🚀 Next: Add Chat Counter

### **What's Missing:**
The chat usage counter in the header ("1/2" format based on subscription)

### **Quick Implementation:**

**1. Add state (line ~80):**
```javascript
const [chatUsageCount, setChatUsageCount] = useState(0);
const [chatLimit, setChatLimit] = useState(2);
const [subscriptionTier, setSubscriptionTier] = useState('explorer');
```

**2. Load on mount:**
```javascript
useEffect(() => {
  const loadSub = async () => {
    const sub = await stripeService.getCurrentSubscription();
    const limits = { explorer: 2, starter: 15, professional: 30, elite: Infinity };
    setChatLimit(limits[sub?.tier || 'explorer']);
  };
  loadSub();
}, []);
```

**3. Add to header (line ~1374 after greeting):**
```javascript
<div className="flex items-center space-x-2 ml-4">
  <MessageSquare className="w-4 h-4 text-gray-500" />
  <span className="text-sm text-gray-600">
    {chatUsageCount}/{chatLimit === Infinity ? '∞' : chatLimit}
  </span>
</div>
```

**See:** `SUBSCRIPTION_PAGE_INTEGRATION.md` for detailed code

---

## 📚 Full Documentation

- **IMPLEMENTATION_GUIDE.md** - 50-page complete guide
- **QUICK_START.md** - 5-hour setup timeline
- **SUBSCRIPTION_PAGE_INTEGRATION.md** - Page details
- **FINAL_INTEGRATION_SUMMARY.md** - Complete overview
- **This file** - Quick reference

---

## 🎯 Status

✅ **COMPLETE:**
- Membership cards in sidebar
- Subscription menu item
- Full subscription management page
- Upgrade/cancel/reactivate functionality
- Stripe integration
- NFT benefits
- Glassmorphic design

⏳ **REMAINING:**
- Chat usage counter in header
- Load subscription on mount
- Increment counter on usage

**You're 90% done! Just add the chat counter and you're production-ready! 🎉**
