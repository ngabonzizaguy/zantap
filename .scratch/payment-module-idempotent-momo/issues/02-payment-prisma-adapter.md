# Implement the Payment verbs in the Prisma adapter (durable, transactional)

Status: done (2026-06-22)

## Parent

PRD: `.scratch/payment-module-idempotent-momo/PRD.md`

## What to build

Implement the payment verbs from issue 01 in the Prisma adapter
(`lib/store/prisma.ts`), persisting real `Payment` rows. The `Payment` model
already exists in `prisma/schema.prisma` (`orderId @unique`, `transactionRef
@unique`, `status`, `provider`, `amount`) and is currently unwritten.

- `createPayment` inserts a `PENDING` Payment; the unique `orderId` enforces one
  Payment per Order (reuse-on-duplicate rather than erroring — handle the unique
  conflict per the grilling decision).
- `confirmPayment` performs the `PENDING → SUCCESS` transition **and** the Order
  `→ PAID` update inside a single Prisma transaction, so the Payment record and
  the Order status can never diverge. The transition is idempotent: a `SUCCESS`
  row short-circuits and re-returns success without re-touching the Order.
- Decide during grilling whether the `stk_…` token overloads `transactionRef`
  or a dedicated `idempotencyKey` column + migration is added. If a column is
  added, include the migration (one migration, mirroring slice-1 conventions).

## Acceptance criteria

- [x] Prisma adapter implements the full payment surface from issue 01.
- [x] The confirm transition (Payment `SUCCESS` + Order `PAID`) is one DB
      transaction; partial application is impossible.
- [x] Idempotent under at-least-once delivery: repeated confirm of a ref does
      not double-apply the Order side effect.
- [x] If a schema change is required, a single migration is included. (N/A — no schema change per ADR-0001.)
- [x] The extended Store contract suite (from issue 01) passes against the
      Prisma adapter on the disposable test database.
- [x] No code depends on a specific ref/id format.

## Blocked by

- Issue 01 (Payment in the Store with idempotent transition).

## Decisions (settled)

See [ADR-0001: Payment module — idempotent MoMo state machine](../../../docs/adr/0001-payment-module-idempotent-momo.md).

- **No schema migration** — overload existing `Payment.transactionRef @unique` with
  the `stk_…` token; no `idempotencyKey` column.
- **`createPayment` on duplicate `orderId`:** fetch and return existing row per
  status branches in ADR-0001 (reuse `PENDING`/`SUCCESS`, reject `FAILED`); handle
  unique constraint accordingly, do not error on conflict.
- **`confirmPayment`:** wrong PIN leaves row `PENDING`; `SUCCESS` + Order `PAID` in
  one Prisma transaction; repeat confirm is idempotent no-op.
- **No expiry logic** in the adapter.
