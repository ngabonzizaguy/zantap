# Issue 03 — Commission settings + fee snapshot

**Status:** partial · on `main` `9329ddf` 2026-09-28 (Production deploy claimed by `2f0d673`; no `dpl_` ID recorded) · fee snapshot write + snapshot payout still open  
**Candidate:** #11 MoMo Open API · Slice 3  
**ADR:** `docs/adr/0096-momo-open-api-collection-and-vendor-payout.md`  
**Grill:** `.scratch/momo-open-api/grill-decisions-2026-09-22.md` (Q3, Q6, Q11–Q15, Q18, Q21)

## Goal

Ops controls Commission (global master + per-Vendor on/off/%). On payment success, freeze fee + Vendor payout on the Order. Transfer uses snapshotted payout (= total − fee, fee rounds up). Customer still pays menu total.

## Acceptance

- [x] `CommissionSettings` singleton: globalEnabled (default off), globalDefaultPercent, minimumOrderTotalRwf (default 1000)
- [x] Vendor: commissionEnabled (default true), optional commissionPercent, feeReminderEnabled (default false; KDS UI deferred)
- [ ] Order snapshot at first PAID: commissionFeeRwf, vendorPayoutAmountRwf, commissionPercentApplied — columns + pure `computeCommissionSnapshot` exist on `main`, but no Store path writes them (reconcile 2026-09-29)
- [x] Pure fee math: round fee **up**; payout = max(0, total − fee); global off → 0 fee
- [ ] `initiateVendorPayoutForOrder` transfers snapshot (fallback totalAmount if null — legacy) — on `main` it still transfers `payment.amount` (doc comment: "Commission snapshot not applied yet") (reconcile 2026-09-29)
- [x] Ops Settings: Commission form; Vendor detail: Commission controls
- [x] createOrder rejects below minimum order total
- [x] Unit + Store contract tests; local gate green
- [ ] **Not** Test B / commit / deploy / Production MOMO_MODE without owner ask

## Out of scope this slice

- KDS fee reminder UI (flag only)
- Live ticket fee split (Q11)
- Refunds / clawback
- Prod cutover
