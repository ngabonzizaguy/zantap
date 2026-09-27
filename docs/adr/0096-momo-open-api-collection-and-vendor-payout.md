# MoMo Open API: Collection through ZanTap, then Vendor payout

Status: accepted (grilled 2026-09-22; Slice 1 storefront checkout + Slice 2 Vendor Transfer persistence / Ops retry wired locally; Commission settings and production cutover still open)

**Context:** Candidate #11 — replace manual USSD “I’ve paid” with MTN MoMo Open API. Owner wants Commission (Ops global + per-Vendor), Vendors paid to their chosen phone or merchant code, subscriptions deferred.

**Decision:** Customer **Collection** always pays ZanTap the menu total. On success the Order is `PAID` and ZanTap immediately starts a **Vendor payout** of (total − Commission). Commission is absorbed by the Vendor (Customer never pays an extra fee line). Money still routes through ZanTap when Commission is off (payout = 100%). Global Commission off is a master kill; when global is on, per-Vendor on/off and % apply (custom % else global default). Fee rounds up to whole RWF; freeze fee + payout amounts at payment time. Payee is dynamic MSISDN or PARTY_CODE from the Vendor’s chosen payout method; block checkout if that payee is missing/invalid. Payout failure keeps the Order `PAID` (Ops/auto-retry). Ops full Customer refund → Order `REFUNDED` (not Cancelled). Global Open API cutover (no long dual-rail in production). Live ticket stays “Paid {total}”; History/metrics show Customer total and Vendor payout. Optional per-Vendor KDS fee reminder (Ops). Minimum order default 1,000 RWF (Ops-editable). Prompt lifetime follows MTN. “Manual commission” means Ops retry/fix tools only — not a second billing mode. Subscriptions out of scope.

**Slice 2 (locked 2026-09-22):** Vendor Transfer refs live on a new `VendorPayout` row per attempt (history kept). Ops retry UI is a Vendor detail **Payouts** tab. Transfer status resolves via webhook **and** `getTransferStatus` on Ops Sync/Retry. Never start a second Transfer while latest is PENDING or SUCCESS.

**Rejected:** Customer pays Vendor first; dual Collection charges; mark PAID only after payout; refund/cancel kitchen on payout failure; per-Vendor Open API mix long-term; auto Vendor clawback in v1; on-ticket fee split for every Vendor.

**Glossary:** `CONTEXT.md` (Collection, Vendor payout, Commission, Commission settings, Fee reminder, Refunded order, Minimum order total).

**Progress:** Gateway Steps 1–4 + Slice 1 checkout + Slice 2 Transfer persist / Ops retry are local. Production remains `MOMO_MODE` default `manual` until owner approves Test B / cutover. Migration `20260922170000_vendor_payout_transfer_refs` not yet applied to prod.
