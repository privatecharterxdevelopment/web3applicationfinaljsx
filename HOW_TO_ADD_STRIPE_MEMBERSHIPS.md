# 🎯 How to Add Stripe Memberships

## ✅ DONE - Integration Complete!

The membership cards have been successfully integrated into your dashboard sidebar!

---

## 📍 **Where They Appear**

The **MembershipCard** and **ReferralCard** now appear in the **left sidebar** of your dashboard:

```
Dashboard Sidebar (expanded on hover):
├── Logo
├── AI Chat Section
├── Navigation Menu
│   ├── Overview
│   ├── Bookings
│   ├── Chat Requests
│   └── ...
├── ─────────────────────
└── Bottom Section:
    ├── 💳 Membership Card  ← NEW!
    ├── 🎁 Referral Card    ← NEW!
    └── 👤 User Profile
```

---

## 🎨 **Visual Behavior**

- **Collapsed (16px width)**: Cards are hidden
- **Expanded (240px width)**: Cards slide in elegantly
- **Hover**: Sidebar auto-expands to show cards
- **Glassmorphic**: Matches your design system

---

## ⚙️ **Next Steps to Complete Setup**

### 1️⃣ **Stripe Dashboard Setup** (15 mins)

Go to https://dashboard.stripe.com and create products:

| Product | Price | Type | Metadata |
|---------|-------|------|----------|
| Starter Monthly | €79 | Monthly | `tier: starter, commission_rate: 0.15` |
| Starter Annual | €790 | Yearly | `tier: starter, commission_rate: 0.15` |
| Professional Monthly | €149 | Monthly | `tier: professional, commission_rate: 0.12` |
| Professional Annual | €1,490 | Yearly | `tier: professional, commission_rate: 0.12` |
| Elite Monthly | €299 | Monthly | `tier: elite, commission_rate: 0.10` |
| Elite Annual | €2,990 | Yearly | `tier: elite, commission_rate: 0.10` |

**After creating each product:**
- Click on the product
- Copy the **Price ID** (starts with `price_`)
- Save it for environment variables

---

### 2️⃣ **Environment Variables** (5 mins)

Add to your `.env` file AND Netlify Dashboard:

```env
# Stripe Keys (from dashboard.stripe.com/test/apikeys)
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Price IDs (from Step 1)
VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxx
VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_xxxxx
VITE_STRIPE_ELITE_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_ELITE_ANNUAL_PRICE_ID=price_xxxxx

# Webhook Secret (configured in Step 3)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

### 3️⃣ **Configure Stripe Webhook** (5 mins)

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **+ Add endpoint**
3. **Endpoint URL**: `https://YOUR_SITE.netlify.app/.netlify/functions/stripe-webhook`
4. **Select events**:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `checkout.session.completed`
5. Click **Add endpoint**
6. Copy **Signing secret** → Add to environment as `STRIPE_WEBHOOK_SECRET`

---

### 4️⃣ **Run Database Migration** (10 mins)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy entire content from: `database/subscription_system_migration.sql`
3. Paste and **Run**
4. Verify tables created:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_subscriptions', 'nft_benefits_used', 'calendar_events', 'referrals');
```

Should return 4 rows ✅

---

### 5️⃣ **Deploy & Test** (15 mins)

```bash
# Install dependencies
npm install stripe @supabase/supabase-js @netlify/functions

# Commit and push
git add .
git commit -m "feat: integrate membership cards in dashboard sidebar"
git push origin main
```

**Test the flow:**
1. Visit your site
2. Hover over left sidebar
3. See **Membership Card** and **Referral Card** appear
4. Click "Upgrade Now" on Membership Card
5. Should redirect to Stripe checkout
6. Use test card: `4242 4242 4242 4242`
7. Complete checkout
8. Verify subscription appears in Supabase

---

## 🎉 **What Each Card Shows**

### **Membership Card**
- Current subscription tier (Explorer, Starter, Pro, Elite, NFT)
- Commission rate (8-20%)
- Renewal date
- "Upgrade Now" or "Manage Plan" button
- NFT holder badge (if wallet connected with NFT)

### **Referral Card**
- Total referrals count
- Successful referrals
- Progress bar to 50% bonus (5 referrals = 50% off)
- "Copy Link" button
- Instant sharing

---

## 🔗 **Files Modified**

1. ✅ `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx`
   - Added imports for MembershipCard and ReferralCard
   - Integrated cards in sidebar bottom section

2. ✅ `src/components/MembershipCard.jsx` (already created)
   - Full component with compact mode

3. ✅ `src/components/ReferralCard.jsx` (already created)
   - Full component with compact mode

4. ✅ `src/services/stripeService.js` (already created)
   - Complete Stripe integration logic

5. ✅ `netlify/functions/*` (already created)
   - All Stripe backend functions

---

## 📚 **Documentation**

For detailed guides, see:
- `QUICK_START.md` - 5-hour complete setup
- `IMPLEMENTATION_GUIDE.md` - 50-page detailed guide
- `DEPLOYMENT_SUMMARY.md` - All files and features
- `IMPLEMENTATION_CHECKLIST.md` - Track your progress

---

## 🆘 **Troubleshooting**

### Cards not appearing?
- Make sure sidebar is **expanded** (hover over it)
- Check browser console for errors
- Verify imports are correct

### Upgrade button not working?
- Check Stripe public key in environment variables
- Verify price IDs are set correctly
- Check Netlify function logs

### Subscription not syncing to database?
- Verify webhook endpoint is configured
- Check webhook signing secret matches
- Check Supabase service role key is set

---

## ✅ **Status: READY TO USE**

The membership cards are now **fully integrated** into your dashboard!

**Next:** Complete Steps 1-5 above to activate Stripe payments and subscriptions.

---

**Need help?** Check `QUICK_START.md` for step-by-step instructions.
