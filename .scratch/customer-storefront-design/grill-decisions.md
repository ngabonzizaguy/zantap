# Candidate #10 — Customer storefront → DESIGN.md — Grill decisions

Date: 2026-07-07
Session: owner direction (post-#12 deferral)

## Decisions

1. **Design source:** ElevenLabs editorial system — **`DESIGN.md`** at repo root (already
   installed; tokens in `tailwind.config.ts`, primitives in `components/ui/primitives/`).
   No separate owner mockups required. Match KDS/onboarding light editorial language:
   off-white canvas, warm ink, pastel `GradientOrbs`, near-black pill CTAs, display
   weight 300 (EB Garamond / Instrument Serif substitute).

2. **Scope:** Customer View only — `/[vendor-slug]` storefront (Hero, menu, cart,
   checkout, customize sheet, success, manual MoMo). **KDS stays `.kds-dark`**;
   no functional changes to checkout, MoMo, or cart logic — visual/token migration only.

3. **Legacy palette:** Retire `zt-*` blush-glass from customer components as surfaces
   migrate (same pattern as `zk-*` removal on KDS). Do not add new `zt-*` code.

4. **Domain:** Owner will buy a **new domain** (not `zantap.ai`). Public URL cutover is
   **env-only** when the domain is live:
   - `NEXT_PUBLIC_BASE_URL` → new origin
   - `ZANTAP_OPERATOR_API_URL` → `https://<new-domain>/api/operator/v1`
   - `lib/base-url.ts` seam already exists (ADR-0032); no hardcoded domain in link code.

5. **#12 auth:** Deferred (ADR-0040). This migration must not introduce customer login
   or change vendor owner-token / KDS behavior.

## Implementation note (next session)

Slice vertically (one component or flow per issue): e.g. shell + `Storefront` → `Hero` →
`MenuItemCard` → checkout sheets → customize modal. Run prod curl smoke per slice
(storefront 200, zero `zt-*` on migrated routes, no `kds-dark` on customer pages).
