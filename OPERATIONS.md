# PrivateCharterX — operations guide

**Purpose:** How the live platform is operated. **This file does not change runtime behavior.**

---

## Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Production** | https://www.privatecharterx.com | Live customers |
| **Staging / test** | https://web3applicationfinaljsx-1.vercel.app/ | Vercel preview — QA before production deploy |

Staging uses the **same routes** as production (e.g. `/jets`, `/crm`, `/rws`, `/ground-transport`). Confirm which Supabase project and env vars the staging deployment uses in [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md).

---

## Production URLs

| Surface | URL |
|---------|-----|
| Public site | https://www.privatecharterx.com |
| **CRM (sale asset)** | https://www.privatecharterx.com/crm |
| **Web3 hub** | https://www.privatecharterx.com/rws |
| **Ground transport** | https://www.privatecharterx.com/ground-transport |
| **Blog (sale asset)** | https://www.privatecharterx.blog/ |
| In-app blog reader | https://www.privatecharterx.com/blog |
| Apex (if used) | https://privatecharterx.com |
| Admin (typical) | https://admin.privatecharterx.com |
| Supabase API | Project URL in hosting env (`VITE_SUPABASE_URL`) |

**WEB3.md** · **GROUND_TRANSPORT.md** · **CRM.md** · **BLOG.md** (documentation only; does not change live sites).

---

## CRM admin API (service role)

| Item | Value |
|------|--------|
| Endpoint | `POST /api/crm-admin` |
| Server module | `api/crm-admin.cjs` |
| Browser client | `src/lib/supabaseAdminClient.js` |
| Required env (Vercel, **not** `VITE_`) | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` or `VITE_SUPABASE_URL`, `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` |

**After deploy:** Rotate the Supabase service role key in Dashboard (old key was previously in frontend bundle). Update Vercel env with the new key.

---

## Architecture in production

```
User browser
    → CDN / static host (Vercel or Netlify — confirm in seller handover)
        → SPA (dist/index.html + JS bundle)
        → Supabase (auth, DB, storage, edge functions)
        → Third parties (Mapbox, Claude, Stripe, flight API, …)

Optional parallel path:
    → server.cjs (/api/*, /webhooks/*) on same host or separate Node service
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for code structure.

---

## Hosting (typical setup)

Repo includes both:

| File | Platform |
|------|----------|
| `vercel.json` | Vercel — static build + `server.cjs` routes |
| `netlify.toml` | Netlify — redirects + functions |

**Seller must confirm which host is actually live.** Do not assume from repo alone.

### Build settings (if Vercel)

| Setting | Value |
|---------|--------|
| Build command | `npm run build` or `npm run vercel-build` |
| Output directory | `dist` |
| Install | `npm install` |
| Node version | Match local (18+ recommended) |

### Environment variables (production)

All client vars must be prefixed `VITE_`. Minimum for core product:

| Variable | Required | Used for |
|----------|----------|----------|
| `VITE_SUPABASE_URL` | Yes | Auth, data |
| `VITE_SUPABASE_ANON_KEY` | Yes | Client Supabase |
| `VITE_MAPBOX_TOKEN` | Yes | Maps, ground transport, AI distances |
| `VITE_ANTHROPIC_API_KEY` or edge-only | Yes* | AI chat (*often edge-only) |
| `VITE_STRIPE_PUBLIC_KEY` | If subscriptions | Stripe checkout |

Server-side / edge secrets (Supabase dashboard → Edge Functions secrets, or host env):

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Claude API key (if not only in edge)
- Flight API credentials
- Marqeta keys (if cards enabled)
- AWS keys (face login / email, if used)

Full list: `.env.example` and [ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md)

**Important:** A documentation pass moved Mapbox to **env-only** in source. Before the **next** frontend deploy, confirm `VITE_MAPBOX_TOKEN` is set in hosting. **Current live site is unaffected until you deploy.**

---

## Deploy procedure (when you intentionally update production)

1. Confirm staging build: https://web3applicationfinaljsx-1.vercel.app/
2. Verify env vars on host (especially Mapbox, Supabase).
3. `npm run build` locally or let CI build.
4. Deploy `dist/` + server routes.
5. Smoke test URLs from [ROUTES.md](./ROUTES.md) (top 10).
6. Check Supabase logs for edge function errors.

**Do not deploy** during handover week unless planned.

---

## Supabase operations

| Task | Where |
|------|--------|
| View users / data | Supabase Dashboard → Table Editor |
| Edge function logs | Dashboard → Edge Functions → Logs |
| Run migrations | CLI or Dashboard (87 migration files in repo) |
| Backups | Dashboard → Database → Backups (plan-dependent) |
| Auth settings | Dashboard → Authentication |

Function list: [SUPABASE.md](./SUPABASE.md)

---

## Node API (`server.cjs`)

| Route prefix | Purpose |
|--------------|---------|
| `/api/newsletter/*` | Newsletter subscribe/preferences |
| `/api/coingate/*` | Crypto payments (if enabled) |
| `/webhooks/stripe-subscription` | Stripe subscription events |
| `/health` | Health check |

**Disabled in code:** Stripe Connect partner marketplace routes (commented out).

Run locally: `npm run dev:backend` or `npm start` (port 3000 default).

---

## Admin access

| Method | Notes |
|--------|--------|
| `admin.*` subdomain | Full admin UI (`pages/admin/`) |
| Session flag | `pvcx_admin_authenticated` in sessionStorage (simple auth path) |
| Supabase roles | `useAdminPermissions` hook |

Rotate admin credentials on acquisition.

---

## Monitoring (recommended — not in repo)

These are **suggestions**; implement in hosting dashboard without code changes:

| Monitor | Tool examples |
|---------|----------------|
| Site up | UptimeRobot, Better Stack |
| JS errors | Sentry (requires future code to integrate) |
| Supabase | Built-in logs + alerts |
| Stripe | Dashboard notifications |
| Domain expiry | Registrar alert |

---

## Incident response (lightweight)

| Symptom | First checks |
|---------|----------------|
| Site blank | Hosting build failed? JS error in console? |
| Login broken | Supabase status; Auth redirect URLs |
| Maps empty | `VITE_MAPBOX_TOKEN` on host; Mapbox account billing |
| AI chat down | `claude-chat` edge logs; API key quota |
| Flights search fail | `search-flights` edge logs; API provider status |
| Payments fail | Stripe dashboard; webhook delivery |

---

## Backups & disaster recovery

| Asset | Action |
|-------|--------|
| Supabase DB | Enable PITR/backups per plan; export before major migration |
| Storage buckets | Supabase storage backup policy |
| Git repo | GitHub ownership transfer |
| Env secrets | Password manager export |
| Domain | Registrar transfer lock awareness |

---

## SEO / hosting fixes (no app code)

Can be done in **Vercel/Netlify redirect UI**:

| From | To |
|------|-----|
| `/privacy-policy` | `/privacy` |
| `/impressum` | `/imprint` |

Fix `sitemap.xml` if returning 500 (hosting static file or generator).

Review `public/robots.txt` strategy with SEO advisor.

---

## Support contacts (fill on handover)

| Role | Name | Contact |
|------|------|---------|
| Technical owner | | |
| Supabase org owner | | |
| Domain registrar | | |
| Stripe account owner | | |

---

*Operations doc — does not modify application code.*
