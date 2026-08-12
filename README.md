# ZanTap

Mobile-first social commerce checkout and kitchen display for informal food vendors,
ghost kitchens, and street-food hubs — starting in Kigali, Rwanda.

**Live:** [zantap.app](https://zantap.app)

| Surface | URL |
|---|---|
| Marketing and partner lead capture | [`/`](https://zantap.app) |
| Customer storefront | `/[slug]` — e.g. [`/inka-steakhouse`](https://zantap.app/inka-steakhouse) |
| Vendor KDS | `/vendor/[slug]` — e.g. [`/vendor/inka-steakhouse`](https://zantap.app/vendor/inka-steakhouse) |
| Self-serve onboarding | [`/onboard`](https://zantap.app/onboard) |
| Operator console | [`/ops`](https://zantap.app/ops) |
| Delivery slip | `/slip/[orderId]` |

## Quick start

```bash
npm install
cp .env.example .env   # optional — without DATABASE_URL the in-memory Store is used
npm run db:deploy      # only when DATABASE_URL / DIRECT_URL are set
npm run db:seed        # seeds the demo vendor `inka-steakhouse`
npm run dev
```

Open:

- Storefront: [http://localhost:3000/inka-steakhouse](http://localhost:3000/inka-steakhouse)
- KDS: [http://localhost:3000/vendor/inka-steakhouse](http://localhost:3000/vendor/inka-steakhouse)
- Onboard: [http://localhost:3000/onboard](http://localhost:3000/onboard)

## Checkout / MoMo

| Mode | Env | Behaviour |
|---|---|---|
| `simulate` | `MOMO_MODE=simulate` (local default) | Sandbox STK sheet — PIN **`12345`** succeeds |
| `manual` | unset / `manual` (production default) | Customer dials USSD `*182*8*1*{code}*{amount}#`, then taps **I've paid** |

## Architecture

```
UI (customer storefront · vendor KDS · onboard · ops)
  → Server Actions (lib/actions/*) + RSC reads
  → Store seam (lib/store/) — one interface, two adapters
       ├─ Prisma / Postgres   when DATABASE_URL is set
       └─ in-memory           otherwise (tests / local without a DB)
  → MoMo (lib/momo/) — simulate STK or manual USSD
  → KDS live push — SSE /api/vendor/[slug]/kds-stream (Store-backed)
  → Lead routing — persist first, then concurrency-safe round-robin to one enabled WhatsApp recipient
```

The browser never imports the Store. Customer vs vendor UIs stay separate
routes/components; only the visual language is shared via `DESIGN.md`
(ElevenLabs editorial tokens in `tailwind.config.ts`). KDS/onboarding use the
scoped `.kds-dark` remap.

### Routes

| Route | Purpose |
|---|---|
| `/` | Marketing funnel and durable partner Lead capture |
| `/[slug]` | Customer storefront (editorial / immersive hero) |
| `/vendor/[slug]` | Vendor kitchen display (orders, menu, history, drivers, setup) |
| `/vendor/[slug]/receipt/[orderId]` | Printable order receipt |
| `/onboard` | Self-serve vendor signup (owner token minted once) |
| `/ops` | Operator console (vendors, Leads, recovery, routing settings, audit) |
| `/slip/[orderId]` | Driver delivery slip |
| `/api/momo/stk` | Simulated MoMo STK + PIN |
| `/api/vendor/[slug]/kds-stream` | KDS SSE live snapshot |
| `/api/vendor/[slug]/export` | Order history CSV / XLSX |
| `/api/operator/v1/*` | Operator Control API |

### Key directories

- `components/customer/` — storefront (hero, menu, cart, customize, MoMo sheets)
- `components/vendor/` — KDS (tickets, menu CRUD, history, drivers, setup drawer)
- `components/onboard/` — dark self-serve wizard
- `components/ops/` — operator UI
- `lib/store/` — Store interface + in-memory / Prisma adapters
- `lib/actions/` — Server Actions only (async exports; never re-export types)
- `lib/momo/`, `lib/checkout/`, `lib/kds/`, `lib/vendor/` — domain modules
- `docs/adr/` — architecture decision records
- `DESIGN.md` — UI design system (single source of truth)

## Environment

Copy `.env.example` → `.env`. Important vars:

| Var | Purpose |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres (pooled + session). Unset → in-memory Store |
| `TEST_DATABASE_URL` | Isolated schema for `#prisma` contract tests |
| `SKIP_PRISMA_TESTS` | `1` (default) skips remote Prisma tests; set `0` to opt in |
| `MOMO_MODE` | `simulate` \| `manual` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob menu/branding uploads (local fallback: `/api/local-blob/…`) |
| `NEXT_PUBLIC_BASE_URL` | Public origin for QR / share / WhatsApp links |
| `PROVISION_KILL_SWITCH` | Close public signup (`1`/`true`/`on`) |
| `OPERATOR_API_KEY` / `OPERATOR_UI_SECRET` | Ops Control API + `/ops` login |

Retired (do not set): `PROVISION_SECRET`, `VENDOR_WRITE_SECRET` — replaced by
per-vendor owner tokens (ADR-0022 / ADR-0025).

## Scripts

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint
npm test             # Vitest (Prisma suite skipped unless SKIP_PRISMA_TESTS=0)
npm run db:generate  # prisma generate
npm run db:migrate   # prisma migrate dev
npm run db:deploy    # prisma migrate deploy
npm run db:seed      # seed demo vendor (refuses remote unless SEED_ALLOW_REMOTE=1)
```

## Design & agents

- **UI:** follow `DESIGN.md` — off-white canvas / near-black ink on the storefront;
  `.kds-dark` charcoal + MoMo amber on KDS and onboarding.
- **Agent rules:** `AGENTS.md` + `.cursorrules` (Store seam, anti-YOLO, handoff protocol).
- **Shared continuity:** `docs/agents/codex-cursor-shared-handoff.md` reconciles
  shipped work, local-only work, deployments, and remaining gates across Codex and Cursor.
- **ADRs:** `docs/adr/` (git-tracked decisions).

## Reference assets (repo root)

Prototypes and early product notes (historical; live UI follows `DESIGN.md`):

- `ZanTap.dc.html` — early customer UI reference
- `ZanTap Vendor KDS.dc.html` — early KDS reference
- `zantap.txt` / `zantap-brand-identity.txt` — product / brand notes

## Status / deferred

**Shipped:** Store seam (Prisma + in-memory), manual & simulate MoMo, KDS SSE +
kitchen stages, menu CRUD + Blob gallery, order history/export, self-serve
onboarding + owner-token recovery, drivers + assignment, operator console,
durable marketing Lead capture, and configurable multi-recipient WhatsApp
routing. Lead routing persists every Lead first, assigns one enabled recipient
with concurrency-safe round-robin, records an immutable assignment for Ops, and
returns at most one public `Continue on WhatsApp` action. Production currently
has two recipients configured: one enabled and one temporarily disabled.
The marketing root also ships the six-scene scroll-world preview: two
scroll-scrubbed desktop clips followed by four intentional still crossfades,
with reduced-motion/Save-Data fallbacks. Native partner footage in separate
16:9 and 9:16 chains remains the planned asset replacement.

**Deferred:** vendor/ops auth beyond owner tokens + ops secret (candidate #12),
live MTN MoMo API (manual USSD is the interim), automatic WhatsApp Business API
delivery, and the Android install/standalone/offline acceptance smoke.
