# PrivateCharterX — complete route inventory

**Site:** [www.privatecharterx.com](https://www.privatecharterx.com)  
**Router:** `src/components/Landingpagenew/App.tsx`  
**In-app views:** `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx` (`activeCategory`)

Legend:

| Status | Meaning |
|--------|---------|
| **LIVE** | Public product; working UI |
| **LIVE-HIDDEN** | Working; not in main nav |
| **LOGIN** | Requires account |
| **REDIRECT** | URL works; sends user elsewhere |
| **BROKEN-TILE** | Linked from UI but no `activeCategory` view |
| **DISABLED** | Code commented or nav removed |
| **REMOVED** | Route deleted in this repo |
| **ADMIN** | `admin.*` subdomain or staff tools |

---

## 1. Main navigation (live today)

| URL | Status | Component / category |
|-----|--------|----------------------|
| `/` | LIVE | Shell → `home` / chat hub |
| `/services` | LIVE | Shell → `services` grid |
| `/jets` | LIVE | `PrivateJetSearchDashboard` |
| `/helis` | LIVE | Shell → `helicopter` catalog |
| `/empty-legs` | LIVE | Shell → `empty-legs` |
| `/flight-bids` | LIVE | `FlightOpsView` (`flight-ops`) |
| `/adventures` | LIVE | Shell → `adventures` |
| `/flights` | LIVE | `FlightSearchDashboard` |
| `/paymentx` | LIVE | Shell → PaymentX marketing |
| `/blog` | LIVE | Shell → `blog` |
| `/partners` | LIVE | Shell → `partners` |

---

## 2. Working routes not in main nav

| URL | Status | Notes |
|-----|--------|-------|
| `/ground-transport` | LIVE-HIDDEN | **Mapbox Uber-style** booking (`TaxiConciergeView`) |
| `/chat`, `/chat/:chatId` | LIVE | Sphera AI (`AIChat`) |
| `/ai-chat` | LIVE-HIDDEN | Alias to chat flow |
| `/debitcard`, `/pay` | LIVE-HIDDEN | DebitCardX application overlay |
| `/home` | LIVE-HIDDEN | Same shell as home |
| `/luxury-cars` | LIVE-HIDDEN | Shell listing; also in ground transport |
| `/hotels` | LIVE-HIDDEN | `HotelsView` — **nav disabled** in code (“LiteAPI temporarily removed”) |
| `/co2-saf`, `/co2-certificates` | LIVE-HIDDEN | CO₂ offset flows |
| `/faqs` | LIVE-HIDDEN | Helpdesk inline |
| `/terms` | LIVE | Legal copy in shell |
| `/privacy` | LIVE | Legal — live footer may use `/privacy-policy` instead |
| `/imprint` | LIVE | Legal — live footer may use `/impressum` instead |
| `/cookies` | LIVE | Maps to privacy content |
| `/tokenswap` | LIVE-HIDDEN | Standalone `TokenSwapPage` |
| `/search-index` | LIVE-HIDDEN | Global search |
| `/checkout` | LIVE | Standalone `CheckoutPage` (Web3 pay) |

---

## 3. Logged-in / account routes (shell)

| URL | Status | Notes |
|-----|--------|-------|
| `/login`, `/register`, `/verify-email` | LIVE | Standalone auth pages |
| `/forgot-password`, `/reset-password` | LIVE | Auth |
| `/profile`, `/settings` | LOGIN | Shell + dashboard views |
| `/bookings`, `/my-bookings` | LOGIN | |
| `/requests`, `/ai-requests`, `/my-requests` | LOGIN | Ops requests |
| `/transactions`, `/bids`, `/messages` | LOGIN | |
| `/notifications`, `/activities` | LOGIN | |
| `/chat-history` | LOGIN | |
| `/kyc-verification` | LOGIN | KYC form |
| `/referral` | LOGIN | |
| `/subscriptions`, `/subscriptions/plans`, `/subscriptions/manage` | LOGIN | Stripe tiers |
| `/partner-dashboard` | LOGIN | Partner role |

---

## 4. Web3 / RWA (`/rws/*`)

| URL | Status | Notes |
|-----|--------|-------|
| `/rws` | LIVE-HIDDEN | Web3 hub (`overview`) |
| `/rws/marketplace` | LIVE-HIDDEN | |
| `/rws/tokenization` | LIVE-HIDDEN | |
| `/rws/nft-marketplace` | LIVE-HIDDEN | |
| `/rws/launchpad` | LIVE-HIDDEN | |
| `/rws/pvcx-token` | LIVE-HIDDEN | |
| `/rws/tokenize-asset` | LIVE-HIDDEN | |
| `/rws/spv-formation` | LIVE-HIDDEN | SPV wizard (submenu hidden) |
| `/rws/my-tokenized-assets`, `/rws/my-spvs` | LIVE-HIDDEN | |
| `/my-launches` | LIVE-HIDDEN | |

Legacy aliases **REDIRECT** to `/rws/*`: `/web3`, `/tokenized`, `/dashboard/web3/*`, `/rwa/*`, `/spv/*`, `/ico`, `/nft`, `/dao`, `/crypto`, `/marketplace`, etc.

**DISABLED in code:** Polymesh `AssetMarketplace` pages (comment: no license). P2P, DAO, escrow UI hidden “for MVP”.

---

## 5. Detail & booking routes (standalone components)

| URL | Status | Component |
|-----|--------|-----------|
| `/empty-leg/:id` | LIVE | `EmptyLegDetail` |
| `/jet/:id` | LIVE | `JetDetail` |
| `/helicopter/:id` | LIVE | `HelicopterDetail` |
| `/adventure/:id` | LIVE | `AdventureDetail` |
| `/luxury-car/:id` | LIVE | `LuxuryCarDetail` |
| `/hotel/:id` | LIVE | `HotelDetail` |
| `/co2-certificate/:id` | LIVE | `CO2CertificateDetail` |
| `/project/:projectId` | LIVE-HIDDEN | Launchpad project |
| `/book/flight/:offerId` | LIVE | `FlightBooking` |
| `/book/empty-leg/:id` | LIVE | `EmptyLegBooking` |
| `/payment/success`, `/payment/cancel` | LIVE | Payment result pages |
| `/subscription/success` | LIVE | Subscription result |

---

## 6. BROKEN — `/services` grid tiles (no view)

Clicking these on **`/services`** sets `activeCategory` but **there is no matching render block** in the shell:

| Tile label | `activeCategory` | What happens |
|------------|------------------|--------------|
| Yacht Charter | `yachts` | **Blank / broken** — no `activeCategory === 'yachts'` |
| MEDEVAC | `medevac` | **Blank / broken** |
| Concierge | `concierge` | **Blank / broken** (concierge via chat or `/ground-transport`) |
| Group Charter | `group-charter` | **Blank / broken** |
| NFT Membership | `nft-membership` | **Blank / broken** |

**Buyer action:** implement views, remove tiles, or link to `/chat?query=...` / existing routes.

---

## 7. DISABLED in code (not reachable as intended)

| Feature | Evidence |
|---------|----------|
| Marqeta card dashboard | `activeCategory === 'card'` block **commented out**; nav: “Marqeta integration pending” |
| Hotels main nav | Comment: “DISABLED - LiteAPI hotels temporarily removed” |
| Ground transport main nav | Comment: “Hidden for now” (route `/ground-transport` still works) |
| Events & Sports (`assets`) | Nav hidden “for MVP” — view exists for search-index |
| Stripe Connect partner API | `server.cjs` — partner routes **commented out** |
| Face API vite plugin | Disabled for load time |
| Face login | Edge function exists; client init disabled |

---

## 8. REMOVED from router (this repo)

| URL | Was |
|-----|-----|
| `/crypto-fund` | Local testing page — import and route **removed** |

---

## 9. SEO / legacy REDIRECT routes

These URLs exist for old links and **redirect** (do not show dedicated content):

| URL | Redirects to |
|-----|----------------|
| `/services/*` (subpaths only) | `/aviation` → `/jets` |
| `/aviation`, `/private-jet`, `/private-jet-charter`, `/evtol`, `/evtol-flights`, `/helicopter`, `/helicopter-charter`, `/group-charter`, `/safety` | `/jets` |
| `/yacht` | `/home` |
| `/sphera-ai`, `/helpdesk`, `/contact`, `/privatecharterx-support`, `/support` | `/chat` |
| `/partners-board` | `/partners` |
| `/faq` | `/faqs` |
| `/partner`, `/partner-with-us`, `/news`, `/technology`, `/visa`, `/behind-the-scene`, `/web3/flight-tracker`, `/web3/tracker` | `/home` |
| `/membership`, `/jet-card` | `/subscriptions` |
| `/dashboard`, `/dashboard/*` | Clean URLs without `/dashboard` prefix |
| `/user-overview` | Old `Dashboard` component |

---

## 10. Staff / admin routes

**Full CRM documentation:** [CRM.md](./CRM.md)

| URL | Status | Notes |
|-----|--------|-------|
| **`/crm`** | **LIVE — ADMIN** | **Primary full CRM** — [privatecharterx.com/crm](https://www.privatecharterx.com/crm) (`CRMDashboard`) |
| `/crm-admin` | LIVE — ADMIN | Same CRM as `/crm` |
| `admin.*` host `/admin/*` | ADMIN | Extended back-office (`pages/admin/`, ~43 pages) |
| `/admin` (main site) | ADMIN | Lighter `AdminCRM` gate + dashboard |

---

## 11. Footer / legal URL mismatch (production)

| Link on live site | In React router |
|-------------------|-----------------|
| `/privacy-policy` | `/privacy` only |
| `/impressum` | `/imprint` only |

Fix with **hosting redirects** (Netlify/Vercel) or add matching routes — otherwise 404 or wrong page on direct access.

---

## 12. Mobile / Capacitor

Same routes as web — single SPA in `dist/`. No separate route table.

---

*Last aligned with repo router in `App.tsx` and shell `tokenized-assets-glassmorphic.jsx`. Re-verify after major merges.*
