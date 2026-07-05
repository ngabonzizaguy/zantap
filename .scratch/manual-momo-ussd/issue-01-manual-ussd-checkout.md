# Issue 01 — Manual MTN MoMo USSD checkout

Status: **done · deployed · prod-smoked 2026-07-05**

## Checklist

- [x] `OrderStatus.CANCELLED` migration + Prisma/types
- [x] Store verbs: `confirmManualPayment`, `abandonManualPayment`, `findResumableManualOrder`
- [x] USSD builder + vendor payout validation
- [x] `MOMO_MODE` (local `simulate`, prod `manual`)
- [x] Checkout stages + `ManualMomoSheet` UI (dial, awaiting, countdown, resume)
- [x] History filter/export for `CANCELLED`
- [x] ADR-0033 + `CONTEXT.md`
- [x] Tests 219/70 + `npm run build` clean
- [x] Deploy migration `20260705120000_order_status_cancelled`
- [x] Prod smoke: mobile Pay → Open MoMo → I've paid → KDS; Didn't pay → History Cancelled

## Notes

- Demo seed `momoCode` updated to `880001` (6-digit merchant code).
- Prod `inka-steakhouse` updated from legacy `INKA001` → `880001` (6-digit merchant code) before smoke.
