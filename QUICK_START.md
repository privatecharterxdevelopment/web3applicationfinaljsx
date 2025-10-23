# 🚀 Quick Start - Deploy STO Marketplace Now

## You're 5 Minutes Away From Testing Your Marketplace!

---

## Step 1: Deploy Database (2 minutes)

### Open Supabase

1. **Open Supabase Dashboard**
   ```
   https://app.supabase.com/project/YOUR_PROJECT/editor
   ```

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New Query"

3. **Run Migration**
   - Copy ALL content from `database/subscription_system_migration.sql`
   - Paste into SQL editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for "Success" message

4. **Verify Tables Created**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_subscriptions', 'nft_benefits_used', 'calendar_events', 'referrals');
   ```
   Should return 4 rows ✅

---

### STEP 2: Stripe Products (1 hour)

1. **Login to Stripe**
   ```
   https://dashboard.stripe.com
   ```
   Use Test Mode for now 🔧

2. **Create Products** (Click "Products" → "+ Add product")

   **Product 1: Starter Monthly**
   - Name: `Sphera Starter (Monthly)`
   - Price: `€79.00` / `month`
   - Metadata:
     - `tier`: `starter`
     - `commission_rate`: `0.15`

   **Product 2: Starter Annual**
   - Name: `Sphera Starter (Annual)`
   - Price: `€790.00` / `year`
   - Metadata:
     - `tier`: `starter`
     - `commission_rate`: `0.15`
     - `billing_cycle`: `annual`

   **Product 3: Professional Monthly**
   - Name: `Sphera Professional (Monthly)`
   - Price: `€149.00` / `month`
   - Metadata:
     - `tier`: `professional`
     - `commission_rate`: `0.12`

   **Product 4: Professional Annual**
   - Name: `Sphera Professional (Annual)`
   - Price: `€1,490.00` / `year`
   - Metadata:
     - `tier`: `professional`
     - `commission_rate`: `0.12`
     - `billing_cycle`: `annual`

   **Product 5: Elite Monthly**
   - Name: `Sphera Elite (Monthly)`
   - Price: `€299.00` / `month`
   - Metadata:
     - `tier`: `elite`
     - `commission_rate`: `0.10`

   **Product 6: Elite Annual**
   - Name: `Sphera Elite (Annual)`
   - Price: `€2,990.00` / `year`
   - Metadata:
     - `tier`: `elite`
     - `commission_rate`: `0.10`
     - `billing_cycle`: `annual`

3. **Copy Price IDs**
   After creating each product, click on it and copy the **Price ID** (starts with `price_`)
   
   Save them in a text file:
   ```
   STARTER_MONTHLY: price_xxxxxxxxxxxxx
   STARTER_ANNUAL: price_xxxxxxxxxxxxx
   PROFESSIONAL_MONTHLY: price_xxxxxxxxxxxxx
   PROFESSIONAL_ANNUAL: price_xxxxxxxxxxxxx
   ELITE_MONTHLY: price_xxxxxxxxxxxxx
   ELITE_ANNUAL: price_xxxxxxxxxxxxx
   ```

4. **Configure Webhook**
   - Click "Developers" → "Webhooks" → "+ Add endpoint"
   - Endpoint URL: `https://YOUR_SITE.netlify.app/.netlify/functions/stripe-webhook`
   - Select events:
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
     - ✅ `checkout.session.completed`
   - Click "Add endpoint"
   - **Copy Signing Secret** (starts with `whsec_`)

---

### STEP 3: Get API Keys (35 mins)

**3.1 Ticketmaster (5 mins)**
1. Go to https://developer.ticketmaster.com/
2. Click "Get Your API Key"
3. Sign up / Login
4. Copy your API Key
5. Save as: `TICKETMASTER_API_KEY`

**3.2 Eventbrite (5 mins)**
1. Go to https://www.eventbrite.com/platform/api
2. Click "Get Started"
3. Create app
4. Copy OAuth token
5. Save as: `EVENTBRITE_TOKEN`

**3.3 Google Calendar (15 mins)**
1. Go to https://console.cloud.google.com/
2. Create new project (or select existing)
3. Enable "Google Calendar API"
4. Go to "Credentials" → "+ Create Credentials"
5. Choose "OAuth client ID"
6. Application type: "Web application"
7. Authorized JavaScript origins: `https://YOUR_SITE.netlify.app`
8. Authorized redirect URIs: `https://YOUR_SITE.netlify.app/dashboard`
9. Click "Create"
10. Copy:
    - Client ID (ends in `.apps.googleusercontent.com`)
    - Client Secret (starts with `GOCSPX-`)
11. Create API Key: "Credentials" → "+ Create" → "API Key"
12. Copy API Key

---

### STEP 4: Environment Setup (15 mins)

1. **Copy Template**
   ```bash
   cp .env.example .env
   ```

2. **Fill in Values**
   Open `.env` and replace all `xxxxx` with your actual keys:
   
   ```env
   # Supabase (from Supabase Dashboard → Settings → API)
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Stripe (from Stripe Dashboard → Developers → API keys)
   VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   
   # Stripe Price IDs (from Step 2)
   VITE_STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxx
   VITE_STRIPE_STARTER_ANNUAL_PRICE_ID=price_xxxxx
   VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_xxxxx
   VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_xxxxx
   VITE_STRIPE_ELITE_MONTHLY_PRICE_ID=price_xxxxx
   VITE_STRIPE_ELITE_ANNUAL_PRICE_ID=price_xxxxx
   
   # Ticketmaster
   VITE_TICKETMASTER_API_KEY=xxxxxxxxxxxxx
   
   # Eventbrite
   VITE_EVENTBRITE_TOKEN=xxxxxxxxxxxxx
   
   # Google Calendar
   VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxx
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
   
   # API URL (update with your Netlify site)
   VITE_API_BASE_URL=https://YOUR_SITE.netlify.app/.netlify/functions
   ```

3. **Set Netlify Environment Variables**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Click "Add a variable"
   - Add ALL variables from `.env` (one by one)
   - Click "Deploy" → "Trigger deploy"

---

### STEP 5: Deploy Backend (1 hour)

1. **Install Dependencies**
   ```bash
   npm install stripe @supabase/supabase-js @netlify/functions
   ```

2. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: subscription system with NFT benefits, events, and calendar"
   git push origin main
   ```

3. **Verify Deployment**
   - Check Netlify build logs
   - Verify Functions deployed:
     - ✅ `create-checkout-session`
     - ✅ `create-customer`
     - ✅ `create-portal-session`
     - ✅ `stripe-webhook`

4. **Test Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook
   - Click "Send test webhook"
   - Choose `customer.subscription.created`
   - Check it succeeds ✅

---

### STEP 6: Frontend Integration (1 hour)

**6.1 Update Dashboard Sidebar**

Edit `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx`:

```jsx
// Add imports at top (around line 5)
import MembershipCard from '../MembershipCard';
import ReferralCard from '../ReferralCard';

// Find sidebar section (around line 1100)
// Add BEFORE user profile section:
<div className="space-y-4 mb-4 px-4">
  <MembershipCard compact />
  <ReferralCard compact />
</div>
```

**6.2 Add Events to AI Chat**

Edit `src/components/Landingpagenew/AIChat.jsx`:

```jsx
// Add imports at top
import eventsService from '../../services/eventsService';
import EventCard from '../EventCard';

// In handleSearch function (around line 200), after existing searches:
// Search events
const events = await eventsService.searchEvents({
  keyword: userMessage,
  city: extractedParams.destination,
  startDate: extractedParams.departure_date
});

// In results display (around line 400), add:
{events && events.length > 0 && (
  <div className="space-y-4 mt-6">
    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
      <span>📅</span>
      <span>Events & Entertainment</span>
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.slice(0, 4).map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  </div>
)}
```

**6.3 Add Calendar to Chat Requests**

Edit `src/components/ChatRequestsView.jsx`:

```jsx
// Add imports
import calendarService from '../services/calendarService';
import { Calendar } from 'lucide-react';

// Add button to request actions (around line 150):
<button
  onClick={() => handleAddToCalendar(request)}
  className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
>
  <Calendar className="w-4 h-4" />
  <span>Add to Calendar</span>
</button>

// Add handler function (around line 50):
const handleAddToCalendar = async (request) => {
  try {
    if (!calendarService.isConnected()) {
      const connected = await calendarService.signInToGoogle();
      if (!connected) {
        alert('❌ Failed to connect to Google Calendar');
        return;
      }
    }
    
    const result = await calendarService.quickAddFromChatRequest(request);
    if (result.success) {
      alert('✅ Added to your Google Calendar!');
    } else {
      alert(`❌ Failed to add: ${result.error}`);
    }
  } catch (error) {
    console.error('Calendar error:', error);
    alert('❌ Error adding to calendar');
  }
};
```

**6.4 Deploy Frontend**

```bash
git add .
git commit -m "feat: integrate subscription UI, events, and calendar"
git push origin main
```

---

### STEP 7: Testing (30 mins)

**7.1 Test Subscription Flow**
1. Go to your site
2. Click on MembershipCard → "Upgrade Now"
3. Should redirect to Stripe checkout
4. Use test card: `4242 4242 4242 4242` (any future date, any CVC)
5. Complete checkout
6. Verify redirects back to dashboard
7. Check MembershipCard shows new tier
8. Check Supabase `user_subscriptions` table has entry

**7.2 Test NFT Benefits**
1. Connect wallet with NFT
2. Search for service
3. Verify 10% discount applied (check console logs)
4. For service ≤$1,500, verify green border + "FREE with NFT" badge

**7.3 Test Events**
1. Open AI Chat
2. Search: "concerts in London"
3. Verify EventCards appear
4. Click "Get Tickets" → opens Ticketmaster/Eventbrite

**7.4 Test Calendar**
1. Go to Chat Requests
2. Click "Add to Calendar" on a request
3. Grant Google Calendar permission
4. Verify event appears in Google Calendar

---

### STEP 8: Go Live (30 mins)

**8.1 Switch Stripe to Live Mode**
1. Stripe Dashboard → Toggle "Test Mode" OFF
2. Recreate all 6 products in Live Mode
3. Copy NEW Price IDs
4. Update webhook endpoint (remove `/test`)
5. Copy NEW webhook signing secret

**8.2 Update Environment Variables**
```bash
# Netlify Dashboard → Environment Variables
# Update these to LIVE values:
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (new live secret)
# Update all 6 price IDs to live versions
```

**8.3 Final Deploy**
```bash
# Trigger new deploy to use live Stripe keys
# Netlify Dashboard → Deploys → "Trigger deploy"
```

**8.4 Production Test**
- Test with REAL credit card (will charge for real!)
- Verify subscription created
- Verify webhook delivered
- Check database entry
- Test cancellation flow

---

## ✅ Success Checklist

- [ ] Database has 4 new tables
- [ ] Stripe has 6 products configured
- [ ] All API keys in Netlify environment
- [ ] Backend functions deployed and accessible
- [ ] MembershipCard shows in sidebar
- [ ] ReferralCard shows in sidebar
- [ ] Events appear in AI chat search
- [ ] Calendar integration works
- [ ] Test Mode subscription successful
- [ ] Live Mode tested and working

---

## 🎉 You're Live!

Your subscription system is now fully operational with:
- ✅ Automated billing (Stripe)
- ✅ NFT holder benefits (10% + free service)
- ✅ Event ticket discovery
- ✅ Calendar sync
- ✅ Referral program

---

## 📊 Monitor Your Success

Check these daily:
1. **Stripe Dashboard** → MRR, new subscribers, churn
2. **Supabase** → User subscriptions, NFT redemptions
3. **Netlify Functions** → Webhook deliveries, errors
4. **Google Analytics** → Conversion rates, upgrade paths

---

## 🆘 Need Help?

**Common Issues:**
- Webhook failing? Check signing secret matches
- Subscription not syncing? Verify Supabase service role key
- NFT discount not working? Test wallet connection
- Calendar not connecting? Check OAuth consent screen

**Full Documentation:**
- `IMPLEMENTATION_GUIDE.md` - Detailed 50-page guide
- `DEPLOYMENT_SUMMARY.md` - All files created
- `FINAL_IMPLEMENTATION_SPEC.md` - Requirements spec

---

**🚀 Ready? Start with Step 1! 🚀**
