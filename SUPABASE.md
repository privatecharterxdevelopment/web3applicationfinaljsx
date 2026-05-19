# PrivateCharterX — Supabase reference

**Purpose:** Inventory of backend assets in repo. **Read-only documentation** — does not run migrations or change production.

Production project credentials are **not** stored in this file.

---

## Overview

| Item | Count (repo) |
|------|----------------|
| SQL migrations | 87 files in `supabase/migrations/` |
| Edge functions | 38 deployed from `supabase/functions/` |
| Root SQL scripts | `COMPLETE_SETUP.sql`, `LAUNCHPAD_DATABASE_SCHEMA.sql`, etc. |

The live database may have additional objects applied manually — compare Dashboard schema to migrations on handover.

---

## Edge functions index

| Function | Typical purpose |
|----------|-----------------|
| `ai-chat-report-notifications` | Notify on AI chat reports |
| `booking-confirmation-email` | Booking confirmation emails |
| `booking-email-notifications` | Booking-related email triggers |
| `chat-support-notifications` | Support chat notifications |
| `claude-chat` | **AI chat** — Claude proxy (keeps API key server-side) |
| `co2-certificate-notifications` | CO₂ certificate emails |
| `coingate-webhook` | Coingate payment webhooks |
| `contact-form-notifications` | Contact form emails |
| `create-coingate-payment` | Create Coingate payment |
| `create-flight-order` | **Commercial flight** booking order |
| `create-stripe-checkout` | Stripe checkout session |
| `create-stripe-portal` | Stripe customer portal |
| `face-login` | Face ID → Supabase session (optional feature) |
| `fetch-blog-posts` | Blog content |
| `generate-signed-urls` | Signed storage URLs |
| `get-exchange-rates` | Currency conversion |
| `get-flight-services` | Flight ancillaries / services |
| `get-seat-map` | Seat map for commercial flights |
| `google-calendar-auth` | Google Calendar OAuth |
| `google-places` | Places API proxy |
| `liteapi-hotels` | **Hotel search** (LiteAPI) |
| `marqeta-card-status` | Card freeze/unfreeze |
| `marqeta-create-card` | Issue card |
| `marqeta-get-balance` | Card balance |
| `marqeta-topup` | Fund card |
| `marqeta-webhook` | Marqeta events |
| `process-scheduled-reminders` | Scheduled jobs / reminders |
| `register-with-verification` | User registration + verify |
| `request-password-reset` | Password reset flow |
| `resend-confirmation` | Resend email confirmation |
| `search-flights` | **Flight search** (external API) |
| `send-request-email` | User request emails |
| `send-subscription-email` | Subscription emails |
| `subscription-receipt-email` | Receipt emails |
| `update-user-password` | Password update |
| `user-request-notifications` | Notify on new user requests |
| `verify-email` | Email verification |
| `verify-subscription-session` | Post-checkout subscription verify |

Functions with README in repo: `face-login`, `fetch-blog-posts`, `booking-email-notifications`.

---

## Core tables (conceptual — verify in Dashboard)

Exact schema is in migrations. Conceptual domains:

| Domain | Examples |
|--------|----------|
| Users & profiles | Auth users, profiles, KYC, subscriptions |
| Travel requests | `user_requests`, booking requests |
| Aviation | Empty legs, jets, helicopters, `flight_ops_routes`, bids |
| Partners | `partner_services`, partner bookings |
| Commerce | Transactions, card applications |
| Web3 | Launchpad projects, tokenization, SPV |
| Content | Blog, fixed offers / adventures |
| Support | Chat messages, notifications |

**Buyer action:** Export ERD screenshot from Supabase Studio → add to data room.

---

## Row Level Security (RLS)

- Migrations include RLS policies (see `supabase/migrations/*rls*` files).
- Admin bypass typically via service role or admin role flags.
- **Verify** policies in Dashboard before go-live on new environment.

---

## Storage buckets

Public assets referenced in UI often use Supabase storage URLs (`auth.privatecharterx.com/storage/...` or project-specific host).

Inventory buckets in Dashboard on handover.

---

## Local development (Supabase CLI)

Does not affect production:

```bash
# Optional — link to project after handover
supabase link --project-ref YOUR_REF
supabase db pull
supabase functions serve
```

---

## Handover checklist (Supabase-specific)

- [ ] Org owner transferred or new org invited
- [ ] Service role key rotated
- [ ] Anon key documented in hosting env
- [ ] Edge function secrets exported to buyer password manager
- [ ] Backup / PITR enabled
- [ ] Auth redirect URLs include production domain
- [ ] Email templates / SMTP (AWS SES per `.env.example` notes) documented

---

*See also [OPERATIONS.md](./OPERATIONS.md) and [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md).*
