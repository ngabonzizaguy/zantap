# Commission settings and fee snapshot implementation

**Status:** accepted · implemented 2026-09-28

**Context:** Candidate #11 MoMo Open API Slice 3 adds Commission infrastructure per ADR-0096. Ops needs global and per-Vendor Commission controls with fee snapshot at payment time.

**Decision:** Implement CommissionSettings singleton (globalEnabled, globalDefaultPercent, minimumOrderTotalRwf) and Vendor fields (commissionEnabled, commissionPercent, feeReminderEnabled). On Order PAID, freeze commissionFeeRwf, vendorPayoutAmountRwf, and commissionPercentApplied. Fee math rounds up to whole RWF; payout = max(0, total - fee). Global off = 0 fee. Ops Settings gains Commission form; Vendor detail gains Commission controls. createOrder rejects orders below minimum order total. KDS fee reminder UI deferred (flag only).

**Consequences:** Commission infrastructure ready for production but remains inactive (globalEnabled defaults false). Production still uses MOMO_MODE=manual until owner approves Test B and cutover. Migration `20260927210722_commission_settings_and_vendor_payout` applied to production. All 573 tests passing.

**Related:** ADR-0096 (MoMo Open API Collection and Vendor payout), issue-03-commission.md
