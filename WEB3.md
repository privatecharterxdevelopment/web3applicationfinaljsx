# PrivateCharterX — Web3 / RWA platform (included in sale)

**Platform:** [https://www.privatecharterx.com](https://www.privatecharterx.com)  
**Web3 hub (live, not in main nav):** [https://www.privatecharterx.com/rws](https://www.privatecharterx.com/rws)

The product is **blockchain-ready**: wallets, tokenization, NFT membership benefits, launchpad, SPV formation, PVCX utility token, and on-chain checkout flows. Markdown only — does not change the live site.

---

## 1. What the buyer gets (Web3 layer)

| Capability | Live URL (direct link) | In repo |
|------------|------------------------|---------|
| **Web3 hub** | [/rws](https://www.privatecharterx.com/rws) | `tokenized-assets-glassmorphic.jsx` |
| **Asset tokenization** | [/rws/tokenization](https://www.privatecharterx.com/rws/tokenization) | `TokenizeAssetFlow`, CRM tokenization module |
| **Tokenize asset wizard** | [/rws/tokenize-asset](https://www.privatecharterx.com/rws/tokenize-asset) | |
| **RWA marketplace** | [/rws/marketplace](https://www.privatecharterx.com/rws/marketplace) | |
| **NFT marketplace** | [/rws/nft-marketplace](https://www.privatecharterx.com/rws/nft-marketplace) | `NFTMarketplace` |
| **Launchpad** | [/rws/launchpad](https://www.privatecharterx.com/rws/launchpad) | Presales / projects |
| **PVCX token** | [/rws/pvcx-token](https://www.privatecharterx.com/rws/pvcx-token) | `PVCXTokenView` |
| **SPV formation** | [/rws/spv-formation](https://www.privatecharterx.com/rws/spv-formation) | CRM + user requests |
| **My tokenized assets / SPVs** | [/rws/my-tokenized-assets](https://www.privatecharterx.com/rws/my-spvs) | |
| **On-chain checkout** | [/checkout?id=…](https://www.privatecharterx.com/checkout) | `CheckoutPage.tsx` — wallet + smart contract mint |
| **Token swap** | [/tokenswap](https://www.privatecharterx.com/tokenswap) | `TokenSwapPage` |

**Stack:** Wagmi, Reown AppKit (WalletConnect),/ethers, Base + Ethereum (see `App.tsx` providers).

**Legacy redirects** still work: `/web3`, `/tokenized`, `/rwa/*`, `/spv/*`, `/nft`, `/dao`, `/crypto`, `/marketplace` → `/rws/*` (see [ROUTES.md](./ROUTES.md) §4).

---

## 2. NFT membership

| Item | Status |
|------|--------|
| **Wallet NFT checks** | **Live** — `NFTContext`, `useNFT`, discounts on bookings (`hasNFT`, `nftDiscount`, `NFTBenefitsModal`) |
| **Membership card UI** | **Live** — `MembershipCard`, welcome PVCX bonus messaging in product copy |
| **NFT marketplace** | **Live** at `/rws/nft-marketplace` |
| **`/services` tile “NFT Membership”** | **Broken tile** — no dedicated shell view; use `/rws/nft-marketplace`, wallet connect, or AI chat (disclosed in ROUTES.md) |

NFT membership is a **platform feature** (wallet + benefits + marketplace), not only a marketing card.

---

## 3. Tokenization & RWA

| Feature | Description |
|---------|-------------|
| **Tokenization flows** | Users submit real-world assets for fractional tokenization; drafts visible in **CRM** (`Tokenized Assets`, `SPV Formation`) |
| **RWA marketplace** | Browse/trade tokenized aviation & luxury assets (UI under `/rws`) |
| **Launchpad** | Project presales, vesting, KYC-gated participation (product copy + routes) |
| **SPV** | SPV formation wizard + CRM pipeline |
| **PVCX** | Utility token view, balances tracked in CRM (`PVCX Tokens`) |
| **CO₂ certificates** | NFT-style certificates (`/co2-certificates`, `/co2-certificate/:id`) |

**Disabled / MVP-hidden in code (disclose):** Polymesh marketplace (license), some P2P/DAO/escrow UI — see [ROUTES.md](./ROUTES.md) §4.

---

## 4. Crypto payments (platform-wide)

| Path | Role |
|------|------|
| **Coingate** | `server.cjs` `/api/coingate/*`, Supabase `create-coingate-payment`, `coingate-webhook` |
| **Ground transport** | BTC, ETH, USDT, USDC + card in `TaxiConcierge/PaymentModal.jsx` — see **[GROUND_TRANSPORT.md](./GROUND_TRANSPORT.md)** |
| **Checkout page** | Wallet connect + contract `mintBookingNFT` — [GROUND_TRANSPORT.md](./GROUND_TRANSPORT.md) + `/checkout` |
| **Stripe** | Fiat parallel path for subscriptions and card pay |

---

## 5. CRM + Web3 operations

Staff manage Web3 pipeline in the **full CRM**: [privatecharterx.com/crm](https://www.privatecharterx.com/crm)

- SPV formation queue  
- Tokenization drafts  
- PVCX balances / movements  
- Card applications, subscriptions  

See **[CRM.md](./CRM.md)**.

---

## 6. Staging environment

**https://web3applicationfinaljsx-1.vercel.app/rws** (and other `/rws/*` paths on the same host)

---

## 7. Buyer review checklist

| # | URL | Pass? |
|---|-----|-------|
| 1 | [/rws](https://www.privatecharterx.com/rws) | |
| 2 | [/rws/tokenization](https://www.privatecharterx.com/rws/tokenization) | |
| 3 | [/rws/nft-marketplace](https://www.privatecharterx.com/rws/nft-marketplace) | |
| 4 | [/rws/launchpad](https://www.privatecharterx.com/rws/launchpad) | |
| 5 | [/rws/pvcx-token](https://www.privatecharterx.com/rws/pvcx-token) | |
| 6 | Connect wallet (Reown) on Web3 pages | |
| 7 | [/crm](https://www.privatecharterx.com/crm) — tokenization / SPV / PVCX tabs (admin login) | |

---

## 8. Handover

| Item | Notes |
|------|--------|
| Reown / WalletConnect project | Domains, project ID |
| Smart contract addresses | Checkout + any deployed tokens — buyer verifies on-chain |
| Coingate merchant | API keys, webhooks |
| Supabase Web3 tables & edge functions | See [SUPABASE.md](./SUPABASE.md) |

---

## 9. Related docs

| File | Topic |
|------|--------|
| [ROUTES.md](./ROUTES.md) | All `/rws/*` URLs |
| [GROUND_TRANSPORT.md](./GROUND_TRANSPORT.md) | Mapbox Uber-style + crypto pay |
| [CRM.md](./CRM.md) | Ops back-office |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Wagmi / shell structure |

---

*Markdown only.*
