# Issue C — KDS upgrades (polish, Stock, Profit)

**Status:** DONE · SHIPPED 2026-08-14 (`7d87984` → main → `zantap-ozp9b64ja` → `zantap.app`; migration applied; prod smoke PASS) · FOLLOW-UP AUDITED 2026-08-15, owner approval pending
**Branch:** `feat/ops-kds-marketing-batch`  
**ADR:** 0055 (stock), 0056 (flags)

## Checklist

### Polish
- [x] Clickable Setup guide steps → open correct modal/screen
- [x] NEW-stage pulsing badge on tickets
- [x] Order line items show first menu image (fallback icon)
- [x] WhatsApp notify CTA gated by feature flag
- [x] Export: exported-rows total + all-time paid revenue line

### Stock
- [x] Replace Drivers tab with Stock tab; Drivers management in Setup guide
- [x] Dish-level optional stock + low threshold; auto-decrement on PAID
- [x] Storefront Sold out at 0; items without stock unchanged
- [x] KDS low-stock alerts (badge/banner)

### Know Your Profit
- [x] Eye icon on Today's gross + same-weekday glow benchmark
- [x] Profit screen: revenue, expenses, margins
- [x] Per-dish cost price + expense log
- [x] Ops visibility into stock + profit per vendor

## Proposed follow-up slices — not approved or implemented

- [ ] Make the Profit eye prominent with a dedicated brand-gold gradient glyph;
  this is a scoped exception to ADR-0051's single-`currentColor` icon rule.
- [ ] Change the Stock semantic icon from generic `Package` to an
  inventory-specific checked-box/boxes glyph.
- [ ] Replace vendor-facing `COGS` with `Food costs` and `Item margins` with
  `Profit by menu item`; label the percentage as `You keep X%`.
- [ ] Add feature flags to the lightweight KDS SSE revision and reconcile open
  Stock/Profit UI when a flag is disabled. Current full snapshots contain the
  flags, but the revision omits them, so no live snapshot is emitted.
- [ ] Define monetizable Stock/Insights tiers in a separate PRD/ADR before
  extending ADR-0055's intentionally dish-count-only v1.
- [ ] Browser-test every Setup-guide destination and keyboard activation; the
  local two-file wiring remains partial and unapproved.
