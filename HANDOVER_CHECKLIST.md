# PrivateCharterX — acquisition handover checklist

Use this when transferring the platform to a buyer. **Completing this list does not require code changes** (except optional hosting redirect config in Vercel/Netlify UI).

---

## Phase A — Before signing

- [ ] Buyer read [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md)
- [ ] Buyer read [BLOG.md](./BLOG.md) — **privatecharterx.blog included in sale**
- [ ] Buyer read [ROUTES.md](./ROUTES.md) (broken tiles acknowledged)
- [ ] Seller completed [ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md) (private copy)
- [ ] Domain ownership documented
- [ ] Stripe / Supabase / Mapbox account owners identified
- [ ] No undisclosed second repo or fork (duplicate `thefinalwebapplicationpcx-main` removed from sale repo)

---

## Phase B — Asset transfer

### GitHub

- [ ] Transfer repo `privatecharterxdevelopment/web3applicationfinaljsx` OR invite buyer as admin
- [ ] Tag release e.g. `v1.0.0-handover` for frozen snapshot
- [ ] Remove seller deploy keys from CI (if any)

### Domain & DNS

- [ ] Registrar account or push access to buyer — **privatecharterx.com**
- [ ] Registrar account or push access to buyer — **privatecharterx.blog** (see [BLOG.md](./BLOG.md))
- [ ] Document DNS records (apex, www, admin subdomain)
- [ ] SSL certificates auto-renew confirmed

### Blog (privatecharterx.blog)

- [ ] CMS / hosting admin access transferred (Blogger, WordPress, or other — seller confirms)
- [ ] Buyer can publish a test post on **www.privatecharterx.blog** (optional)
- [ ] In-app **www.privatecharterx.com/blog** shows posts after transfer (no app deploy required for content-only changes)
- [ ] Google Search Console / blog analytics (if used) transferred

### Hosting (Vercel / Netlify — confirm which)

- [ ] Project ownership transferred
- [ ] Environment variables exported (names + values via secure channel)
- [ ] Confirm **`VITE_MAPBOX_TOKEN`** is set (required before next frontend deploy)
- [ ] Confirm `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Build logs accessible
- [ ] **No deploy during handover day** unless agreed

### Supabase

- [ ] Organization / project ownership transferred
- [ ] Service role key rotated post-transfer
- [ ] Edge function secrets documented
- [ ] Backups / PITR status confirmed
- [ ] Auth redirect URLs include buyer domains
- [ ] Storage buckets listed

### Payments & APIs

- [ ] Stripe account transfer or new account + key swap plan
- [ ] Coingate (if used)
- [ ] Flight API provider account
- [ ] Anthropic / Claude API billing
- [ ] Mapbox account
- [ ] Marqeta (if applicable)
- [ ] Google Cloud (Places/Calendar, if used)

### Mobile (if sold)

- [ ] Apple Developer Program owner
- [ ] Google Play Console owner
- [ ] Capacitor signing certificates

---

## Phase C — Hosting fixes (optional, no app code)

In Vercel/Netlify redirect rules:

- [ ] `/privacy-policy` → `/privacy`
- [ ] `/impressum` → `/imprint`
- [ ] Fix `/sitemap.xml` if 500
- [ ] Review `robots.txt` with SEO

---

## Phase D — Verification smoke test (production)

Test on **www.privatecharterx.com** (current deploy, unchanged):

| # | URL | Pass? |
|---|-----|-------|
| 1 | `/` loads | |
| 2 | `/jets` | |
| 3 | `/empty-legs` | |
| 4 | `/flight-bids` | |
| 5 | `/flights` | |
| 6 | `/chat` (send test message) | |
| 7 | `/ground-transport` map loads | |
| 8 | `/login` | |
| 9 | `/partners` | |
| 10 | Admin login | |
| 11 | [www.privatecharterx.blog](https://www.privatecharterx.blog/) loads | |
| 12 | `/blog` on main site shows posts | |

---

## Phase E — Knowledge transfer

- [ ] 2h recorded walkthrough (Loom/Zoom)
- [ ] Admin panel demo
- [ ] Supabase Dashboard tour
- [ ] How to publish empty leg / flight op (if manual today)
- [ ] Support inbox / `support@privatecharterx.com` transfer
- [ ] How to publish on **privatecharterx.blog** and how feeds sync to `/blog`

---

## Phase F — Security post-transfer

- [ ] Rotate Supabase service role key
- [ ] Rotate Stripe keys
- [ ] Rotate Mapbox token (optional)
- [ ] Remove seller access from all accounts
- [ ] Review admin users in database

---

## Phase G — Buyer sign-off

| Party | Name | Date | Signature |
|-------|------|------|-----------|
| Seller | | | |
| Buyer | | | |

---

## Related documents

- [OPERATIONS.md](./OPERATIONS.md)
- [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md)
- [ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md)

---

*Checklist only — does not modify application.*
