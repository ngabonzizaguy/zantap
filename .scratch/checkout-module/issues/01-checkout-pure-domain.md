# Extract pure checkout domain (validation + totals)

Status: done

## Parent

PRD: `.scratch/checkout-module/PRD.md`

## What to build

Create `lib/checkout/` with testable pure functions moved out of the UI layer:

- **`validation.ts`** — `canProceedToPay(count, phone, sector, landmark)` (moved
  from `CheckoutSheet.tsx`; same behavior: normalized phone ≥ 10, non-empty sector
  and trimmed landmark, count > 0).
- **`totals.ts`** — `computeCount(cart)`, `computeTotal(cart, menu)`,
  `computeLines(cart, menu)` (logic currently in `CartContext.getCount` /
  `getTotal` / `getLines`).
- **`types.ts`** — `CheckoutLine` and any checkout-specific types shared by UI
  (optional re-export from one place).

Add `lib/checkout/__tests__/` covering validation edge cases and totals math.

Wire minimal call-site updates:

- `CheckoutSheet.tsx` — delete exported `canProceedToPay`; import from
  `@/lib/checkout/validation` if still needed locally, or leave to callers only.
- `Storefront.tsx` — import `canProceedToPay` from `@/lib/checkout/validation`.
- `CartContext.tsx` — delegate `getCount` / `getTotal` / `getLines` to the new
  totals helpers (thin wrappers OK this issue; full cart slimming is issue 03).

Add **Checkout** to `CONTEXT.md` Language (client checkout flow module).

## Acceptance criteria

- [x] `lib/checkout/validation.ts` and `lib/checkout/totals.ts` exist with unit tests.
- [x] `canProceedToPay` is no longer exported from `CheckoutSheet.tsx`.
- [x] `Storefront.tsx` imports validation from `lib/checkout`.
- [x] Cart total/line math uses `lib/checkout/totals` (no duplicated reduce logic).
- [x] `npm test` green (new unit tests + existing suite).
- [x] No visual or behavioral change to the customer checkout UX.

## Blocked by

- None (candidate #2 payment module is done).

## Decisions (settled)

- Pure functions only — no React hook, no `fetch`, no stage machine in this issue.
- `CheckoutStage` type stays in `lib/types.ts` until issue 02.
