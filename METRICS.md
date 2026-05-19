# PrivateCharterX — codebase metrics

**Purpose:** Objective size and quality signals for buyers. Generated from repository inspection; **does not modify code or production.**

*Snapshot basis: local clone of `web3applicationfinaljsx`. Re-run commands after major changes.*

---

## Repository scale

| Metric | Value |
|--------|------:|
| Source files (`.ts`, `.tsx`, `.js`, `.jsx` in `src/`) | ~619 |
| TypeScript (`.ts` + `.tsx`) | ~410 files |
| JavaScript (`.js` + `.jsx`) | ~208 files |
| Supabase migrations | 87 |
| Supabase edge functions | 38 |
| Automated test files | **0** |
| Root `README.md` (before doc pack) | Was missing — now present |

---

## Largest files (maintainability hotspots)

| File | Lines (approx.) | Role |
|------|----------------:|------|
| `tokenized-assets-glassmorphic.jsx` | 12,918 | Main UI shell — all public “pages” |
| `AIChat/AIChat.jsx` | 10,448 | AI concierge UI |
| `Dashboard.tsx` | 6,038 | User dashboard |
| `services/aiTools.js` | 5,061 | Claude tool implementations |
| **Top 4 total** | **~34,465** | Majority of app logic |

Well-isolated modules (examples): `PrivateJetSearchDashboard.tsx` (~1,604), `TaxiConciergeView.jsx` (~2,687), `FlightOpsView.tsx` (~354).

---

## Quality signals (static, approximate)

| Signal | Approx. count | Interpretation |
|--------|---------------|----------------|
| `console.log` in `src/` | ~742 | Debug noise; strip in production ideally |
| `any` / `@ts-ignore` / `as any` | ~813 | Weak typing pressure |
| Block comments `/**` | ~589 | Some service docs; shell under-documented |
| `TODO` / `FIXME` in `src/` | ~11 | Low formal TODO tracking |
| Comments mentioning removed/disabled/hidden | ~1,175 | High dead-code archaeology |

---

## ESLint & TypeScript

| Tool | Scope |
|------|--------|
| `tsconfig.app.json` | `strict: true` for TS |
| `eslint.config.js` | `.ts`, `.tsx`, `.js`, `.jsx` (after doc-pack update) |
| `npm run lint` | May report many warnings on first run — fix not required for sale |

**Note:** Largest files are `.jsx` — strict TypeScript does not fully cover the critical path.

---

## Dependencies

| Item | Notes |
|------|--------|
| `package.json` dependencies | 80+ production packages |
| Key stacks | React 18, Vite 5, Supabase, Wagmi, Mapbox, Stripe, Anthropic SDK, Capacitor |

**Buyer action:** Run `npm audit` after `npm install` and save PDF to data room. Exit code **1** is normal when vulnerabilities exist (not a failed install). Vulnerabilities should be triaged post-acquisition (may require dependency updates = code change). Example findings in a fresh audit include moderate AWS SDK advisories, Clerk critical advisories (check if Auth0/Clerk paths are still used), and Web3/wagmi transitive issues.

---

## Git

| Item | Value |
|------|--------|
| Commits in shallow clone | May show `1` if `--depth 1` clone |
| Last known commit message (example) | `fix: Prevent browsers from auto-translating page content` |

Use full clone for accurate history: `git log --oneline | head -20`

---

## Build

| Command | Output |
|---------|--------|
| `npm run build` | `dist/` static assets |
| Memory | Build uses raised Node heap in script (`4096` MB) — large bundle |

Bundle analysis (optional, local only): `npx vite-bundle-visualizer` — does not affect production until deploy.

---

## Documentation coverage (after doc pack)

| Document | Status |
|----------|--------|
| README.md | Yes |
| ROUTES.md | Yes — full URL inventory |
| ARCHITECTURE.md | Yes |
| BUYER_DUE_DILIGENCE.md | Yes |
| OPERATIONS.md | Yes |
| SUPABASE.md | Yes |
| HANDOVER_CHECKLIST.md | Yes |
| ACCOUNTS_INVENTORY.template.md | Template only |

---

## Honest quality scorecard

| Criterion | Score | Notes |
|-----------|------:|-------|
| Feature completeness | 7/10 | Broad vertical integration |
| Code structure | 4/10 | Monolith shell |
| Type safety | 5/10 | TS + large JSX |
| Tests | 0/10 | None |
| Documentation (now) | 7/10 | Buyer pack |
| Security hygiene | 5/10 | Env keys; no audit |
| **Overall engineering** | **4.5/10** | Works; not clean |

---

## Reproduce metrics locally (read-only)

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | wc -l
wc -l src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx
grep -r "console\.log" src | wc -l
find supabase/functions -name "index.ts" | wc -l
find supabase/migrations -name "*.sql" | wc -l
```

---

*Metrics document — no runtime impact.*
