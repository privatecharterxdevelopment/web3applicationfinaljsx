# DexRais.funds - Setup Instructions

## ✅ What's Completed

### 1. Tiered Payment System
- **4 Pricing Tiers**: Starter (CHF 250), Pro (CHF 500), Enterprise (CHF 2,000), Enterprise + Audit (CHF 15,000)
- **Direct USDC Payments**: Simple transfer to platform wallet (no Gnosis Safe complexity)
- **Payment Flow**: Tier selection → Campaign creation → USDC payment → Auto-publish

### 2. User Profile Integration
- All campaigns linked to user wallet addresses
- CreatorDashboard shows user's campaigns, fees paid, total raised
- Real-time stats per user profile
- Featured campaigns highlighted with ⭐

### 3. Components Built
- ✅ PricingSelection page with 3 tiers + bundle
- ✅ PricingCard component (glassmorphic design)
- ✅ TieredPayment component (USDC balance check + transfer)
- ✅ CreatorDashboard with stats and campaign list
- ✅ SocialShare component (Twitter, Facebook, LinkedIn, Telegram, Email, Copy)

### 4. Database Schema
- ✅ pricing_tier column
- ✅ launch_fee_paid_amount, launch_fee_tx_hash
- ✅ transaction_fee_percentage
- ✅ featured_until (Pro: 7 days, Enterprise: 30 days)
- ✅ pending_payment status
- ✅ User profile integration views and functions

## 🔧 Required Setup Steps

### Step 1: Get WalletConnect Project ID
1. Go to https://cloud.walletconnect.com
2. Create a new project
3. Copy your Project ID

### Step 2: Set Environment Variables
Create/update `.env` file with:

```env
# Already set ✅
VITE_SUPABASE_URL=https://ttzinesrosreceefzitz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Need to add ⚠️
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_PLATFORM_WALLET=0xYourWalletAddressHere

# Pre-configured ✅
VITE_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
VITE_CHF_TO_USDC=1.10
VITE_CHAIN_ID=8453
```

### Step 3: Run Database Migration
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/ttzinesrosreceefzitz/sql
2. Copy the SQL from: `supabase-migrations/002_add_pricing_tiers_fixed.sql`
3. Execute the SQL

This migration adds:
- pricing_tier, launch_fee_paid_amount, transaction_fee_percentage
- featured_until, pending_payment status
- User profile integration views and functions

### Step 4: Test the Flow
1. Start dev server: `npm run dev`
2. Visit: http://localhost:5174/pricing
3. Select a tier (test with Starter for cheaper testing)
4. Fill campaign form
5. Pay with USDC (you'll need USDC on Base testnet or mainnet)
6. Campaign published ✅
7. Check your dashboard: http://localhost:5174/dashboard

## 💰 Payment Flow Explained

### For Users (Campaign Creators):
1. Visit `/pricing` → Select tier (Starter/Pro/Enterprise/Enterprise+Audit)
2. Fill campaign form on `/create` (title, description, images, etc.)
3. Submit form → Campaign saved with status `pending_payment`
4. Payment screen shows:
   - Your USDC balance
   - Amount required (275/550/2200/16500 USDC)
   - Transaction fee percentage (2.5%/1.5%/1.0%/1.0%)
5. Click "Pay X USDC" → Confirm in wallet
6. On success:
   - Campaign status → `active`
   - Featured date set (if Pro/Enterprise)
   - Redirected to campaign page

### For You (Platform Owner):
1. USDC goes directly to your wallet address (set in `VITE_PLATFORM_WALLET`)
2. Transaction recorded with tx hash
3. User dashboard shows:
   - How many campaigns they've created
   - Total fees paid to you
   - Their pricing tier for each campaign

## 📊 User Profile Integration

### CreatorDashboard Features:
- **Stats Cards**: Total Campaigns, Active Campaigns, Total Raised, Fees Paid
- **Campaign List**: All user's campaigns with:
  - Logo, title, status badge
  - Pricing tier badge (Starter/Pro/Enterprise/Enterprise+Audit)
  - Progress bar (raised/goal)
  - Backers, views, fees paid
  - Featured indicator (⭐) if still featured

### Database Views:
- `user_campaigns_with_pricing`: All campaign data with pricing info
- `get_user_total_fees_paid(wallet)`: Total fees paid by user
- `get_user_campaigns_by_tier(wallet)`: Breakdown by tier

## 🎨 Design System
- **Monochromatic**: Gray-900 primary, white/gray backgrounds
- **Glassmorphic**: backdrop-blur-xl with transparency
- **Icons**: Lucide React only (no AI-generated icons)
- **Fonts**: Light (300), Medium (500) weights

## 🔐 Security Notes
- USDC transfers require user approval in wallet
- Platform wallet receives payments directly (no escrow)
- All transactions recorded with tx hashes
- Row Level Security (RLS) enabled in Supabase

## 📝 Next Steps (Optional)
- [ ] Add transaction fee collection logic (after campaigns succeed)
- [ ] Build CampaignDetail page with SocialShare integration
- [ ] Add email notifications for payment success
- [ ] Implement featured campaigns on homepage
- [ ] Add analytics dashboard for platform owner

## 🐛 Troubleshooting

### "Column already exists" error:
- Use `002_add_pricing_tiers_fixed.sql` migration
- It has IF NOT EXISTS checks for all columns

### Payment fails:
- Check USDC balance on Base chain
- Ensure VITE_PLATFORM_WALLET is set correctly
- Verify user approved USDC transfer in wallet

### Campaigns don't appear in dashboard:
- Check that campaigns.creator_wallet matches user's wallet address
- Verify RLS policies allow user to see their campaigns
- Check browser console for errors

## 🚀 Launch Checklist
- [ ] Set VITE_WALLETCONNECT_PROJECT_ID
- [ ] Set VITE_PLATFORM_WALLET (your wallet)
- [ ] Run database migration
- [ ] Test full payment flow on Base testnet
- [ ] Deploy to production
- [ ] Test on Base mainnet with small amount
- [ ] Update CHF/USDC rate weekly in .env

---

**Dev Server**: http://localhost:5174
**GitHub**: https://github.com/privatecharterxdevelopment/dexrais.funds
**Supabase**: https://ttzinesrosreceefzitz.supabase.co
