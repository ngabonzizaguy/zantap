# Add Payment to the Store seam with an idempotent confirm transition (in-memory)

Status: done

## Parent

PRD: `.scratch/payment-module-idempotent-momo/PRD.md`

## What to build

Extend the single Store interface (`lib/store/types.ts`) with payment verbs and
implement them in the in-memory adapter (`lib/store/in-memory.ts`), establishing
the behavior the Prisma adapter will later mirror. This is the model that
replaces the module-scoped `pendingTransactions` Map.

Proposed surface (finalize during grilling):

- `createPayment(input)` — called on STK push. Creates a `PENDING` Payment for
  an Order, keyed by a stable `transactionRef` (the `stk_…` token). Returns the
  Payment. Reuses the existing `PENDING` Payment if one already exists for the
  Order (idempotent push).
- `getPaymentByRef(ref)` — read a Payment by its stable reference.
- `confirmPayment(ref, pin)` — the idempotent state machine:
  - first valid confirm: `PENDING → SUCCESS` **and** Order → `PAID`, atomically;
  - repeat confirm of a `SUCCESS` ref: no-op, returns the same `SUCCESS` result,
    Order stays `PAID` (counted once);
  - invalid PIN: `PENDING → FAILED`, Order unchanged;
  - unknown or `FAILED` ref: stable failure result.

Add the `Payment` domain term to `CONTEXT.md`.

## Acceptance criteria

- [x] Store interface gains the payment verbs; in-memory adapter implements them.
- [x] `confirmPayment` is idempotent: confirming the same ref twice flips the
      Order to `PAID` exactly once and leaves today's gross counted once.
- [x] Invalid PIN keeps Payment `PENDING` and does not mark the Order `PAID`.
- [x] Confirm of an unknown ref fails cleanly (no throw across the seam).
- [x] The Store contract suite is extended with payment behavior and passes
      against the in-memory adapter.
- [x] No code depends on a specific ref/id format.
- [x] `Payment` added to `CONTEXT.md` Language.

## Blocked by

- Issues 01–03 of `data-layer-server-seam` (the Store seam, Prisma adapter,
  factory) — done.

## Decisions (settled)

See [ADR-0001: Payment module — idempotent MoMo state machine](../../../docs/adr/0001-payment-module-idempotent-momo.md).

- **Duplicate STK push:** reuse existing Payment for the same `orderId` — return
  existing `transactionRef` if `PENDING` or `SUCCESS`; reject if terminal `FAILED`.
- **Wrong PIN:** keep Payment `PENDING`; return failed attempt response only.
  `FAILED` is for terminal abandonment, not typos.
- **Expiry:** none in this slice — `PENDING` stays confirmable until `SUCCESS`
  or terminal `FAILED`.
- **Idempotency key:** STK token stored in `Payment.transactionRef` (no new column).
- **Confirm entry point:** unchanged — issue 01 is Store-only; route wiring is issue 03.
