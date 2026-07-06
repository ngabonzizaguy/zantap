# ADR-0039: Operator console, Control API, and halting controls

Date: 2026-07-06
Status: Accepted
Builds on: ADR-0022 (owner token, recovery events), ADR-0037 (profile edits)

## Context

Candidate #17 deferred an operator panel. Vendors self-serve via owner tokens with
no platform-level cross-vendor control. `Vendor.isActive` exists but does not block
the customer storefront or checkout. Recovery events are logged with no review UI.

The owner requires full halting intervention and a design that allows Ops to move
to a separate repo/Vercel/Supabase later while Zantap remains system of record.

## Decision

1. **Two-plane architecture.** Zantap exposes `/api/operator/v1/*` (Control API)
   secured by `OPERATOR_API_KEY`. Business logic lives in `lib/operator-control/`
   and calls Store operator verbs only. Ops UI at `/ops` is a thin client via
   `lib/operator-client/` — never imports Store.

2. **Halting enforcement in Zantap core.** When `isActive === false`:
   - Customer storefront shows a suspended page (not 404).
   - `createOrder`, `confirmManualPayment`, and related paths reject.
   - KDS loads with a suspended banner; `kitchenOpen` composite includes `isActive`.

3. **Store operator verbs** — `listVendors`, `setVendorActive`, `operatorUpdateVendor`,
   token revoke/reissue, `operatorUpdateOrder`, `listRecoveryEvents` (cross-vendor),
   `recordOperatorAction`, `listOperatorActions`. Only operator-control may call them.

4. **Audit.** `OperatorAction` table records every operator mutation with action type,
   optional detail JSON, and `operatorId` (default `"platform"` until #12).

5. **Recovery review.** `VendorRecoveryEvent` gains `reviewedAt` and `reviewNote`;
   reviewable via Control API and `/ops/recovery`.

6. **Ops UI auth v1.** `OPERATOR_UI_SECRET` + httpOnly cookie guards `/ops/**`.
   Server-side fetches attach `OPERATOR_API_KEY` — key never reaches the browser.

7. **Design.** ElevenLabs editorial light theme (`DESIGN.md`); desktop-first,
   mobile-responsive; no `.kds-dark` on Ops surfaces.

## Consequences

- Operators can suspend a vendor without the vendor's owner token.
- Future Ops extraction: copy `app/ops/`, `components/ops/`, `lib/operator-client/`;
  point `ZANTAP_OPERATOR_API_URL` at production Zantap; remove co-located `/ops`.
- Candidate #12 real auth supersedes `OPERATOR_UI_SECRET` and can add named operators.
- CORS on Control API denied by default; `OPS_APP_URL` allowlists split deployment.

## Alternatives considered

- **God-mode inside KDS** — rejected; violates customer/vendor separation.
- **Async-only review (ADR-0022 style)** — rejected; owner chose full halting.
- **Ops direct DB access** — rejected; breaks extractability and audit boundary.
