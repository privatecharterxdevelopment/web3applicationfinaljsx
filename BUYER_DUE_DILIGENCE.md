# PrivateCharterX — buyer due diligence

**Product:** [www.privatecharterx.com](https://www.privatecharterx.com)  
**Blog (included in sale):** [www.privatecharterx.blog](https://www.privatecharterx.blog/)  
**Legal entity:** PrivateCharterX LLC  
**Repository:** [privatecharterxdevelopment/web3applicationfinaljsx](https://github.com/privatecharterxdevelopment/web3applicationfinaljsx)

This document is for **acquisition review**. It does not modify the application. The live site continues to run on the currently deployed build until you deliberately deploy something new.

---

## 1. Executive summary

| Question | Answer |
|----------|--------|
| What is it? | **Web3-ready** luxury platform (tokenization, `/rws/*`, wallets, launchpad, SPV) plus travel marketplace + AI concierge — **and** standalone blog **privatecharterx.blog** (integrated at `/blog`). |
| Is it live? | Yes — [privatecharterx.com](https://www.privatecharterx.com) and [privatecharterx.blog](https://www.privatecharterx.blog/) |
| Is the code “clean”? | **No** — functional but monolithic; see [METRICS.md](./METRICS.md). |
| Is it documented? | **Yes** (this pack + [ROUTES.md](./ROUTES.md) + [ARCHITECTURE.md](./ARCHITECTURE.md)). |
| Biggest technical risk? | ~13k-line UI shell; no automated tests in repo (seller QA on separate repo + Vercel preview). |
| Biggest product risk? | Some `/services` marketing tiles have **no screen** (documented in ROUTES.md). |
| Recommended post-close budget? | Either senior React team + 2–4 month refactor, or accept slower feature velocity. |

**Fair valuation framing:** buy a **working platform + integrations + brand**, not an enterprise codebase.

---

## 2. What is included in a typical sale

| Asset | Included in repo? | Notes |
|-------|-------------------|--------|
| Frontend source (React/Vite) | Yes | |
| Capacitor iOS/Android shells | Yes | Store submission not verified here |
| Supabase migrations + edge functions | Yes | **Production Supabase project transfers separately** |
| Node API (`server.cjs`) | Yes | Newsletter, Coingate, Stripe webhooks |
| SQL setup scripts (root) | Yes | Supplementary |
| Domain `privatecharterx.com` | Negotiate | Not in git |
| **Blog** `privatecharterx.blog` + CMS/content | **Negotiate — included in sale** | Not in git; see **[BLOG.md](./BLOG.md)** |
| Production data (users, bookings) | Negotiate | Not in git |
| Third-party accounts | Negotiate | See [ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md) |
| Marqeta card program approval | Unclear | UI pre-launch; edge functions exist |
| Airline / GDS / flight API contract | External | Via Supabase edge `search-flights` |
| Legal/compliance sign-off | External | |

---

## 3. What works today (verified in code + live nav)

| Capability | URL / area | Confidence |
|------------|------------|------------|
| AI travel concierge | `/chat` | High — large module + `aiTools.js` |
| Private jet search & requests | `/jets` | High — dedicated dashboard component |
| Empty legs + detail booking | `/empty-legs`, `/empty-leg/:id` | High |
| Flight bidding | `/flight-bids` | High — `flight_ops_routes` |
| Commercial flights | `/flights` | Medium — depends on flight API keys |
| Adventures | `/adventures` | High |
| Helicopters | `/helis` | High |
| Ground transport (Mapbox) | `/ground-transport` | High — not in main nav |
| PaymentX marketing + card apply | `/paymentx`, `/pay` | Medium — Marqeta dashboard hidden |
| Subscriptions | Stripe | Medium — tiers in code |
| Partner program | `/partners`, partner dashboard | Medium |
| Blog (in-app) | `/blog` | High — reads **privatecharterx.blog** |
| Blog (standalone asset) | [privatecharterx.blog](https://www.privatecharterx.blog/) | High — **transfers with deal**; see [BLOG.md](./BLOG.md) |
| Web3 / RWA | `/rws/*` | Medium — niche |
| Admin back-office | `admin.*` / `/admin/*` | High |
| Internal CRM | `/crm` | High — staff only |

Full URL list: **[ROUTES.md](./ROUTES.md)**

---

## 4. Known gaps (disclosed — not hidden)

### Broken or incomplete UX

| Issue | Impact |
|-------|--------|
| `/services` tiles: yachts, MEDEVAC, concierge, group-charter, NFT membership | Click → **no dedicated view** |
| Hotels | Route exists; **removed from main nav** (LiteAPI) |
| Marqeta live card dashboard | Code **commented out** |
| `/crypto-fund` | **Removed** from router (was dev-only) |
| Legal footer URLs | Live site may use `/privacy-policy`, `/impressum` — app routes `/privacy`, `/imprint` |

### Technical debt

| Issue | Impact |
|-------|--------|
| Single ~13k-line shell component | Expensive changes, regression risk |
| No automated tests in repo | Regression risk unless CI added; seller uses **separate repo + Vercel preview** for manual QA |
| Auth0 + Supabase dual auth layer | Session edge cases |
| ~742 `console.log` in `src` (approx.) | Noise; minor info leakage |
| Mixed `.ts` / `.jsx` | Weaker typing on critical path |
| Stripe Connect partner API disabled in `server.cjs` | Partner payouts not active via that path |

Details: [METRICS.md](./METRICS.md), [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 5. Third-party dependency map

| Vendor | Role | Required for core travel? |
|--------|------|-------------------------|
| **Supabase** | Auth, DB, storage, edge functions | **Yes** |
| **Mapbox** | Ground transport, geocoding, AI distances | **Yes** for transfers |
| **Anthropic (Claude)** | AI chat | **Yes** for chat product |
| **Stripe** | Subscriptions, payments | **Yes** for paid tiers |
| **Flight API** (via edge) | Commercial flight search/book | For `/flights` only |
| **Vercel / Netlify** | Hosting (typical) | **Yes** for current SPA |
| **Coingate** | Crypto payments | Optional |
| **Wagmi / Reown** | Crypto wallets | Optional (Web3) |
| **Marqeta** | Debit cards | Future / partial |
| **LiteAPI** | Hotels | Optional (UI disabled) |
| **Hume** | Voice AI | Optional |
| **Google Places/Calendar** | Enrichment | Optional |
| **Polymesh** | Security tokens | Disabled in UI (license) |
| **Auth0** | Legacy wrapper in `main.tsx` | Review if still required |

Template to fill: [ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md)

---

## 6. Security & compliance (high level)

- **Not a security audit.** Buyer should run own pentest before handling more PII/payments.
- Client-side Mapbox token is public by design; must be set via `VITE_MAPBOX_TOKEN` (see `.env.example`).
- Supabase RLS expected on user data — verify in Supabase dashboard.
- Sanctions country list exists in ground transport UI — not a substitute for legal compliance program.
- AI disclaimer on site — appropriate; AI can hallucinate prices/availability.

---

## 7. Recommended technical questions for seller

1. Which Supabase project ID is production? Who has org owner?
2. Where is Vercel/Netlify project? Who can deploy?
3. Is `VITE_MAPBOX_TOKEN` set in production hosting?
4. Which flight API provider and contract status?
5. Stripe account legal owner and Connect status?
6. Marqeta: sandbox only or production approval?
7. Any outstanding user/payment disputes?
8. Why Auth0 still in `main.tsx` if Supabase is primary?
9. Last production deploy date and who performed it?
10. Any fork of repo elsewhere (e.g. old duplicate folders)?
11. **Blog:** Who owns `privatecharterx.blog` registrar and CMS? Confirm transfer with domain.
12. Staging repo URL and Vercel preview URL (if not yet provided)?

---

## 8. Post-acquisition roadmap (suggested, no code committed)

**Phase 0 (week 1):** Handover — [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md), rotate secrets, confirm backups.

**Phase 1 (weeks 2–4):** Hosting fixes only — legal URL redirects, sitemap, env audit (no feature code).

**Phase 2 (months 2–3):** Split shell into route pages; add smoke tests for URLs in ROUTES.md.

**Phase 3 (optional):** Marqeta go-live, hotels nav, fix broken service tiles or remove them.

---

## 9. Documentation index

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Overview & quick start |
| [ROUTES.md](./ROUTES.md) | Every URL status |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical structure |
| [OPERATIONS.md](./OPERATIONS.md) | Run & deploy |
| [SUPABASE.md](./SUPABASE.md) | DB & edge functions |
| [METRICS.md](./METRICS.md) | Size & quality signals |
| [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md) | Close checklist |
| [BLOG.md](./BLOG.md) | Blog asset — privatecharterx.blog |
| [ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md) | Accounts spreadsheet template |

---

## 10. Disclaimer

This pack is based on repository inspection and prior live-site checks. It is **not** legal, financial, or security advice. Buyer should verify all claims independently before payment.

*PrivateCharterX LLC — proprietary platform.*
