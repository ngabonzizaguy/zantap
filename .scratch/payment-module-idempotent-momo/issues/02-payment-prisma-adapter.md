# Implement the Payment verbs in the Prisma adapter (durable, transactional)

Status: ready-for-agent

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

- [ ] Prisma adapter implements the full payment surface from issue 01.
- [ ] The confirm transition (Payment `SUCCESS` + Order `PAID`) is one DB
      transaction; partial application is impossible.
- [ ] Idempotent under at-least-once delivery: repeated confirm of a ref does
      not double-apply the Order side effect.
- [ ] If a schema change is required, a single migration is included.
- [ ] The extended Store contract suite (from issue 01) passes against the
      Prisma adapter on the disposable test database.
- [ ] No code depends on a specific ref/id format.

## Blocked by

- Issue 01 (Payment in the Store with idempotent transition).

## Decisions (settled)

_TBD in the candidate #2 grilling session. Once grilled, this block is replaced
with the settled decisions and a link to the ADR under `docs/adr/`. Until then,
treat the PRD's "Open questions for grilling" as unresolved — do not implement._
