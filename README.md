# ZanTap

An ultra-lightweight, mobile-first social commerce checkout platform and micro-POS designed explicitly for informal food vendors, ghost kitchens, and street food hubs across Africa — starting in Kigali, Rwanda.

## Quick start

```bash
npm install
npm run dev
```

Open:

- Customer storefront: [http://localhost:3000/inka-steakhouse](http://localhost:3000/inka-steakhouse)
- Vendor KDS: [http://localhost:3000/vendor/inka-steakhouse](http://localhost:3000/vendor/inka-steakhouse)
- Driver slip stub: [http://localhost:3000/slip/1204](http://localhost:3000/slip/1204)

## Sandbox MoMo PIN

During checkout, use PIN **`12345`** to simulate a successful STK push.

## Architecture

This repo is frontend-first with a swappable data layer:

```
UI (customer + KDS)
  → lib/data/*        typed async functions (mock-backed today)
  → lib/momo/simulate simulated STK push via /api/momo/stk
  → prisma/schema.prisma authored for future Supabase/Postgres wiring
```

### Routes

| Route | Purpose |
|---|---|
| `/[slug]` | Glassmorphic customer storefront (max 450px) |
| `/vendor/[slug]` | Dark vendor KDS dashboard (max 560px) |
| `/slip/[orderId]` | Standalone driver delivery slip |
| `/api/momo/stk` | Simulated MoMo STK push + PIN confirmation |

### Key directories

- `components/customer/` — storefront UI (menu, cart, checkout, USSD modal, receipt)
- `components/vendor/` — KDS UI (orders, inventory, dispatch modal)
- `lib/data/` — mock store + typed data access (swap internals for Prisma later)
- `lib/momo/` — MoMo simulation logic
- `prisma/schema.prisma` — database schema (not migrated yet)

## Environment

Copy `.env.example` to `.env` when wiring Supabase:

```bash
cp .env.example .env
```

- `DATABASE_URL` — pooled Postgres connection (Supabase transaction pooler)
- `DIRECT_URL` — direct Postgres connection (Prisma migrations)

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Generate Prisma client (after DATABASE_URL is set)
```

## Reference assets

Design prototypes and product specs are kept in the repo root:

- `ZanTap.dc.html` — customer UI reference
- `ZanTap Vendor KDS.dc.html` — vendor KDS reference
- `zantap.txt` — product spec
- `zantap-brand-identity.txt` — brand notes

## Deferred (Phase 2)

- Supabase provisioning + Prisma migrations
- Vendor authentication
- Real MoMo sandbox integration
- Realtime order subscriptions
