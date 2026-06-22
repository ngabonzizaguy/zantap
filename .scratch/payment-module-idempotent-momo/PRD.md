# PRD: Persist Payments behind the Store and make MoMo confirmation idempotent

Status: ready-for-agent
Feature slug: payment-module-idempotent-momo
Source: /improve-codebase-architecture → candidate #2 (parent: data-layer-server-seam)

## Problem Statement

The MoMo flow keeps its truth in a module-scoped `Map`:

```
// lib/momo/simulate.ts
const pendingTransactions = new Map<string, PendingTransaction>();
```

`initiateStkPush` writes the token → transaction into this Map; `confirmStkPin`
later reads it back to authorize payment and flip the Order to `PAID`. This is
the *exact* per-realm split-brain that the Store seam (candidate #1) just
removed for Orders — except it still governs **money**:

- On Vercel's serverless runtime the STK push and the PIN confirm can land on
  different function invocations. `confirmStkPin` then finds no token and
  returns "Transaction not found or expired" for a Customer who is paying.
- Even within one process, the `Map` is lost on restart, so an in-flight
  payment evaporates.
- There is no idempotency. MoMo (and any real callback) delivers
  **at least once**; a retried confirm, a double-tapped PIN, or a replayed
  token would each re-run `updateOrderStatus(orderId, "PAID")` with no dedupe,
  and nothing records that a Payment ever happened.
- The `Payment` model already exists in the Prisma schema but is **never
  written** — there is no durable record of money changing hands, so today's
  gross is reconstructed only from Order status.

The result: paid Customers can be told their payment failed, and the system has
no durable, idempotent record of payment. This is the highest-risk correctness
gap remaining after the Store seam.

## Solution

Promote payment state out of the in-memory `Map` and into the durable **Store**
as a first-class **Payment**, governed by an **idempotent state machine**. The
STK push creates a `PENDING` Payment row keyed by a stable reference; PIN
confirmation transitions that Payment to `SUCCESS`/`FAILED` and, as a single
durable side effect, moves the Order to `PAID` — exactly once, no matter how
many times the confirm is delivered. `lib/momo` keeps its simulated provider
behavior but reads and writes only through the Store, so payment truth survives
restarts and serverless instance changes and is safe under retries.

This slice keeps the **simulated** provider. Real MTN MoMo / Airtel Money API
calls and inbound webhooks remain a separate, later candidate; this slice makes
the state model underneath them correct first.

## User Stories

1. As a Customer, I want my PIN confirmation to succeed even when it is handled
   by a different server instance than my STK push, so that I am not told my
   payment failed after I paid.
2. As a Customer, I want confirming the same payment twice to be harmless, so
   that a retry or double-tap never double-charges or corrupts my Order.
3. As a Customer, I want my payment to persist if the server restarts mid-flow,
   so that I don't lose a payment I already authorized.
4. As a Vendor, I want every successful payment to leave a durable Payment
   record, so that my takings are auditable, not inferred.
5. As a Vendor, I want an Order to flip to `PAID` exactly once per successful
   payment, so that today's gross is never double-counted.
6. As a developer, I want payment state to live behind the one Store seam, so
   that there is a single writer for money just like for Orders.
7. As a developer, I want the confirm transition to be idempotent on a stable
   key, so that at-least-once delivery is safe by construction.
8. As a developer, I want both adapters to implement the Payment verbs against
   one contract suite, so that in-memory and Prisma cannot drift on money.
9. As a developer, I want the `pendingTransactions` Map deleted, so that the
   split-brain cannot reappear for payments.

## Implementation Decisions

- **Payment joins the Store interface.** Add payment verbs to the single Store
  seam (e.g. `createPayment` on STK push, `getPaymentByRef`, and a
  `confirmPayment` transition). Both adapters implement them; no caller touches
  an adapter directly. `lib/momo` becomes a thin simulator over the Store.
- **One stable idempotency key.** The STK token is the Payment's stable
  reference. Reuse the existing `Payment.transactionRef @unique` as that key
  (the `stk_…` token becomes the `transactionRef`); `Payment.orderId @unique`
  already enforces one Payment per Order. No new column unless grilling shows
  one is needed.
- **Idempotent transition.** `confirmPayment(ref, …)` is safe to call repeatedly:
  the first valid confirm flips Payment `PENDING → SUCCESS` and the Order to
  `PAID`; subsequent confirms observe `SUCCESS` and return the same result
  without re-applying the Order side effect. Invalid PIN flips `PENDING →
  FAILED`; a confirm against an unknown/`FAILED` ref returns a stable failure.
- **Order side effect is part of the transition.** Marking the Order `PAID`
  happens inside the same Store transition that records `SUCCESS`, so the two
  cannot diverge (and Prisma can wrap them in one transaction).
- **Provider stays simulated.** Keep the sandbox STK delay and the fixed valid
  PIN; the provider field defaults to `MTN_MOMO`. No network calls.
- **Server-only enforcement preserved.** Payment logic is server-only; the
  client reaches it via the existing `/api/momo` route (and/or a Server Action).
  Client-safe display copy stays in `lib/momo/constants.ts`.
- **Scope.** Whole payment surface migrates in this feature; no Map/Store
  coexistence.

## Testing Decisions

- **Contract suite, both adapters.** Extend the Store contract with payment
  behavior and run it against the in-memory and Prisma adapters, as for Orders.
- **Idempotency is the centerpiece.** Tests assert: a successful confirm flips
  the Order to `PAID`; a *second* confirm of the same ref is a no-op that
  returns `SUCCESS` and leaves today's gross unchanged (flipped once, counted
  once); an invalid PIN yields `FAILED` and no `PAID`; a confirm of an unknown
  ref fails cleanly.
- **Cross-instance durability.** Mirror the Order durability test: create a
  Payment via one Store/client and confirm it via a fresh one, proving the flow
  survives a "restart".
- **No id/format assumptions.** Assertions use returned refs/ids, never
  literals.

## Out of Scope

- Real MTN MoMo / Airtel Money API integration and inbound webhooks/callbacks
  (separate later candidate). This slice keeps the simulator.
- Refunds, partial payments, or multi-attempt payment histories per Order
  (current model is one Payment per Order).
- Replacing hand-written types with Prisma-generated types + Zod DTOs
  (candidate #5).
- KDS live push (candidate #4).

## Open questions for grilling (resolve via /grill-with-docs before building)

1. **Duplicate STK push for the same Order:** reuse the existing `PENDING`
   Payment/ref, or reject? (Leaning: reuse — return the existing ref.)
2. **Expiry:** does a `PENDING` Payment expire (the old `Map` implied
   transience via "expired")? If so, where does the clock live now that state
   is durable? (Leaning: no hard expiry in this slice; treat only `FAILED`
   as terminal-negative.)
3. **Token as `transactionRef` vs. a dedicated `idempotencyKey` column:** is
   overloading `transactionRef` acceptable, or do we add a column + migration?
4. **Confirm entry point:** keep the `/api/momo` route, or move confirm to a
   Server Action for parity with checkout? (Leaning: keep the route this slice.)

## Further Notes

- This builds directly on the Store seam: a single durable writer for money,
  reusing the adapter/contract pattern and the cross-restart durability proof.
- Domain term **Payment** should be added to `CONTEXT.md` during grilling and
  used exactly in issue titles and tests.
