# MoMo Open API callback trust model

**Status:** proposed · drafted by continuity reconcile 2026-09-29 · needs owner decision

**Context:** Candidate #11 MoMo Open API (ADR-0096) added `POST /api/momo/webhook` in `9329ddf` as the MTN `X-Callback-Url` target for both Collection and Disbursement. ADR-0096 records that Transfer status resolves via webhook **and** `getTransferStatus` on Ops Sync/Retry, but no ADR records how an incoming callback is trusted.

**As built on `main` (`9329ddf`):** the route parses the JSON body and passes it to `handleMomoWebhook` with the `X-Reference-Id` header. The handler maps `payload.status` directly (`SUCCESS` / `FAILED` / `PENDING`) and resolves the target by reference header/body, falling back to `externalId` (the Order id). On Collection `SUCCESS` it calls `applyProviderPaymentResult` and then `initiateVendorPayoutForOrder`; on Transfer results it calls `applyVendorPayoutResult`. The handler performs no signature, shared-secret or source check, does not re-query MTN before applying the status, and does not check `MOMO_MODE`. The storefront route `app/api/momo/collection` is gated to `MOMO_MODE=openapi`; the webhook route is not.

**Decision:** open. Options to decide before Production `MOMO_MODE=openapi` (Test B / cutover gate):
- treat callbacks as hints only and confirm with `getRequestToPayStatus` / `getTransferStatus` before any Store write;
- require an unguessable callback secret (path or query token) on `MOMO_WEBHOOK_URL`;
- gate the route to `MOMO_MODE=openapi`;
- or accept the as-built model explicitly.

**Consequences:** until decided, the as-built behaviour is the record. This ADR changes no code.

**Related:** ADR-0096, ADR-0097, `.scratch/momo-open-api/issue-03-commission.md`
