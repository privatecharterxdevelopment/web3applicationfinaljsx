# PrivateCharterX — architecture (one page)

**Repository:** [web3applicationfinaljsx](https://github.com/privatecharterxdevelopment/web3applicationfinaljsx) — PrivateCharterX only.  
**Route list:** see [ROUTES.md](./ROUTES.md).

## High-level diagram

```
                    ┌─────────────────────────────────────┐
                    │  index.html + Vite bundle (dist/)   │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │  main.tsx                           │
                    │  Auth0Provider, QueryClient, Router │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │  Landingpagenew/App.tsx             │
                    │  WagmiProvider, AuthProvider, Routes│
                    └─────────────────┬───────────────────┘
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌──────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│ TokenizedAssets  │    │ Standalone routes    │    │ admin.* subdomain   │
│ Glassmorphic     │    │ (separate components)│    │ pages/admin/*       │
│ (main shell)     │    │                      │    │                     │
└────────┬─────────┘    └──────────────────────┘    └─────────────────────┘
         │                • /checkout
         │                • /empty-leg/:id, /jet/:id, …
         │                • /login, /register
         │                • /payment/success, …
         │
         │  activeCategory + URL sync
         ▼
┌────────────────────────────────────────────────────────────┐
│  Views inside shell (conditional render)                   │
│  chat, jets, empty-legs, flights, ground-transport, …      │
└────────┬───────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│  Feature modules (preferred pattern)                       │
│  PrivateJetSearchDashboard, FlightOpsView, TaxiConcierge,  │
│  AIChat/, FlightSearchDashboard, Hotels/, …                │
└────────┬───────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│  services/*  +  lib/supabase  +  Supabase Edge Functions   │
└────────────────────────────────────────────────────────────┘
```

## The shell pattern (important for buyers)

Almost every public URL (`/jets`, `/helis`, `/services`, …) renders the **same** React route element:

`TokenizedAssetsGlassmorphic` in `tokenized-assets-glassmorphic.jsx`.

Routing works in two layers:

1. **React Router** — matches path → mounts shell.
2. **Inside shell** — `useEffect` maps `location.pathname` → `activeCategory` → conditional JSX (`activeCategory === 'jets'`, etc.).

URLs are also updated via `window.history.pushState` when switching categories from the UI.

**Implication:** The shell is the product’s center of gravity. Refactors should eventually **split** it into route-level page components.

## Standalone routes (outside shell)

These mount their own components and are easier to maintain:

| Path | Component |
|------|-----------|
| `/checkout` | `CheckoutPage` |
| `/book/flight/:offerId` | `FlightBooking` |
| `/book/empty-leg/:id` | `EmptyLegBooking` |
| `/empty-leg/:id` | `EmptyLegDetail` |
| `/jet/:id`, `/helicopter/:id`, … | `*Detail.jsx` |
| `/login`, `/register`, … | Auth pages |
| `/crm`, `/crm-admin` | `CRMPage` |
| `admin.*` / `/admin/*` | `pages/admin/*` |

## AI system

| Piece | Role |
|-------|------|
| `AIChat/AIChat.jsx` | Chat UI, voice hooks, subscription limits |
| `services/aiTools.js` | Claude tool definitions + DB/API calls |
| `services/claudeEdgeService.js` | Server-side Claude proxy |
| Supabase `claude-chat` | Edge function execution |

Tools can search jets, empty legs, hotels, transfers (Mapbox), commercial flights, etc., and create `user_requests`.

## Ground transport (Mapbox)

| Piece | Role |
|-------|------|
| `TaxiConcierge/TaxiConciergeView.jsx` | Full-screen map, route, pricing, booking |
| `src/config/mapbox.ts` | `getMapboxToken()` from `VITE_MAPBOX_TOKEN` |
| `services/mapboxService.ts` | Static maps & itinerary (travel planner) |

## Supabase

- **Client:** `lib/supabase.ts` — browser anon key.
- **Migrations:** `supabase/migrations/` — schema, RLS.
- **Edge functions:** `supabase/functions/` — email, flights, Claude, Stripe, Marqeta, etc.
- **Storage:** images, videos, PDFs (public URLs in UI).

Admin and partner flows read/write the same database with role-based RLS and admin UI.

## Web3 / RWS

- **Routes:** `/rws/*` (marketplace, tokenization, launchpad, NFT, SPV).
- **Wallet:** Reown AppKit + Wagmi in `App.tsx`.
- **Data:** Supabase tables (`launchpad_projects`, tokenization, etc.) + on-chain reads where wired.

Polymesh marketplace pages exist in repo but are **disabled** in imports (no license).

## Node server (`server.cjs`)

Not part of the Vite bundle. Handles:

- Newsletter API
- Coingate
- Stripe subscription webhooks

Stripe Connect partner marketplace routes are **commented out** in `server.cjs`.

## Mobile

Capacitor wraps `dist/` — same SPA as web. No separate native UI layer.

## Build & quality tooling

| Tool | Scope |
|------|--------|
| TypeScript `strict` | `.ts` / `.tsx` via `tsc` in build |
| ESLint flat config | `.ts`, `.tsx`, `.js`, `.jsx` |
| Tests | None in repo today |

## Recommended refactor order (post-acquisition)

1. Extract one page per route from the shell (`JetsPage`, `EmptyLegsPage`, …).
2. `React.lazy` per route to shrink initial bundle.
3. Single auth provider (Supabase **or** Auth0).
4. Centralize Mapbox and API config under `src/config/`.
5. Add smoke tests for live URLs listed in README.
