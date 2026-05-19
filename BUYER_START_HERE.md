# PrivateCharterX — buyer start here

**For:** Technical + business review (acquisition)  
**Repo:** [privatecharterxdevelopment/web3applicationfinaljsx](https://github.com/privatecharterxdevelopment/web3applicationfinaljsx)  
**Company:** PrivateCharterX LLC

This file is **documentation only**. It does not change [www.privatecharterx.com](https://www.privatecharterx.com) or any live product.

---

## 1. What you are buying (one page)

| Asset | Live URL | Deep dive doc |
|-------|----------|----------------|
| **Main platform** (travel, AI, bookings) | [privatecharterx.com](https://www.privatecharterx.com) | [README.md](./README.md) |
| **Web3 / RWA** (tokenization, wallets, launchpad, SPV, PVCX) | [privatecharterx.com/rws](https://www.privatecharterx.com/rws) | [WEB3.md](./WEB3.md) |
| **Full CRM** (ops, sales, Web3 pipeline) | [privatecharterx.com/crm](https://www.privatecharterx.com/crm) | [CRM.md](./CRM.md) |
| **Ground transport** (Mapbox Uber-style + **crypto + card** pay) | [privatecharterx.com/ground-transport](https://www.privatecharterx.com/ground-transport) | [GROUND_TRANSPORT.md](./GROUND_TRANSPORT.md) |
| **Blog** (content + SEO, feeds in-app) | [privatecharterx.blog](https://www.privatecharterx.blog/) | [BLOG.md](./BLOG.md) |
| **Source code** | This GitHub repo | [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md) |

**Stack (summary):** React + Vite · Supabase · Stripe · Mapbox · Claude AI · Wagmi / Reown (Web3) · Coingate (crypto) · Capacitor (mobile shells).

### Test / staging environment (Vercel preview)

| | URL |
|--|-----|
| **Staging base** | [https://web3applicationfinaljsx-1.vercel.app/](https://web3applicationfinaljsx-1.vercel.app/) |

Use the **same paths as production** on the staging host (examples):

| Page | Staging URL |
|------|-------------|
| Home | [web3applicationfinaljsx-1.vercel.app/](https://web3applicationfinaljsx-1.vercel.app/) |
| Services | [/services](https://web3applicationfinaljsx-1.vercel.app/services) |
| Jets | [/jets](https://web3applicationfinaljsx-1.vercel.app/jets) |
| CRM | [/crm](https://web3applicationfinaljsx-1.vercel.app/crm) |
| Web3 | [/rws](https://web3applicationfinaljsx-1.vercel.app/rws) |
| Ground transport | [/ground-transport](https://web3applicationfinaljsx-1.vercel.app/ground-transport) |

Changes are tested here before **www.privatecharterx.com** production deploy.

---

## 2. Review order (recommended, ~2–4 hours)

| Step | Read / open | Time |
|------|-------------|------|
| 1 | This file + [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md) | 20 min |
| 2 | Live URLs below (§3) — click through | 45 min |
| 3 | [WEB3.md](./WEB3.md) + [CRM.md](./CRM.md) | 30 min |
| 4 | [ROUTES.md](./ROUTES.md) — what works vs broken | 20 min |
| 5 | [ARCHITECTURE.md](./ARCHITECTURE.md) + [METRICS.md](./METRICS.md) | 30 min |
| 6 | Clone repo → `npm install` → `npm run build` (`.env.example`) | 30 min |

**Seller provides separately (secure channel):** admin login for `/crm` on production and/or staging.

**Staging (no login needed to open):** [https://web3applicationfinaljsx-1.vercel.app/](https://web3applicationfinaljsx-1.vercel.app/)

---

## 3. Live URLs to test

### Public product (main nav)

| URL | What it is |
|-----|------------|
| [/](https://www.privatecharterx.com/) | Home |
| [/services](https://www.privatecharterx.com/services) | Service grid — **some tiles have no screen** (see §6) |
| [/jets](https://www.privatecharterx.com/jets) | Private jets |
| [/helis](https://www.privatecharterx.com/helis) | Helicopters |
| [/empty-legs](https://www.privatecharterx.com/empty-legs) | Empty legs |
| [/flight-bids](https://www.privatecharterx.com/flight-bids) | Flight bidding |
| [/adventures](https://www.privatecharterx.com/adventures) | Adventures |
| [/flights](https://www.privatecharterx.com/flights) | Commercial flights |
| [/paymentx](https://www.privatecharterx.com/paymentx) | PaymentX / card program |
| [/blog](https://www.privatecharterx.com/blog) | In-app blog (from privatecharterx.blog) |
| [/partners](https://www.privatecharterx.com/partners) | Partners |
| [/chat](https://www.privatecharterx.com/chat) | AI concierge (Sphera) |

### Built & live — not in main navigation

| URL | What it is |
|-----|------------|
| [/ground-transport](https://www.privatecharterx.com/ground-transport) | **Uber-style Mapbox** transfers — **crypto (BTC/ETH/USDT/USDC) + card** |
| [/rws](https://www.privatecharterx.com/rws) | **Web3 hub** |
| [/rws/tokenization](https://www.privatecharterx.com/rws/tokenization) | Asset tokenization |
| [/rws/tokenize-asset](https://www.privatecharterx.com/rws/tokenize-asset) | Tokenize wizard |
| [/rws/marketplace](https://www.privatecharterx.com/rws/marketplace) | RWA marketplace |
| [/rws/nft-marketplace](https://www.privatecharterx.com/rws/nft-marketplace) | NFT marketplace / membership |
| [/rws/launchpad](https://www.privatecharterx.com/rws/launchpad) | Launchpad |
| [/rws/pvcx-token](https://www.privatecharterx.com/rws/pvcx-token) | PVCX token |
| [/rws/spv-formation](https://www.privatecharterx.com/rws/spv-formation) | SPV formation |
| [/rws/my-tokenized-assets](https://www.privatecharterx.com/rws/my-tokenized-assets) | User tokenized assets |
| [/rws/my-spvs](https://www.privatecharterx.com/rws/my-spvs) | User SPVs |
| [/checkout?id=…](https://www.privatecharterx.com/checkout) | Wallet / on-chain booking checkout (needs booking id) |
| [/tokenswap](https://www.privatecharterx.com/tokenswap) | Token swap |
| [/hotels](https://www.privatecharterx.com/hotels) | Hotels UI (nav disabled in code) |

### Staff / admin (login required)

| URL | What it is |
|-----|------------|
| [/crm](https://www.privatecharterx.com/crm) | **Full CRM** — customers, bookings, AI, support, invoices, Web3 ops |
| [/crm-admin](https://www.privatecharterx.com/crm-admin) | Same CRM |
| [/admin](https://www.privatecharterx.com/admin) | Lighter admin gate |
| `admin.privatecharterx.com` | Extended admin (`pages/admin/*`) — confirm with seller |

### Separate sale asset

| URL | What it is |
|-----|------------|
| [privatecharterx.blog](https://www.privatecharterx.blog/) | **Blog** — domain + CMS transfer with deal |

---

## 4. Feature map (what’s in the box)

```
┌─────────────────────────────────────────────────────────────────┐
│  privatecharterx.com (customer-facing SPA)                       │
├─────────────────────────────────────────────────────────────────┤
│  Aviation      jets · helis · empty legs · flight bids · flights │
│  AI            /chat + aiTools (wine, caviar, hotels, …)         │
│  Ground        /ground-transport (Mapbox + crypto/card)          │
│  Web3          /rws/* tokenization · NFT · launchpad · SPV · PVCX│
│  Payments      Stripe · Coingate · /checkout wallet              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  privatecharterx.blog   /crm (full CRM)    Supabase + 38 edge fns
  (content / SEO)        (back-office)     (auth, DB, storage)
```

---

## 5. Key code entry points (for engineers)

| Area | Path |
|------|------|
| Router | `src/components/Landingpagenew/App.tsx` |
| Main UI shell | `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx` |
| AI + tools | `src/components/AIChat/AIChat.jsx`, `src/services/aiTools.js` |
| Ground transport | `src/components/TaxiConcierge/TaxiConciergeView.jsx` |
| Web3 checkout | `src/components/CheckoutPage.tsx` |
| CRM (live `/crm`) | `src/components/CRMDashboard/index.jsx`, `src/pages/CRMPage.tsx` |
| CRM modules | `src/components/CRM/` |
| Blog fetch | `src/services/blogService.js`, `supabase/functions/fetch-blog-posts/` |
| Env template | `.env.example` |

---

## 6. Known gaps (disclosed — not hidden)

| Issue | Workaround / note |
|-------|-------------------|
| `/services` tiles: yachts, MEDEVAC, concierge, group-charter, **NFT membership** | No shell view — use `/chat`, `/ground-transport`, `/rws/nft-marketplace`, or CRM |
| Web3 + ground transport not in main nav | Use direct URLs in §3 |
| No automated tests in repo | Seller QA on [staging Vercel](https://web3applicationfinaljsx-1.vercel.app/) before production |
| Monolithic ~13k-line shell | Budget refactor post-close — see [METRICS.md](./METRICS.md) |
| Mapbox env | `VITE_MAPBOX_TOKEN` required before **next** frontend deploy |

Full list: [ROUTES.md](./ROUTES.md) · [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md) §4

---

## 7. Documentation index

| Doc | Use when |
|-----|----------|
| [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md) | Honest sale pack, risks, third parties |
| [WEB3.md](./WEB3.md) | Tokenization, NFT, crypto, `/rws` |
| [GROUND_TRANSPORT.md](./GROUND_TRANSPORT.md) | Mapbox + crypto checkout |
| [CRM.md](./CRM.md) | Full CRM at `/crm` |
| [BLOG.md](./BLOG.md) | privatecharterx.blog |
| [ROUTES.md](./ROUTES.md) | Every URL status |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical structure |
| [METRICS.md](./METRICS.md) | Size, quality signals |
| [OPERATIONS.md](./OPERATIONS.md) | Deploy, env vars |
| [SUPABASE.md](./SUPABASE.md) | Edge functions |
| [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md) | Close checklist |
| [ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md) | Accounts (fill offline) |
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | All docs listed |

---

## 8. Quick message to forward to your team

```
PrivateCharterX acquisition review — start here:
https://github.com/privatecharterxdevelopment/web3applicationfinaljsx/blob/main/BUYER_START_HERE.md

Staging: https://web3applicationfinaljsx-1.vercel.app/
Live checks:
• Platform: https://www.privatecharterx.com
• Web3: https://www.privatecharterx.com/rws
• CRM: https://www.privatecharterx.com/crm (admin login from seller)
• Ground transport + crypto: https://www.privatecharterx.com/ground-transport
• Blog (included): https://www.privatecharterx.blog/

Then read BUYER_DUE_DILIGENCE.md and WEB3.md on GitHub.
```

---

## 9. Disclaimer

This pack is based on repository inspection. Not legal, financial, or security advice. Verify all claims independently before payment.

*PrivateCharterX LLC — proprietary platform.*
