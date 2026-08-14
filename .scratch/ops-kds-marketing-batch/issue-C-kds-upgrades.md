# Issue C — KDS upgrades (polish, Stock, Profit)

**Status:** Done (code on `feat/ops-kds-marketing-batch`; not deployed)  
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
