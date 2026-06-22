# Route MoMo through the Store and delete the pendingTransactions Map

Status: ready-for-agent

## Parent

PRD: `.scratch/payment-module-idempotent-momo/PRD.md`

## What to build

Rewrite `lib/momo/simulate.ts` so the simulated MoMo flow reads and writes only
through the Store, and **delete** the module-scoped `pendingTransactions` Map —
the payment split-brain's last home.

- `initiateStkPush` keeps the sandbox delay, generates the `stk_…` token, and
  calls `createPayment` to persist a `PENDING` Payment keyed by that token.
- `confirmStkPin` calls `confirmPayment(token, pin)` and maps the Store result
  to the existing `StkPushResponse` shape. The Order → `PAID` side effect now
  lives inside the Store transition (remove the direct `updateOrderStatus` call
  from `simulate.ts`).
- `getTransaction` either reads through `getPaymentByRef` or is removed if
  unused. Keep client-safe copy in `lib/momo/constants.ts` untouched.
- The `/api/momo/stk` route keeps its request/response contract, so the client
  checkout flow is unchanged.

## Acceptance criteria

- [ ] `pendingTransactions` (and any other module-scoped payment state) is gone.
- [ ] STK push and PIN confirm work across separate invocations/instances
      (no in-process carryover) — covered by a cross-restart payment test like
      the Order durability test.
- [ ] Confirming through the route is idempotent end-to-end: a replayed confirm
      returns `SUCCESS` without double-counting today's gross.
- [ ] `/api/momo/stk` request/response shape is unchanged; the client checkout
      flow needs no edits.
- [ ] `npm test` green (in-memory + Prisma contract suites, including the new
      payment durability/idempotency tests).
- [ ] No `"use client"` module imports the Store or `simulate.ts` server code.

## Blocked by

- Issue 01 (Payment in the Store) and Issue 02 (Prisma Payment adapter).

## Decisions (settled)

_TBD in the candidate #2 grilling session. Once grilled, this block is replaced
with the settled decisions and a link to the ADR under `docs/adr/`. Until then,
treat the PRD's "Open questions for grilling" as unresolved — do not implement._
