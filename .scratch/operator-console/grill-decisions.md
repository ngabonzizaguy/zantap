# Operator Console — Grill decisions

Date: 2026-07-06
Session: `/grill-with-docs` (Candidate #17)

## Decisions

1. **Primary actor:** Platform operator (ZanTap staff), not vendor self-service expansion.
2. **Intervention severity:** Full halting — suspend storefront, force-close kitchen, revoke/reissue owner token, override profile/menu/orders.
3. **UI shell:** Separate `/ops` route tree — not god-mode inside `/vendor/[slug]`.
4. **Extractability:** Ops UI structured as thin client over Operator Control API; future split to separate repo/Vercel/Supabase without forking vendor data.
5. **Design system:** ElevenLabs editorial (`DESIGN.md`) — light canvas, existing icons/primitives, desktop-first, mobile-responsive.
6. **Control plane:** Zantap owns `/api/operator/v1/*` + Store operator verbs; Ops never imports Store.
7. **Auth v1:** `OPERATOR_API_KEY` (Control API) + `OPERATOR_UI_SECRET` (Ops login cookie); API key never sent to browser.
8. **Suspended storefront:** Visible "temporarily unavailable" page (not hard 404).
9. **Audit:** `OperatorAction` rows in Zantap Postgres on every operator mutation.
10. **Recovery review:** `reviewedAt` / `reviewNote` on `VendorRecoveryEvent` (v1 on Zantap DB).
