# PrivateCharterX — documentation index

All files below are **Markdown documentation only**. They do not change application code, build output, or the live website until you separately commit, push, and deploy.

---

## For buyers

| Document | Read when |
|----------|-----------|
| **[BUYER_START_HERE.md](./BUYER_START_HERE.md)** | **First** — all URLs + review order |
| [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md) | Honesty pack, risks, third parties |
| [WEB3.md](./WEB3.md) | **Web3** — tokenization, NFT membership, `/rws/*`, crypto |
| [GROUND_TRANSPORT.md](./GROUND_TRANSPORT.md) | **Ground transport** — Uber-style + crypto checkout |
| [CRM.md](./CRM.md) | **CRM** — [/crm](https://www.privatecharterx.com/crm) |
| [BLOG.md](./BLOG.md) | **Blog** — [privatecharterx.blog](https://www.privatecharterx.blog/) |
| [ROUTES.md](./ROUTES.md) | Verifying what URLs work vs broken |
| [METRICS.md](./METRICS.md) | Code size and quality signals |
| [README.md](./README.md) | Quick product + stack overview |

---

## For operations & handover

| Document | Read when |
|----------|-----------|
| [OPERATIONS.md](./OPERATIONS.md) | Running production, deploy, env vars |
| [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md) | Acquisition close |
| [ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md) | Listing all third-party accounts (private) |
| [SUPABASE.md](./SUPABASE.md) | Edge functions and database |

---

## For developers

| Document | Read when |
|----------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Shell vs modules vs Supabase |
| [.env.example](./.env.example) | Environment variables |
| `docs/` | Legacy integration notes (Marqeta, Web3 — verify dates) |

---

## What does NOT change the live site

| Action | Safe now? |
|--------|-----------|
| Add/edit any `.md` file in this list | **Yes** |
| Fill accounts template **outside** git | **Yes** |
| Hosting redirects in Vercel UI only | **Yes** (config, not repo) |
| `git push` documentation | **Yes** — site unchanged until **deploy** |
| Edit `src/` or `package.json` | **No** — not part of this doc pack |

---

*PrivateCharterX LLC — proprietary.*
