# ADR-0046: Product restructure decisions from the 2026-08-05 owner interview

- **Status:** Accepted
- **Date:** 2026-08-05
- **Branch:** `product/restructure-audit`
- **Supersedes in part:** ADR-0045 (landing direction, revenue-model openness, brand-mapping openness)

## Context

The Phase 1 product audit (`.scratch/product-architecture-audit/audit-2026-08-05.md`)
identified the launch blockers for broad partner acquisition: no production marketing
funnel, unresolved brand/domain authority, unsafe phone-only owner-token recovery,
customer-self-confirmed payment, and no PWA layer. The owner completed a structured
16-question interview (four groups) covering strategy, trust, design authority, and
scope. These answers resolve every open decision the audit flagged.

## Decisions

### Strategy and offer

1. **90-day objective:** recruit real restaurant/food-business partners in Kigali.
   Not investor presentation; not transaction-volume hardening first.
2. **Commercial model:** free guided setup for early partners now; per-order
   commission is the stated long-term model. Marketing copy may say this.
3. **Positioning umbrella:** any **local food business** (restaurants, bars,
   caterers, home-based delivery), Rwanda-first. Confirms ADR-0045 decision 1.

### Brand and marketing

4. **Product-wide mark:** the approved black-and-amber Z
   (`public/brand/approved-z/`) replaces the older circular food medallion
   everywhere in the product (app header, onboarding, favicon). This resolves
   ADR-0045's unresolved canonical-asset mapping.
5. **Landing direction:** prototype **C's conversion-first structure** (offer +
   visible lead form) combined with **A's cinematic Kigali hero**
   (still + 5s motion loop). Supersedes ADR-0045 decision 2 (Direction A alone).
6. **Public domain:** the owner will buy **`zantap.app`**. It becomes the
   canonical origin (`NEXT_PUBLIC_BASE_URL`), replacing the unresolved
   `zantap.ai` references and the Vercel alias in public-facing links.

### Trust and payments

7. **Owner-token recovery:** retire self-serve slug+phone token reissue. All
   recovery routes through the **operator console** as a manual, human-verified
   flow. (Full vendor accounts/roles remain deferred.)
8. **Payment verification:** add an explicit **vendor-verification state** for
   manual MoMo orders — tickets arrive as "customer says paid" and only count as
   verified after the vendor confirms against their MoMo statement. Live MoMo API
   integration is not scheduled yet.
9. **Lead workflow:** leads persist through the Store seam to Postgres and
   surface in the operator console as a follow-up inbox; the owner follows up via
   WhatsApp/call. No email automation for the pilot (no ZanTap business email yet).

### Design and product surface

10. **Design authority:** rewrite `DESIGN.md` to codify what is actually live —
    one brand foundation (Z mark, amber, typography) with intentional per-surface
    treatments (marketing, dark liquid-glass storefront per ADR-0043, dark
    KDS/onboarding per ADR-0017/0025, ops). No live surface is repainted.
11. **PWA scope:** manifest + installability + read-only cached shell, **plus an
    offline queue limited strictly to kitchen-stage progressions**
    (accept/preparing/ready) with server-state-wins conflict resolution and a
    visible failed-to-sync state. Payments, menu edits, dispatch, and profile
    changes never queue offline.
12. **Vendor fields priority:** business hours/open-state first, then delivery
    zones & fees. Modifiers/ingredients stay deferred.
13. **Notifications:** pilot relies on the installable KDS being open plus an
    audible new-order chime; push/WhatsApp auto-notification is the first
    post-pilot enhancement.
14. **Language:** English-only pilot, but all new copy (funnel, storefront, KDS)
    must be i18n-ready (no hard-coded strings in components) so
    Kinyarwanda/French become translation tasks, not rewrites.

### Sequencing

15. **Ship order:** (1) brand rollout + `zantap.app` + production lead funnel;
    (2) trust hardening (operator-gated recovery + vendor payment verification)
    before the first stranger-vendor signs up; (3) PWA layer + vendor hours;
    (4) everything else per the audit's medium/future list.

## Consequences

- The next artifact is a PRD (`/to-prd`) covering track 1 (brand + domain +
  funnel) and track 2 (trust hardening), sliced into isolated issues.
- `DESIGN.md` rewrite is its own isolated task before or alongside funnel build.
- The lead-funnel prototype is retired once the production funnel ships, per
  `.scratch/lead-funnel-prototype/NOTES.md`.
- `zantap.ai` references in docs/env should be migrated to `zantap.app` once the
  domain is purchased and mapped in Vercel.

## References

- `.scratch/product-architecture-audit/audit-2026-08-05.md` (Phase 1 audit)
- `.scratch/product-architecture-audit/issue-01.md`
- `.scratch/lead-funnel-prototype/NOTES.md`
- ADR-0045 (audience + provisional Direction A — partially superseded)
