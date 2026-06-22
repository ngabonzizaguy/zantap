# ADR-0001: Payment module — idempotent MoMo state machine

**Status:** Accepted  
**Date:** 2026-06-22  
**Context:** Candidate #2 — `.scratch/payment-module-idempotent-momo/PRD.md`  
**Grilling session:** `/grill-with-docs` (2026-06-22)

## Problem

MoMo payment state lives in a module-scoped `Map` (`lib/momo/simulate.ts`). STK push
and PIN confirm can land on different serverless instances, so confirm fails after
the customer pays. There is no durable Payment record and no idempotent confirm.

## Decision

Promote payment state into the Store as a first-class **Payment**, with an
idempotent confirm transition. The simulated provider reads/writes only through
the Store. The `pendingTransactions` Map is deleted in issue 03.

### 1. Duplicate STK push — reuse existing Payment (Option A)

When `createPayment` is called for an `orderId` that already has a Payment row:

| Existing status | Behavior |
|-----------------|----------|
| `PENDING` | Return the existing Payment unchanged (same `transactionRef`). No second row, no new token. |
| `SUCCESS` | Return the existing Payment as `SUCCESS` (idempotent push; Order already `PAID`). |
| `FAILED` | Reject with a stable failure. Terminal abandonment — customer must place a new Order. |

Enforced by `Payment.orderId @unique` in the schema.

**Wrong PIN does not terminal-fail the Payment.** A mistyped PIN is a failed
*attempt*, not a failed *payment*:

| Event | Payment state | Order | HTTP response |
|-------|---------------|-------|---------------|
| STK push | `PENDING` | unchanged | `PENDING` + token |
| Wrong PIN | stays `PENDING` | unchanged | `FAILED` + "Invalid PIN. Please try again." |
| Correct PIN (first) | `PENDING → SUCCESS` | `→ PAID` | `SUCCESS` |
| Correct PIN (repeat) | stays `SUCCESS` | stays `PAID` | `SUCCESS` (idempotent no-op) |

`FAILED` is reserved for terminal abandonment (provider decline, explicit cancel,
or a future max-attempts / expiry policy). Wrong PIN must never transition
`PENDING → FAILED` in this slice.

### 2. Expiry — no hard TTL (Option A)

`PENDING` Payments have **no expiry** in this slice. They remain confirmable until
they reach `SUCCESS` or terminal `FAILED`. No TTL column, no sweeper job, no
lazy expiry check on confirm.

Error copy for unknown refs: "Payment not found" (not "expired"). Expiry policy
is deferred to the real MTN MoMo integration candidate; `Payment.createdAt` is
available if needed later.

**Accepted trade-off:** abandoned checkouts may leave stale `PENDING` rows (one
per abandoned Order, no money moved). Cleanup can be a later candidate.

### 3. Idempotency key — overload `transactionRef` (Option A)

The STK token (`stk_…`) is stored directly in `Payment.transactionRef`
(`@unique`). Store methods `getPaymentByRef(ref)` and `confirmPayment(ref, pin)`
use that column. **No new `idempotencyKey` column; no migration** for this slice.

For the simulated provider, `transactionRef`, the client-visible token, and the
confirm idempotency key are the same string. When live MTN MoMo arrives, provider
reference mapping is a separate integration decision.

### 4. Confirm entry point — keep `/api/momo/stk` route (Option A)

Both STK push and PIN confirm stay on `app/api/momo/stk/route.ts`. Request/response
shape is unchanged; no client checkout edits in this feature. `placeOrder` remains
a Server Action; MoMo stays on the route until candidate #3 (Checkout module) or
live webhook integration.

## Consequences

- **Issue 01:** Extend Store with `createPayment`, `getPaymentByRef`,
  `confirmPayment`; implement idempotent transition in in-memory adapter; extend
  contract suite. Add `Payment` to `CONTEXT.md`.
- **Issue 02:** Mirror in Prisma adapter inside a single transaction (Payment
  `SUCCESS` + Order `PAID`). No schema migration unless a future ADR overrides.
- **Issue 03:** Rewire `lib/momo/simulate.ts` through Store; delete
  `pendingTransactions` Map; preserve route contract.

## Alternatives considered

| Question | Rejected option | Why rejected |
|----------|-----------------|--------------|
| Duplicate STK | Reject second push | Orphans in-flight payments on network retry; worse UX |
| Expiry | TTL / auto-fail `PENDING` | Punishes distracted customers; real provider TTL comes with live integration |
| Idempotency key | New `idempotencyKey` column | Premature — same value as `transactionRef` in simulator; adds migration cost |
| Confirm transport | Server Action for confirm | Expands slice into client/UI work; bug is server-side state, not transport |
