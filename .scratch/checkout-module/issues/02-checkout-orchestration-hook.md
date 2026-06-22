# Checkout stage machine, MoMo client, and useCheckout hook

Status: done

## Parent

PRD: `.scratch/checkout-module/PRD.md`

## What to build

Extend `lib/checkout/` with orchestration behind a React hook:

- **`stages.ts`** — legal `CheckoutStage` transitions (e.g. `cart → loading →
  ussd → success`; failures `loading → cart`; cancel `ussd → cart`). Export a
  small reducer or `transition(stage, event)` helper with unit tests.
- **`momo-client.ts`** — `initiateStkPush(body)` and `confirmStkPin(body)` calling
  `POST /api/momo/stk` with existing JSON shapes. Default implementation uses
  `fetch`; export types for injection in tests.
- **`useCheckout.ts`** (`"use client"`) — owns checkout state currently spread in
  `CartContext`: `stage`, `phone`, `sector`, `landmark`, `pin`, `orderId`,
  `stkToken`, setters, and:
  - `pay({ vendorSlug, vendorName, lines })` — validates via `canProceedToPay`,
    sets `loading`, calls `placeOrder` Server Action, then `initiateStkPush`; on
    success sets token + `ussd`, on failure returns to `cart`.
  - `confirmPin()` — enforces pin length ≥ 5, calls `confirmStkPin`; on
    `SUCCESS` → `success` stage (wrong PIN stays on `ussd`).
  - `reset()` — clears checkout fields back to initial (cart stage handled by
    caller or coordinated with cart reset in issue 03).

`useCheckout` reads the cart map from `useCart()` (requires `CartProvider`
ancestor). Takes `vendor: Vendor` and `menu: MenuItem[]` (or `availableMenu`) for
totals via `lib/checkout/totals`.

Add tests for `stages.ts` and orchestration (mock `placeOrder` + `momoClient`).

Do **not** rewire `Storefront.tsx` yet — export the hook and verify via tests;
UI wiring is issue 03.

## Acceptance criteria

- [x] Stage transition rules live in `lib/checkout/stages.ts` with unit tests.
- [x] `momo-client.ts` wraps `/api/momo/stk` without changing request/response shape.
- [x] `useCheckout` exposes `pay`, `confirmPin`, `reset`, and checkout field state.
- [x] Orchestration tests cover: happy path pay → ussd; STK failed → cart; confirm
      success → success; wrong PIN stays on ussd.
- [x] No `Store` or `simulate.ts` import from client modules.
- [x] `npm test` green.

## Blocked by

- Issue 01 (`checkout-pure-domain`).

## Decisions (settled)

- Keep `/api/momo/stk` route (ADR-0001); no Server Action migration in this slice.
- `sectorOpen` stays out of the hook (UI-local in `CheckoutSheet`).
- Pin minimum length 5 enforced inside `confirmPin()`.
