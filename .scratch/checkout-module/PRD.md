# PRD: Extract a Checkout module from the Storefront UI

Status: ready-for-agent
Feature slug: checkout-module
Source: /improve-codebase-architecture → candidate #3 (parent: payment-module-idempotent-momo)

## Problem Statement

Customer checkout logic is scattered across three client modules with no single
owner for the flow:

| Layer | Owns today | Problem |
|-------|------------|---------|
| `CheckoutSheet.tsx` | `canProceedToPay(...)` | Validation lives in a presentation component and is imported into `Storefront`. |
| `CartContext.tsx` | `CheckoutStage`, cart totals (`getTotal`, `getLines`), delivery fields (phone/sector/landmark), payment tokens (`orderId`, `stkToken`, `pin`) | One context mixes **menu cart** with **checkout + payment** state. |
| `Storefront.tsx` | `handlePay` / `handleConfirmPin` | Inline orchestration of `placeOrder`, `fetch('/api/momo/stk')`, error handling, and every stage transition (`loading → ussd → success`, failure → `cart`). |

Callers must understand all three files to change checkout behavior. Stage
transitions and pay orchestration are untestable without mounting the full
Storefront. The Payment module (#2) fixed server-side money correctness; this
slice fixes **client-side flow locality** so future work (live MoMo, retry UX,
Server Actions) has one seam to touch.

## Solution

Introduce a **Checkout module** — a deep, in-process client module with a small
interface that owns validation, line/total computation, the checkout stage
machine, and place-order / MoMo orchestration. The Storefront UI becomes a thin
renderer: it reads checkout state and calls `pay()` / `confirmPin()` instead of
inline `fetch` and `setStage` spaghetti.

**Cart** (menu item quantities) and **Checkout** (delivery details + payment
flow) are separated at the module boundary. `CartContext` shrinks to cart-only;
checkout state moves behind `useCheckout` (or `CheckoutProvider`).

MoMo transport stays on `/api/momo/stk` (per ADR-0001) but moves behind a thin,
injectable `momoClient` inside the Checkout module so orchestration is testable
without `fetch` in `Storefront.tsx`.

## User Stories

1. As a developer, I want checkout validation in one module, so that changing
   phone/sector rules does not require editing a sheet component.
2. As a developer, I want totals and line items computed in one place, so that
   cart math cannot drift between context and UI.
3. As a developer, I want stage transitions defined once, so that adding a step
   (e.g. payment retry) does not require hunting `setStage` across files.
4. As a developer, I want `pay()` and `confirmPin()` behind one interface, so
   that MoMo orchestration is unit-testable with mocked deps.
5. As a Customer, I want the checkout UX unchanged (glassmorphic sheet, USSD
   modal, success receipt), so that this refactor is invisible in the UI.
6. As a developer, I want `Storefront.tsx` to stop importing `canProceedToPay`
   from a presentation file, so that layering is correct.

## Implementation Decisions

- **Module home:** `lib/checkout/` — pure functions + orchestration + React hook.
  Presentation stays in `components/customer/` (no visual changes).
- **Cart vs Checkout:** `CartContext` retains only `cart` map + `addItem` /
  `removeItem`. Checkout owns `stage`, delivery fields, `pin`, `orderId`,
  `stkToken`, and orchestration methods.
- **Stage machine:** `CheckoutStage` stays in `lib/types.ts` (shared type). Legal
  transitions and reducers live in `lib/checkout/stages.ts`.
- **Server boundary unchanged:** `placeOrder` remains the `placeOrder` Server
  Action; MoMo push/confirm remain `POST /api/momo/stk`. The Checkout module
  calls them; it does not import the Store.
- **MoMo client:** `lib/checkout/momo-client.ts` wraps `fetch` to `/api/momo/stk`
  with the existing request/response shapes (`StkPushRequest`, `StkPushResponse`,
  `ConfirmPinRequest`). Injectable in tests.
- **Error handling (preserve current UX):** STK `FAILED` or network error →
  stage back to `cart` (no toast yet). PIN confirm `SUCCESS` → `success`; other
  outcomes stay on `ussd` (wrong PIN is retryable per ADR-0001). No new error UI
  in this slice.
- **No `"use client"` imports of Store or `simulate.ts`.** Same rule as #2.

## Testing Decisions

- **Pure functions:** unit tests for `canProceedToPay`, line/total computation,
  and stage transition helpers (no React).
- **Orchestration:** test `pay` / `confirmPin` logic with injected
  `placeOrder` + `momoClient` mocks (hook test or extracted async functions).
- **No E2E / Playwright in this slice.** Manual smoke on the glassmorphic flow
  is sufficient acceptance for UI wiring.
- **Existing server tests stay green:** `npm test` must not regress the 53/53
  payment/Store suite.

## Out of Scope

- Visual redesign of `CheckoutSheet`, `UssdModal`, or `SuccessReceipt`.
- Replacing `fetch('/api/momo/stk')` with a Server Action (deferred; ADR-0001
  kept the route until this module exists — migration can be a follow-up issue).
- Live MTN MoMo webhooks, payment retry UI, or expiry messaging.
- Vendor KDS changes (candidate #4).
- Prisma-generated types / Zod DTOs (candidate #5).

## Open questions (resolve before or during issue 01 — light grill optional)

1. **Hook vs Provider:** export `useCheckout(menu, vendor)` from a
   `CheckoutProvider` nested inside `CartProvider`, or a single combined provider?
   (Leaning: `CheckoutProvider` nested in `Storefront`, takes `vendor` + reads
   cart from `useCart()`.)
2. **Pin length gate:** `UssdModal` disables send when `pin.length < 5`; should
   `confirmPin()` enforce the same, or trust the modal? (Leaning: enforce in
   module — single source of truth.)
3. **Sector picker state:** `sectorOpen` is UI chrome; keep it in `CheckoutSheet`
   local state rather than the module? (Leaning: yes — not checkout domain.)

## Further Notes

- Builds on candidate #2: server payment state is durable and idempotent; this
  module is the client orchestrator that calls the unchanged route.
- Add **Checkout** as a domain term to `CONTEXT.md` during issue 01 (client
  flow module, not an Order).
- Three vertically sliced issues; ship one per session (anti-YOLO).

## Issues (planned)

| # | Slug | Delivers |
|---|------|----------|
| 01 | `checkout-pure-domain` | `lib/checkout/` validation + totals; tests; remove `canProceedToPay` from `CheckoutSheet` |
| 02 | `checkout-orchestration-hook` | Stage machine + `momoClient` + `useCheckout` with `pay` / `confirmPin` |
| 03 | `wire-storefront-slim-cart` | Slim `CartContext`; `Storefront` renders via checkout hook; delete inline handlers |
