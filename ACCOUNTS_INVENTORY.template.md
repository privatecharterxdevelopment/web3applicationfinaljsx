# PrivateCharterX — accounts inventory (template)

**CONFIDENTIAL — do not commit filled copy with real passwords to public GitHub.**

Copy this file to a password manager or private data room. Fill in during seller handover.

---

## Instructions

1. Duplicate this file outside the repo (e.g. `PrivateCharterX-Accounts-PRIVATE.xlsx`).
2. Seller completes **Owner email** and **Transfer method** before close.
3. Buyer rotates secrets in **Phase F** of [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md).
4. Never store production secrets in git.

---

## Core infrastructure

| Service | Purpose | Login / URL | Owner email | Monthly cost | Transfer method | Rotated? |
|---------|---------|-------------|-------------|--------------|-----------------|----------|
| GitHub org | Source code | github.com/privatecharterxdevelopment | | | Org invite / transfer | |
| Vercel **or** Netlify | Hosting | | | | Team transfer | |
| Domain registrar | privatecharterx.com | | | | Push / auth code | |
| Domain registrar | **privatecharterx.blog** | [www.privatecharterx.blog](https://www.privatecharterx.blog/) | | | Push / auth code | |
| Blog CMS / host | **Blog publishing** (Blogger, WP, etc.) | Seller confirms platform | | | Admin transfer | |
| Supabase | DB, auth, edge, storage | app.supabase.com | | | Org transfer | |

---

## Required for core product

| Service | Purpose | Env var / location | Owner email | Transfer method | Rotated? |
|---------|---------|-------------------|-------------|-----------------|----------|
| Mapbox | Maps, geocoding | `VITE_MAPBOX_TOKEN` | | Account transfer | |
| Anthropic | AI chat | Edge secret / `VITE_*` | | API key handover | |
| Stripe | Payments, subscriptions | Dashboard + webhooks | | Account transfer | |
| Flight API | Commercial flights | Supabase edge secrets | | Contract + keys | |

---

## Optional / feature-specific

| Service | Purpose | Notes | Owner | Transfer | Rotated? |
|---------|---------|-------|-------|----------|----------|
| Coingate | Crypto pay | `server.cjs` / edge | | | |
| Marqeta | Debit cards | Edge functions | | | |
| LiteAPI | Hotels | `liteapi-hotels` edge | | | |
| Hume | Voice AI | `VITE_HUME_*` | | | |
| Google Cloud | Places, Calendar | Console project | | | |
| Auth0 | Legacy wrapper | `VITE_AUTH0_*` | | Still needed? | |
| AWS | SES / Rekognition | Supabase secrets | | | |
| WalletConnect / Reown | Web3 | Project ID in App.tsx | | | |
| Pinata | IPFS | `VITE_PINATA_JWT` | | | |
| Polymesh | Tokenization | Disabled in UI | | | |
| Ticketmaster | Events | Optional API | | | |
| Eventbrite | Events | Optional API | | | |
| Exchange rate API | FX | `VITE_EXCHANGERATE_API_KEY` | | | |

---

## Email & support

| Item | Value |
|------|--------|
| Support email | support@privatecharterx.com |
| From email (transactional) | noreply@www.privatecharterx.com (per `.env.example`) |
| DNS email records (SPF/DKIM) | |

---

## Production environment variable checklist

Host: ☐ Vercel  ☐ Netlify  ☐ Other: ___________

| Variable | Set in production? | Notes |
|----------|-------------------|--------|
| `VITE_SUPABASE_URL` | ☐ | |
| `VITE_SUPABASE_ANON_KEY` | ☐ | |
| `VITE_MAPBOX_TOKEN` | ☐ | **Required before next deploy** |
| `VITE_STRIPE_PUBLIC_KEY` | ☐ | |
| `STRIPE_SECRET_KEY` (server) | ☐ | |
| `STRIPE_WEBHOOK_SECRET` | ☐ | |
| Claude / Anthropic (edge) | ☐ | |
| Flight API (edge) | ☐ | |

---

## Notes

```
(Add handover notes here)
```

---

*Template — not used by running application.*
