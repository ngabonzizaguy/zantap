# Add Payment to the Store seam with an idempotent confirm transition (in-memory)

Status: ready-for-agent

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

- [ ] Store interface gains the payment verbs; in-memory adapter implements them.
- [ ] `confirmPayment` is idempotent: confirming the same ref twice flips the
      Order to `PAID` exactly once and leaves today's gross counted once.
- [ ] Invalid PIN produces `FAILED` and does not mark the Order `PAID`.
- [ ] Confirm of an unknown ref fails cleanly (no throw across the seam).
- [ ] The Store contract suite is extended with payment behavior and passes
      against the in-memory adapter.
- [ ] No code depends on a specific ref/id format.
- [ ] `Payment` added to `CONTEXT.md` Language.

## Blocked by

- Issues 01–03 of `data-layer-server-seam` (the Store seam, Prisma adapter,
  factory) — done.

## Decisions (settled)

_TBD in the candidate #2 grilling session. Once grilled, this block is replaced
with the settled decisions and a link to the ADR under `docs/adr/`. Until then,
treat the PRD's "Open questions for grilling" as unresolved — do not implement._
