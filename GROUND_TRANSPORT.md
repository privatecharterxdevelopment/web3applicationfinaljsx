# PrivateCharterX — ground transport (Uber-style + crypto checkout)

**Live URL:** [https://www.privatecharterx.com/ground-transport](https://www.privatecharterx.com/ground-transport)  
**Also:** AI concierge can route users here for transfers (`aiTools.js` — airport transfers, chauffeur, taxi).

Full **Mapbox-based, Uber-style** booking: map pickup/dropoff, route, ETA, vehicle tier, pricing, then **card or crypto checkout**. Included in the sale. Markdown only — does not change the live site.

---

## 1. What the buyer gets

| Feature | Included? |
|---------|-----------|
| Interactive **Mapbox GL** map | Yes |
| Pickup / dropoff **geocoding & autocomplete** | Yes |
| **Route, distance, ETA** (Directions API) | Yes |
| **Vehicle selection** (taxi, concierge, luxury cars) | Yes |
| **Country-based pricing** (CHF, EUR, USD, THB, etc.) | Yes |
| **Scheduled or book-now** | Yes |
| **Stripe card** payment | Yes |
| **Crypto checkout** (BTC, ETH, USDT, USDC) | Yes |
| **PDF / confirmation** generation | Yes |
| Supabase **booking request** creation | Yes |

**Nav note:** Route is **live** but **not in main navigation** (hidden in shell — users open `/ground-transport` directly, via AI, or dashboard aliases). See [ROUTES.md](./ROUTES.md).

---

## 2. User flow (Uber-style)

```
1. Open /ground-transport
2. Set pickup (A) and dropoff (B) on map or search
3. See route line, distance, ETA
4. Choose service: taxi | concierge | luxury-cars
5. Date/time, passengers, notes
6. Select vehicle tier / luxury car
7. Payment modal → Card (Stripe) OR Crypto (BTC/ETH/USDT/USDC)
8. Request saved to Supabase → confirmation / PDF
```

---

## 3. Code locations (for technical review)

| Path | Role |
|------|------|
| `src/components/TaxiConcierge/TaxiConciergeView.jsx` | Main experience (~2,600+ lines) |
| `src/components/TaxiConcierge/PaymentModal.jsx` | **Crypto + card** tabs; default tab `crypto` |
| `src/config/mapbox.ts` | `VITE_MAPBOX_TOKEN` (env — no hardcoded token in source after hygiene pass) |
| `src/services/aiTools.js` | AI directs users to ground transport for transfers |
| `src/components/Landingpagenew/App.tsx` | Route `/ground-transport` |

**Requires in production:** `VITE_MAPBOX_TOKEN` on Vercel/Netlify before next frontend deploy.

---

## 4. Crypto checkout (ground transport)

| Method | Details |
|--------|---------|
| **Bitcoin (BTC)** | Payment modal option |
| **Ethereum (ETH)** | Payment modal option |
| **USDT** | Payment modal option |
| **USDC** | Payment modal option |
| **Card** | Stripe via `PaymentModal` / `@stripe/react-stripe-js` |

Booking payload stores `paymentMethod: 'crypto' | 'card'` and `cryptoCurrency` when applicable (`TaxiConciergeView.jsx`).

**Platform-wide crypto** also via Coingate API + Supabase edge functions and **`/checkout`** Web3 page for wallet/contract flows — see **[WEB3.md](./WEB3.md)**.

---

## 5. Related routes

| URL | Notes |
|-----|--------|
| `/ground-transport` | Primary |
| `/dashboard/ground-transport` | Redirect → `/ground-transport` |
| `/dashboard/transfer` | Redirect → `/ground-transport` |
| `/luxury-cars` | Related listing; luxury mode inside TaxiConcierge |

---

## 6. Buyer review checklist

| # | Action | Pass? |
|---|--------|-------|
| 1 | Open [www.privatecharterx.com/ground-transport](https://www.privatecharterx.com/ground-transport) | |
| 2 | Map loads (Mapbox token set on host) | |
| 3 | Enter A → B, route draws | |
| 4 | Reach payment step — **Crypto** and **Card** tabs visible | |
| 5 | (Optional) Complete test booking in staging | |

---

## 7. Handover

| Item | Notes |
|------|--------|
| Mapbox account + `VITE_MAPBOX_TOKEN` | Required |
| Stripe keys | Card path |
| Coingate (if used for crypto settlement beyond modal) | See [WEB3.md](./WEB3.md) |

---

## 8. Related docs

| File | Topic |
|------|--------|
| [WEB3.md](./WEB3.md) | Wallets, tokenization, platform crypto |
| [ROUTES.md](./ROUTES.md) | URL status |
| [OPERATIONS.md](./OPERATIONS.md) | Env vars |

---

*Markdown only.*
