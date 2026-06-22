# Select Prisma via factory; run the contract suite against both adapters

Status: ready-for-human

## Parent

PRD: `.scratch/data-layer-server-seam/PRD.md`

## What to build

Make the Store factory choose its adapter automatically: the Prisma adapter when `DATABASE_URL` is configured, the in-memory adapter otherwise. Tests always force the in-memory adapter except for the dedicated Prisma integration run.

Parametrize the contract suite so the same behavioral tests run against both adapters, proving they cannot drift. After this slice the same application persists to Postgres in a configured environment — Orders survive process restart and serverless instance changes — while local dev and CI still run with no database.

## Acceptance criteria

- [x] The factory returns the Prisma adapter when `DATABASE_URL` is set, the in-memory adapter otherwise (`lib/store/index.ts`; proven by `lib/store/__tests__/factory.test.ts`, DB-free).
- [x] Tests force the in-memory adapter by default; the Prisma integration run is opt-in (`in-memory.test.ts` constructs in-memory directly; `prisma.test.ts` is gated on `TEST_DATABASE_URL`).
- [x] The contract suite runs against both adapters from one shared set of behavioral tests (`runStoreContract` in `contract.ts`, invoked by both adapter test files).
- [x] With `DATABASE_URL` configured, a placed Order survives a server restart and is visible to the KDS (new "durability across a server restart" test in `prisma.test.ts`: writes via one client, reads via a fresh client; verified green against real Supabase Postgres).
- [x] With no `DATABASE_URL`, the app and tests run fully on the in-memory adapter (factory falls back to in-memory; in-memory contract + factory tests run with no database).

## Implementation notes

Most of this slice was already satisfied by Issue 02 (factory auto-selection, default-in-memory tests, shared contract suite). This slice added the two missing pieces of *proof*:

- **`lib/store/__tests__/factory.test.ts`** (new, no DB): asserts adapter selection from `DATABASE_URL` and single-instance memoization.
- **`lib/store/__tests__/prisma.test.ts`** (extended): a durability test simulating a server restart — an Order placed + PAID through one Prisma client is read back through a brand-new client sharing no in-process state, and appears on the KDS active-orders feed.

Verification: `npm test` → 34 passed (in-memory contract 15, Prisma contract 15 + durability 1, factory 3) against the real `zantap_test` schema on Supabase, ~162s.

## Blocked by

- Issue 02 (Add the Prisma/Postgres adapter, schema migration, and seed)
