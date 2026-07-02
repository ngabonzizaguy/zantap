# ADR-0031: Onboarding polish — photo overflow, payout toggle, recover gold, QR export

Date: 2026-07-02
Status: Accepted (candidate #19, Issue 09)

## Context

Owner punch-list (candidate #19) grilled four onboarding gaps:

- **D1:** Long photo filenames in `QuickMenuStep` pushed the Remove button off-screen
  because `truncate` sat in a flex child without `min-w-0`.
- **D2:** Business phone (`phoneNumber`) and payout destination (`momoCode`) were
  conflated in the Payments step; payout phones were stored without the dial code.
- **D5:** Recover-access entry points blended into muted body copy on the dark wizard.
- **D6:** The storefront QR on "You're Live" was screenshot-only; vendors needed
  Download PNG + Print, also available from KDS Setup.

## Decision

1. **D1 — Photo row:** Add `min-w-0` to the filename flex child; keep Remove as
   `flex-none shrink-0`; reset the hidden file input `value` on Remove so re-selecting
   the same file re-fires `onChange`.

2. **D2 — Business vs payout phone:** Add `payoutSameAsBusiness` (default `true`) to
   wizard state. When payout method is PHONE and the toggle is ON, reuse
   `countryDialCode + phoneLocal`; OFF shows a separate payout phone field. Short notices
   under each field explain business (contact / recovery / call button) vs payment
   (MoMo destination). `handleGoLive` stores `momoCode` as
   `` `${countryDialCode} ${localPart}`.trim() `` for phone payouts.

3. **D5 — Recover gold accent:** Add a `gold` Tailwind token (`#FFD24C` / `#F5A623`) with
   `.kds-dark` remaps. Style Recover-access CTAs on the onboarding splash and KDS Setup
   (inline link + full-width button) with golden-yellow border/background treatment.

4. **D6 — QR export:** Extend `StorefrontQr` with SVG→canvas→PNG download and a print
   helper (new window + `window.print()`). Surface actions on `LiveStep` and a new
   Storefront QR block in `SetupDrawer`. Introduce `lib/vendor/storefront-url.ts`
   (`resolveStorefrontOrigin` / `getStorefrontUrl`) using `NEXT_PUBLIC_BASE_URL` when
   set, else `window.location.origin` — partial seam for Issue 11 (G1).

## Confer scope

- Issue 11 will migrate remaining hardcoded `zantap.ai/` display strings and consolidate
  all link builders on `getStorefrontUrl`.
- Recovery phone matching (D4) was Issue 01 / ADR-0029.

## Consequences

- Phone-payout vendors who use "same as business" no longer lose the dial code in
  `momoCode`.
- Recover access is visually distinct from primary (momo-orange) CTAs without a new
  component library dependency.
- QR rasterization is client-only; no server action or Blob upload for QR assets.
