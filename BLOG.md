# PrivateCharterX — blog asset (included in sale)

**Live blog:** [https://www.privatecharterx.blog/](https://www.privatecharterx.blog/)  
**Main platform:** [https://www.privatecharterx.com](https://www.privatecharterx.com) (in-app reader at `/blog`)

This document describes the **blog as a transferrable asset**. It does not modify the live site or application code.

---

## 1. What the buyer gets

| Asset | Included? | Notes |
|-------|-----------|--------|
| **Domain & site** `privatecharterx.blog` | **Yes — negotiate transfer** | Separate from `privatecharterx.com`; not stored in git |
| **Published content** (posts, SEO, categories) | **Yes** | Lives on blog host; e.g. Web3/travel editorial |
| **CMS / publishing access** | **Yes — negotiate** | Seller provides admin login (Blogger, WordPress, or other — confirm in handover) |
| **Integration code in this repo** | **Yes** | Fetches and displays posts inside the SPA |

The blog is **not** optional marketing — it is wired into the product (content + SEO + in-app `/blog`).

---

## 2. How the blog connects to the platform

```
www.privatecharterx.blog  (content source)
        │
        ├── RSS / JSON feeds  ──► Supabase Edge Function `fetch-blog-posts`
        │                         (server-side fetch; avoids browser CORS)
        │
        ├── REST (WordPress-style) ──► In-app blog UI (`/blog`, post detail)
        │
        └── Cached copies ──► Supabase tables (community/blog posts — see SQL migrations)
                │
                ▼
        www.privatecharterx.com/blog  (in-app reader)
```

**Key code locations (for technical review only — do not edit for handover):**

| File | Role |
|------|------|
| `src/services/blogService.js` | Client blog fetch + Web3 category |
| `supabase/functions/fetch-blog-posts/` | Edge function + README |
| `src/components/Landingpagenew/BlogPostDetail.jsx` | Post detail in shell |
| `database/create_community_tables.sql` | Optional cached posts in DB |

Example external URLs referenced in code:

- Blog home: `https://www.privatecharterx.blog/`
- Web3 category (example): `https://www.privatecharterx.blog/category/web3/`
- RSS (example): `https://www.privatecharterx.blog/feeds/posts/default/-/web3?alt=json`

---

## 3. Buyer review checklist (no deploy required)

| # | Action | Pass? |
|---|--------|-------|
| 1 | Open [www.privatecharterx.blog](https://www.privatecharterx.blog/) — site loads, recent posts visible | |
| 2 | Open [www.privatecharterx.com/blog](https://www.privatecharterx.com/blog) — in-app blog loads | |
| 3 | Open a post on `.blog` and confirm title/URL pattern matches in-app links | |
| 4 | Seller confirms **domain registrar** and **CMS admin** transfer | |
| 5 | Seller confirms whether Supabase caches posts or live-fetch only | |

---

## 4. Handover items (seller → buyer)

| Item | Transfer method |
|------|-----------------|
| Domain `privatecharterx.blog` | Registrar push / auth code |
| DNS for blog (if separate from main site) | DNS export |
| Blog CMS admin account | New owner invite or credential handover via secure channel |
| Any CDN / SSL on blog host | Dashboard transfer |
| Google Search Console / Analytics (if used) | Property transfer |

See also: [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md) (Blog section) and [ACCOUNTS_INVENTORY.template.md](./ACCOUNTS_INVENTORY.template.md).

---

## 5. Staging & QA (seller process)

Application changes are tested on **Vercel staging** before production:

**https://web3applicationfinaljsx-1.vercel.app/**

(same routes as production, e.g. `/blog`, `/jets`, `/crm`)

Blog **content** is typically published directly on `privatecharterx.blog` (no app deploy required for new posts). In-app `/blog` on staging/production will show new posts once feeds/APIs resolve.

---

## 6. Related documentation

| Document | Topic |
|----------|--------|
| [BUYER_DUE_DILIGENCE.md](./BUYER_DUE_DILIGENCE.md) | Full asset list |
| [ROUTES.md](./ROUTES.md) | `/blog` route status |
| [SUPABASE.md](./SUPABASE.md) | `fetch-blog-posts` edge function |

---

*Markdown only — does not change www.privatecharterx.com or www.privatecharterx.blog.*
