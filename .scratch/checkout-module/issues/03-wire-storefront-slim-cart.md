# Wire Storefront through useCheckout and slim CartContext

Status: done

## Parent

PRD: `.scratch/checkout-module/PRD.md`

## What to build

Complete the UI integration so `Storefront.tsx` no longer orchestrates checkout:

- **Slim `CartContext`** — remove checkout/payment state (`stage`, `phone`,
  `sector`, `landmark`, `pin`, `orderId`, `stkToken`, `sectorOpen`, `setStage`,
  etc.). Keep only `cart`, `addItem`, `removeItem`, and optionally a minimal
  `resetCart` if needed for success flow.
- **`Storefront.tsx`** — nest `CheckoutProvider` / `useCheckout`:
  - Delete `handlePay` and `handleConfirmPin`.
  - Pass checkout state + handlers to `CheckoutSheet`, `UssdModal`,
    `SuccessReceipt`, `StickyCartBar`.
  - Stage-driven `open` props come from `checkout.stage`.
- **`CheckoutSheet.tsx`** — presentation only; no checkout domain exports.
- Verify glassmorphic styling unchanged (no className edits unless required for
  prop plumbing).

Manual smoke: add items → open cart → fill delivery → pay → enter sim PIN →
success receipt → reset.

## Acceptance criteria

- [x] `CartContext` contains no `CheckoutStage` or payment-flow state.
- [x] `Storefront.tsx` has no inline `fetch('/api/momo/stk')` or `placeOrder` calls.
- [x] `canProceedToPay` is only imported from `lib/checkout`.
- [ ] Full customer checkout flow works in dev (menu → cart → MoMo → success) — manual smoke pending.
- [x] `npm test` green (84/84 server tests unchanged).
- [x] Customer view styling intact per `.cursorrules` (glassmorphic, no KDS bleed).

## Blocked by

- Issue 02 (`checkout-orchestration-hook`).

## Decisions (settled)

- `CheckoutProvider` wraps `StorefrontInner` inside `CartProvider`.
- `SuccessReceipt.onReset` calls `checkout.reset()` + cart clear.
- `sectorOpen` moved to local `useState` in `StorefrontInner` (UI chrome, not checkout domain).

## Shipped 2026-06-22

- `CartContext` slimmed to `cart`, `addItem`, `removeItem`, `resetCart`.
- `StorefrontInner` calls `useCheckout(vendor, menu)` inside `CartProvider`.
- Stage transitions via `checkout.applyStage` (`open_cart`, `close_cart`, `cancel_ussd`).
- `handlePay` / `handleConfirmPin` deleted; orchestration delegated to hook.
- 84/84 tests green.
