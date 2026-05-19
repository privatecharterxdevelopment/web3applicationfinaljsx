# PrivateCharterX — full CRM system (included in sale)

**Live CRM:** [https://www.privatecharterx.com/crm](https://www.privatecharterx.com/crm)  
**Alias:** [https://www.privatecharterx.com/crm-admin](https://www.privatecharterx.com/crm-admin) (same app)  
**Platform:** [https://www.privatecharterx.com](https://www.privatecharterx.com)

This is a **full internal CRM / back-office**, not a small admin widget. It is included in the acquisition. This document does not change application code or the live site.

---

## 1. What the buyer gets

| Asset | Included? | Notes |
|-------|-----------|--------|
| **Live CRM** at `/crm` | **Yes** | Staff operations hub — bookings, users, Web3 ops, support |
| **CRM source code** | **Yes** | In this repository (see §3) |
| **Supabase-backed data** | **Yes** | Users, requests, bookings, KYC, tokenization, etc. (project transfers separately) |
| **Additional admin UIs** | **Yes** | `/admin` (lighter gate), `admin.*` subdomain back-office — see §4 |

The CRM is how the business **runs** the platform: empty legs, jet quotes, AI cart requests, subscriptions, SPV/tokenization pipelines, PVCX, live support, invoicing.

---

## 2. Live URLs (for technical review tomorrow)

| URL | Purpose |
|-----|---------|
| [www.privatecharterx.com/crm](https://www.privatecharterx.com/crm) | **Primary full CRM** (`CRMPage` → `CRMDashboard`) |
| [www.privatecharterx.com/crm-admin](https://www.privatecharterx.com/crm-admin) | Same CRM (duplicate route) |
| [www.privatecharterx.com/admin](https://www.privatecharterx.com/admin) | Legacy/simple admin shell (`AdminCRM`) |
| `admin.privatecharterx.com` / `/admin/*` | Extended admin module set (`src/pages/admin/*`, ~43 pages) |

**Access:** CRM requires an authenticated user with **admin** privileges (`is_admin` in Supabase auth metadata and/or `users` table). Seller provides admin test account at handover — do not share production passwords in GitHub.

---

## 3. Main CRM features (`/crm` — CRMDashboard)

Implemented in `src/components/CRMDashboard/index.jsx` (~9,200 lines) and loaded via `src/pages/CRMPage.tsx`.

| Module (sidebar) | What it manages |
|------------------|-----------------|
| **Dashboard** | KPIs, notifications, quick navigation |
| **Customers** | Registered users, profiles, KYC tabs |
| **Customer Activity** | Bookings, requests, AI cart / chat requests |
| **AI Chats** | AI concierge session history |
| **Live Support** | Integrated support desk widget |
| **Invoice Generator** | Quotes / invoices (`QuoteInvoiceModal.jsx`) |
| **Support** | Support tickets |
| **Transactions** | Payment / transaction records |
| **Flight Bids** | Flight bidding pipeline |
| **Jet Quotes** | Private jet quote requests |
| **Inventory** | Empty legs, wines, cigars (catalog ops) |
| **Subscriptions** | Stripe subscription tiers |
| **Card Applications** | PaymentX / card apply queue |
| **SPV Formation** | SPV requests from Web3 flow |
| **Tokenized Assets** | Tokenization drafts / pipeline |
| **PVCX Tokens** | PVCX balances & token movements |

Data is read/written against **Supabase** (production project). Buyer should rotate service keys post-close and remove any legacy client-side admin patterns during hardening (post-acquisition engineering).

---

## 4. Additional CRM codebase in repo

| Path | ~Size | Notes |
|------|-------|--------|
| `src/components/CRM/` | 58+ UI modules, tens of thousands of lines | Sales CRM, accounting, marketing/newsletters, bookings, partners, reports, team chat, calendar, storage, services (jets, empty legs, yachts, etc.) |
| `src/components/CRMDashboard/` | ~9.3k lines | **What powers `/crm` today** |
| `src/contexts/CRM/`, `src/lib/CRM/`, `src/types/CRM/` | Supporting CRM layer | Auth, types, helpers |
| `src/pages/admin/` | ~43 pages | Subdomain / extended admin back-office |

There is also a nested copy under `src/components/Landingpagenew/CRM Privatecharterx/` (historical duplicate). Buyer may consolidate in a refactor; **live `/crm` uses `CRMDashboard`**.

---

## 5. How CRM connects to the rest of the platform

```
Customer on privatecharterx.com
    → books / chats / Web3 requests
        → Supabase tables (user_requests, user_bookings, ai_chat_sessions, …)
            → Staff opens /crm
                → CRMDashboard (fulfil, quote, invoice, support, tokenization ops)
```

Same stack as public site: **React + Supabase**. CRM is not a separate paid SaaS — it is **in-repo, in-product**.

---

## 6. Buyer review checklist (no deploy)

| # | Action | Pass? |
|---|--------|-------|
| 1 | Seller provides **admin login** for `/crm` review | |
| 2 | [www.privatecharterx.com/crm](https://www.privatecharterx.com/crm) loads after auth | |
| 3 | Spot-check: Customers, Customer Activity, AI Chats, Tokenization, SPV | |
| 4 | Confirm Supabase project ownership transfer plan | |
| 5 | Read [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md) + [ROUTES.md](./ROUTES.md) §10 | |

---

## 7. Handover (seller → buyer)

| Item | Notes |
|------|--------|
| Admin user(s) with `is_admin` | Create buyer admin; revoke seller access |
| Supabase service role & RLS review | Security hardening post-close |
| CRM training walkthrough | 1–2h Loom recommended (see [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md)) |
| `admin.*` DNS + hosting | If used in production |

---

## 8. Related docs

| Document | Topic |
|----------|--------|
| [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md) | Full asset list |
| [ROUTES.md](./ROUTES.md) | `/crm`, `/crm-admin`, `/admin` |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Admin subdomain |
| [SUPABASE.md](./SUPABASE.md) | Tables & edge functions |
| [BLOG.md](./BLOG.md) | Blog asset |

---

*Markdown only — does not change www.privatecharterx.com.*
