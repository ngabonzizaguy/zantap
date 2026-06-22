# Add the Prisma/Postgres adapter, schema migration, and seed

Status: ready-for-human

## Parent

PRD: `.scratch/data-layer-server-seam/PRD.md`

## What to build

Provide a durable production **adapter** for the Store, backed by Prisma/Postgres, implementing the exact interface established in slice 1. Adopt the existing Prisma schema (Vendor, MenuItem, Order, OrderItem, Driver, Payment, and the status/provider enums) and add a home for kitchen-open state on the `Vendor` model (a boolean defaulting to open, distinct from `isActive`), with the accompanying migration.

Add a single, guarded Prisma client instance so dev hot-reload does not exhaust connections. Add a seed script that reproduces today's demo dataset — the `inka-steakhouse` Vendor, its menu, drivers, and sample orders — so a freshly migrated local Postgres matches the current experience.

The Prisma adapter must satisfy the same Store contract suite from slice 1, run against a disposable test database. Ids come from Prisma (cuid); nothing may depend on a specific id format.

## Acceptance criteria

- [x] `kitchenOpen` (boolean, default open) added to the `Vendor` model with a migration (`prisma/migrations/20260622000000_init`).
- [x] A guarded singleton Prisma client exists (`lib/prisma.ts`).
- [x] A Prisma adapter implements the full Store interface (`lib/store/prisma.ts`).
- [x] A seed script populates the demo Vendor, menu, drivers, and sample orders (`prisma/seed.ts`).
- [x] The slice-1 contract suite runs against the Prisma adapter using a disposable test database (`lib/store/__tests__/prisma.test.ts`, enabled by `TEST_DATABASE_URL`).
- [x] No code depends on a specific id format (adapter and seed use Prisma cuids; tests assert on returned ids only).

## Blocked by

- Issue 01 (Introduce the server-only Store seam)
