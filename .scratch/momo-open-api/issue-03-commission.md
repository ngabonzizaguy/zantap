# Issue 03 — Commission settings + fee snapshot

**Status:** done · committed & deployed · 2026-09-28  
**Candidate:** #11 MoMo Open API · Slice 3  
**ADR:** `docs/adr/0096-momo-open-api-collection-and-vendor-payout.md`  
**Grill:** `.scratch/momo-open-api/grill-decisions-2026-09-22.md` (Q3, Q6, Q11–Q15, Q18, Q21)

## Goal

Ops controls Commission (global master + per-Vendor on/off/%). On payment success, freeze fee + Vendor payout on the Order. Transfer uses snapshotted payout (= total − fee, fee rounds up). Customer still pays menu total.

## Acceptance

- [x] `CommissionSettings` singleton: globalEnabled (default off), globalDefaultPercent, minimumOrderTotalRwf (default 1000)
- [x] Vendor: commissionEnabled (default true), optional commissionPercent, feeReminderEnabled (default false; KDS UI deferred)
- [x] Order snapshot at first PAID: commissionFeeRwf, vendorPayoutAmountRwf, commissionPercentApplied
- [x] Pure fee math: round fee **up**; payout = max(0, total − fee); global off → 0 fee
- [x] `initiateVendorPayoutForOrder` transfers snapshot (fallback totalAmount if null — legacy)
- [x] Ops Settings: Commission form; Vendor detail: Commission controls
- [x] createOrder rejects below minimum order total
- [x] Unit + Store contract tests; local gate green
- [ ] **Not** Test B / commit / deploy / Production MOMO_MODE without owner ask

## Out of scope this slice

- KDS fee reminder UI (flag only)
- Live ticket fee split (Q11)
- Refunds / clawback
- Prod cutover
