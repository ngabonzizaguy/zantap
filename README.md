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
| Private stakeholder briefing | [`/briefing`](https://zantap.app/briefing) |
| Vendor menu intake | [`/menu-intake`](https://zantap.app/menu-intake) |
| Customer restaurant hub | [`/restaurants`](https://zantap.app/restaurants) |

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
| `openapi` | `MOMO_MODE=openapi` | MTN MoMo Open API Collection + Vendor payout (local only, awaiting owner approval for production cutover) |

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
| `/vendor/[slug]` | Vendor kitchen display (orders, menu, history, drivers, setup, profit, stock) |
| `/vendor/[slug]/receipt/[orderId]` | Printable order receipt |
| `/onboard` | Self-serve vendor signup (owner token minted once, gate-free) |
| `/ops` | Operator console (vendors, Leads, recovery, routing settings, audit, translations, briefing, menu intake) |
| `/slip/[orderId]` | Driver delivery slip |
| `/briefing` | Private stakeholder presentation (recipient-specific access grants) |
| `/menu-intake` | Vendor menu intake (self-build or assisted, staged catalog data) |
| `/restaurants` | Customer restaurant hub (PWA install, saved restaurants, updates) |
| `/api/momo/stk` | Simulated MoMo STK + PIN |
| `/api/momo/collection` | MoMo Open API Collection (local only) |
| `/api/momo/webhook` | MoMo Open API webhook (local only) |
| `/api/vendor/[slug]/kds-stream` | KDS SSE live snapshot |
| `/api/vendor/[slug]/export` | Order history CSV / XLSX |
| `/api/operator/v1/*` | Operator Control API |
| `/api/customer/restaurants` | Public restaurant resolver |
| `/api/customer/updates` | Vendor update feed |
| `/api/analytics` | Privacy-minimal marketing funnel events |

### Key directories

- `components/customer/` — storefront (hero, menu, cart, customize, MoMo sheets, restaurant hub)
- `components/vendor/` — KDS (tickets, menu CRUD, history, drivers, setup drawer, profit, stock, readiness guide)
- `components/onboard/` — dark self-serve wizard (gate-free, owner token)
- `components/ops/` — operator console (vendors, leads, recovery, routing, translations, briefing, menu intake)
- `components/briefing/` — private presentation (access grants, sessions, evidence)
- `components/marketing/` — marketing funnel (hero, lead form, scroll-world, analytics)
- `lib/store/` — Store interface + in-memory / Prisma adapters
- `lib/actions/` — Server Actions only (async exports; never re-export types)
- `lib/momo/` — payment modes (simulate, manual, Open API collection/payout)
- `lib/checkout/` — checkout orchestration, validation, totals
- `lib/kds/` — kitchen stages, SSE snapshot, pagination, feature flags
- `lib/vendor/` — owner token, onboarding, profit, stock, export
- `lib/operator-control/` — operator API auth, routes, audit
- `lib/briefing/` — private briefing store, access grants, sessions
- `lib/menu-intake/` — vendor menu intake workflow, private storage
- `lib/vendor-updates/` — automatic public vendor updates
- `lib/customer-restaurants/` — restaurant hub, IndexedDB, updates feed
- `lib/menu/` — menu add-ons, sizes, customization, media
- `lib/inventory/` — supply inventory tracking
- `lib/leads/` — marketing lead capture, routing
- `lib/prospects/` — outbound prospect tracking
- `lib/i18n/` — KDS translations (en/rw/fr/sw), marketing copy
- `lib/analytics/` — privacy-minimal funnel events
- `lib/pwa/` — PWA manifests, install hints
- `docs/adr/` — architecture decision records
- `DESIGN.md` — UI design system (single source of truth)

## Environment

Copy `.env.example` → `.env`. Important vars:

| Var | Purpose |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres (pooled + session). Unset → in-memory Store |
| `TEST_DATABASE_URL` | Isolated schema for `#prisma` contract tests |
| `SKIP_PRISMA_TESTS` | `1` (default) skips remote Prisma tests; set `0` to opt in |
| `SEED_ALLOW_REMOTE` | Opt-in to allow `npm run db:seed` against remote Supabase (default: blocked) |
| `MOMO_MODE` | `simulate` \| `manual` \| `openapi` (local only) |
| `MOMO_ENVIRONMENT` | `sandbox` \| `mtnrwanda` (for Open API) |
| `MOMO_BASE_URL` | MTN MoMo Open API base URL |
| `MOMO_COLLECTION_PRIMARY_KEY` | MTN MoMo Collection primary key |
| `MOMO_DISBURSEMENT_PRIMARY_KEY` | MTN MoMo Disbursement primary key |
| `MOMO_WEBHOOK_URL` | Webhook endpoint for Open API callbacks |
| `MOMO_COLLECTION_USER_ID` / `MOMO_COLLECTION_API_KEY` | Collection API credentials |
| `MOMO_DISBURSEMENT_USER_ID` / `MOMO_DISBURSEMENT_API_KEY` | Disbursement API credentials |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob menu/branding uploads (local fallback: `/api/local-blob/…`) |
| `MENU_INTAKE_READ_WRITE_TOKEN` | Private Vercel Blob store for menu intake source files |
| `NEXT_PUBLIC_BASE_URL` | Public origin for QR / share / WhatsApp links |
| `PROVISION_KILL_SWITCH` | Close public signup (`1`/`true`/`on`) |
| `OPERATOR_API_KEY` / `OPERATOR_UI_SECRET` | Ops Control API + `/ops` login |
| `ZANTAP_OPERATOR_API_URL` | Operator API URL (if split deployment) |
| `OPS_APP_URL` | Ops app URL (if split deployment) |
| `BRIEFING_PREVIEW_SECRET` | Temporary briefing preview (will be replaced by access grants) |
| `BRIEFING_PREVIEW_RECIPIENT` | Temporary briefing preview recipient |
| `BRIEFING_PREVIEW_EXPIRES_AT` | Temporary briefing preview expiry |

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

**Shipped:**
- Store seam (Prisma + in-memory adapters)
- Manual & simulate MoMo checkout (Open API Collection + Vendor payout implemented locally, awaiting owner approval for production cutover)
- KDS SSE live updates with self-close and reconnect backoff
- Kitchen stages (NEW → ACCEPTED → PREPARING → READY → OUT FOR DELIVERY → COMPLETED)
- Menu CRUD + Blob gallery + multi-image carousel
- Order history with filters, pagination, and CSV/XLSX export
- Self-serve onboarding (gate-free, owner token minted once, phone-based recovery)
- Drivers + assignment + dispatch modal
- Operator console (vendors, leads, recovery, routing settings, audit, translations, briefing, menu intake)
- Durable marketing Lead capture with configurable multi-recipient WhatsApp routing
- KDS dark operational theme with scoped `.kds-dark` CSS remap
- Vendor updates (automatic public catalog feed, batches, engagement tracking)
- Private stakeholder briefing (recipient-specific access grants, viewing sessions, evidence, activity tracking)
- Vendor menu intake (self-build or assisted, staged catalog data, private storage, Ops review/import)
- KDS translations (en/rw/fr/sw with Ops-controlled availability)
- Stock tracking (dish-level stock count, low-stock thresholds, sold-out marking)
- Profit insights (expenses, period profit, weekday averages, cost prices)
- Add-ons (item-specific add-on groups and choices, server-priced order snapshots)
- Size options (dynamic menu size options with price variants)
- PWA manifests (root, per-vendor KDS, per-storefront customer app)
- Restaurant hub (PWA install, saved restaurants, vendor update feed, engagement)
- Commission settings (global + per-Vendor controls, fee snapshot at payment time - implemented but inactive until Open API production cutover)
- KDS readiness guide (replayable onboarding education)

**In Production:** Manual MoMo USSD checkout. Commission infrastructure is deployed but inactive (globalEnabled defaults false). Open API Collection + Vendor payout is implemented locally and awaiting owner approval for Test B and production cutover.

**Deferred:**
- Vendor/ops auth beyond owner tokens + ops secret (candidate #12)
- Live MTN MoMo Open API in production (awaiting owner approval)
- Automatic WhatsApp Business API delivery
- KDS fee reminder UI (flag only implemented)
- Offline KDS queue and chime (PWA baseline shipped, offline queue deferred)

## Feature Status Matrix

| Area | Status | Source / Implementation | Notes |
|---|---|---|---|
| Customer storefront | Implemented | `app/[slug]/page.tsx`, `components/customer/` | Editorial hero, menu with categories, cart, checkout |
| Vendor KDS | Implemented | `app/vendor/[slug]/page.tsx`, `components/vendor/` | Orders, menu CRUD, history, drivers, setup, profit, stock |
| Payments (manual) | Implemented | `lib/momo/`, `lib/checkout/` | Manual USSD checkout in production |
| Payments (Open API) | Local only | `lib/momo/open-api-*.ts`, ADR-0096 | Collection + Vendor payout implemented locally, awaiting owner approval for production cutover |
| Commission | Implemented but inactive | `lib/momo/commission.ts`, ADR-0097 | Settings and fee snapshot implemented, globalEnabled defaults false |
| Store seam | Implemented | `lib/store/` | In-memory + Prisma adapters, factory pattern |
| KDS SSE live updates | Implemented | `lib/kds/`, `/api/vendor/[slug]/kds-stream` | Self-close at 250s, client reconnect backoff (ADR-0004, ADR-0023) |
| Kitchen stages | Implemented | `lib/kds/kitchen-stage.ts`, ADR-0013 | NEW → ACCEPTED → PREPARING → READY → OUT FOR DELIVERY → COMPLETED |
| Menu CRUD | Implemented | `lib/actions/vendor-menu.ts` | Create, update, archive, restore, availability toggle |
| Menu media | Implemented | `lib/menu/`, Vercel Blob | Multi-image gallery, primary image, local fallback |
| Order history | Implemented | `lib/actions/vendor-history.ts` | Filters, pagination, CSV/XLSX export |
| Self-serve onboarding | Implemented | `app/onboard/`, ADR-0020-0025 | Gate-free wizard, owner token, phone-based recovery |
| Owner token | Implemented | `lib/vendor/owner-token.ts`, ADR-0022 | Per-vendor capability token, replaces shared write-secret |
| Drivers | Implemented | `lib/actions/vendor-drivers.ts` | CRUD, assignment, dispatch modal |
| Operator console | Implemented | `app/ops/`, `lib/operator-control/` | Vendors, leads, recovery, routing, audit, translations, briefing, menu intake |
| Lead capture | Implemented | `lib/leads/`, ADR-0050 | Durable marketing lead capture, Rwanda E.164 phone |
| Lead routing | Implemented | `lib/leads/routing.ts`, ADR-0053 | Multi-recipient WhatsApp routing, concurrency-safe round-robin |
| Prospects | Implemented | `lib/prospects/`, ADR-0054 | Outbound prospect tracking, interactions |
| Private briefing | Implemented | `lib/briefing/`, ADR-0072-0079 | Recipient-specific access grants, viewing sessions, evidence, activity |
| Menu intake | Implemented | `lib/menu-intake/`, ADR-0082 | Self-build/assisted vendor menu intake, private storage, Ops review/import |
| KDS translations | Implemented | `lib/i18n/`, ADR-0089-0095 | en/rw/fr/sw with Ops-controlled availability |
| Stock tracking | Implemented | `lib/inventory/`, ADR-0055 | Dish-level stock count, low-stock thresholds, sold-out marking |
| Profit insights | Implemented | `lib/vendor/profit.ts` | Expenses, period profit, weekday averages, cost prices |
| Add-ons | Implemented | `lib/menu/add-ons.ts`, ADR-0071 | Item-specific add-on groups and choices, server-priced order snapshots |
| Size options | Implemented | `lib/menu/sizes.ts`, ADR-0069 | Dynamic menu size options with price variants |
| Vendor updates | Implemented | `lib/vendor-updates/`, ADR-0062-0068 | Automatic public catalog feed, batches, engagement tracking |
| Restaurant hub | Implemented | `lib/customer-restaurants/`, ADR-0064-0066 | PWA install, saved restaurants, vendor update feed |
| PWA | Implemented | `lib/pwa/`, ADR-0051, ADR-0059 | Root, per-vendor KDS, per-storefront customer app manifests |
| KDS readiness guide | Implemented | `components/vendor/ReadinessGuideModal.tsx`, ADR-0083 | Replayable onboarding education |
| Authentication | Deferred | ADR-0022 mentions candidate #12 | Owner tokens only, real auth deferred |
| WhatsApp Business API | Deferred | ADR-0053 | Manual handoff only, automatic delivery deferred |
| Offline KDS queue | Deferred | ADR-0051 | PWA baseline shipped, offline queue deferred |
