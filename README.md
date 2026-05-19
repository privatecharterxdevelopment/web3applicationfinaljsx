# PrivateCharterX — platform repository

**Product:** [www.privatecharterx.com](https://www.privatecharterx.com)  
**Blog (included in sale):** [www.privatecharterx.blog](https://www.privatecharterx.blog/)  
**Company:** PrivateCharterX LLC  
**GitHub:** [privatecharterxdevelopment/web3applicationfinaljsx](https://github.com/privatecharterxdevelopment/web3applicationfinaljsx)

This repository is **only** the PrivateCharterX web application. It is not related to any other project or workspace folder name on your computer.

---

## For buyers (60-second summary)

| | |
|--|--|
| **What you get** | **Web3/RWA** (tokenization, NFT membership, launchpad, SPV, PVCX, crypto checkout) · **full CRM** [/crm](https://www.privatecharterx.com/crm) · **ground transport** (Mapbox Uber-style + **crypto pay**) [/ground-transport](https://www.privatecharterx.com/ground-transport) · AI luxury concierge · blog [privatecharterx.blog](https://www.privatecharterx.blog/) |
| **Stack** | React + Vite, Supabase (auth/DB/edge functions), Stripe, Mapbox, Claude AI, optional Wagmi/crypto, Capacitor mobile shells. |
| **Maturity** | Core travel flows work; several marketing tiles and legacy URLs are incomplete or redirect-only (see **[ROUTES.md](./ROUTES.md)**). |
| **Code health** | Feature-rich; main UI is a ~13k-line shell — budget for refactor or ongoing senior frontend capacity. |
| **Tests** | No automated test suite in repo; seller QA on separate repo + Vercel preview (details in [BLOG.md](./BLOG.md) §5 / handover). |
| **Deploy** | Vercel/Netlify-style static build + `server.cjs` API; secrets in `.env.example`. |

**Honest value:** strong prototype-to-production platform and integrations, not a fully polished enterprise codebase.

---

## Documentation index

**Full list:** [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

| Document | Audience | Contents |
|----------|----------|----------|
| **[BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md)** | **Buyers** | **Start here** — honest sale pack |
| **[WEB3.md](./WEB3.md)** | **Buyers** | Web3, NFT membership, tokenization, `/rws/*`, crypto |
| **[GROUND_TRANSPORT.md](./GROUND_TRANSPORT.md)** | **Buyers** | Uber-style Mapbox + crypto/card checkout |
| **[CRM.md](./CRM.md)** | **Buyers** | **Full CRM** — privatecharterx.com/crm included in sale |
| **[BLOG.md](./BLOG.md)** | **Buyers** | **Blog asset** — privatecharterx.blog included in sale |
| **[ROUTES.md](./ROUTES.md)** | Buyers + QA | Every URL: live, hidden, broken, redirects |
| **[METRICS.md](./METRICS.md)** | Buyers | Code size, quality signals, no tests |
| **[OPERATIONS.md](./OPERATIONS.md)** | Ops / buyer IT | Deploy, env, Supabase, incidents |
| **[HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md)** | Closing | Transfer checklist |
| **[ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md)** | Private | Third-party accounts (fill offline) |
| **[SUPABASE.md](./SUPABASE.md)** | Technical | 38 edge functions + migrations |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Developers | Shell vs modules |
| **README.md** | Everyone | This overview |
| **`.env.example`** | DevOps | Environment variables |
| **`docs/`** | Integrations | Marqeta, Web3 (verify vs production) |

> **These are `.md` files only.** Adding or editing them does **not** change www.privatecharterx.com until you deploy new application code.

---

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18, Vite 5, TypeScript + JavaScript (mixed) |
| Routing | React Router 6 (SPA) |
| Auth | Supabase Auth (primary); Auth0 wrapper still in `main.tsx` |
| Database / API | Supabase (Postgres, RLS, 40+ edge functions) |
| Maps | Mapbox GL + Geocoding + Directions (`VITE_MAPBOX_TOKEN`) |
| AI | Anthropic Claude (`aiTools.js` + edge functions) |
| Payments | Stripe, Coingate (crypto) |
| Web3 | Wagmi, Reown AppKit (Base + Ethereum) |
| Mobile | Capacitor 7 (`ios/`, `android/`) |
| Node API | `server.cjs` (newsletter, Coingate, Stripe webhooks) |

---

## Quick start (local)

```bash
npm install
cp .env.example .env
# Required for maps: VITE_MAPBOX_TOKEN=pk....
# Required for app: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

- App: `http://localhost:5178`
- Optional API: `npm run dev:backend` → port 3000

```bash
npm run build
npm run preview
npm run lint
```

---

## Deploy (only when you intend to update production)

1. Set **all** variables from `.env.example` on the host (Vercel/Netlify).
2. **`VITE_MAPBOX_TOKEN` is mandatory** after the env-only Mapbox refactor (no tokens in source).
3. Build: `npm run build` → output `dist/`
4. Confirm Supabase, Stripe, and flight API projects match production.

Editing README or ROUTES does **not** change the live site until you deploy a new build.

---

## Route status (summary)

Full tables: **[ROUTES.md](./ROUTES.md)**

### Live in main navigation

`/`, `/services`, `/jets`, `/helis`, `/empty-legs`, `/flight-bids`, `/adventures`, `/flights`, `/paymentx`, `/blog`, `/partners`, `/chat`

### Built and working but not in main nav

`/ground-transport` (Mapbox chauffeur), `/hotels` (UI exists; nav disabled), `/rws/*` (Web3), logged-in areas (`/profile`, `/subscriptions`, …)

### Broken UX — marketing clicks with no screen

On **`/services`**, these cards call `setActiveCategory(...)` but **no view exists** (user sees empty/wrong content):

| Card | Internal category | Status |
|------|-------------------|--------|
| Yacht Charter | `yachts` | **No view** — use AI chat or `/yacht` redirect only |
| MEDEVAC | `medevac` | **No view** — CRM admin only |
| Concierge | `concierge` | **No view** — use `/ground-transport` or AI chat |
| Group Charter | `group-charter` | **No view** — `/group-charter` URL redirects to `/jets` |
| NFT Membership | `nft-membership` | **No view** — wallet NFT checks on bookings only |

### Removed from router (this repo)

| URL | Note |
|-----|------|
| `/crypto-fund` | Dev-only page; route removed |

### Legal URL note (live site vs code)

| Live footer | Code route | Action for buyer |
|-------------|------------|------------------|
| `/privacy-policy` | `/privacy` | Add hosting redirect or alias |
| `/impressum` | `/imprint` | Add hosting redirect or alias |

---

## What transfers in a sale

Included in repo: frontend, admin UI, Supabase migrations/functions, `server.cjs`, Capacitor projects, SQL/docs.

**Not in repo (negotiate separately):** production Supabase project, domain, Stripe/Marqeta/Mapbox/Claude accounts, flight API contract, user data, legal/compliance sign-off.

---

## Repository layout

```
src/
  main.tsx
  components/Landingpagenew/
    App.tsx                              # Route table
    tokenized-assets-glassmorphic.jsx    # Main shell (~13k lines)
  components/TaxiConcierge/              # Mapbox ground transport
  components/PrivateJetSearchDashboard.tsx
  components/FlightOpsView.tsx
  components/Landingpagenew/AIChat/      # AI concierge
  pages/admin/                           # admin.* subdomain
supabase/                                # DB + edge functions
server.cjs
```

Removed from repo: duplicate folder `thefinalwebapplicationpcx-main/` (was not part of build).

---

## License

Proprietary — PrivateCharterX LLC.
