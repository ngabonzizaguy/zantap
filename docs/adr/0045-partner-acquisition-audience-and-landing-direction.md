# ADR-0045: Partner-acquisition audience and landing direction

- **Status:** Accepted — partially superseded by ADR-0046 (landing direction is now C-structure + A-hero; revenue model and canonical brand mapping are now decided)
- **Date:** 2026-08-05
- **Branch:** `codex/partner-funnel-direction-a`

## Context

The Phase 1 product audit found that ZanTap already has a functioning ordering and
kitchen product, while its production root still redirects to a demo storefront.
A standalone lead-funnel prototype offers three candidate structures, but its copy
and imagery were framed primarily around restaurant owners.

The owner clarified that the next 90-day objective is recruiting operating partners,
not primarily investor presentation or transaction-volume optimization. The target is
broader than restaurants: it includes small food businesses, small bars, and
individual or home-based food-delivery services. The commercial model remains
undecided.

## Decision

1. Treat **local food businesses** as the acquisition umbrella. Restaurants remain an
   important example, but production marketing must not imply that ZanTap is only for
   conventional restaurants.
2. Use prototype **Direction A — Cinematic service** as the working production
   landing-page direction. It remains subject to detailed funnel/copy decisions before
   implementation.
3. Do not invent pricing, commission, subscription, or permanence claims while the
   revenue model is undecided.
4. The production landing page and existing product will use logo/favicon assets from
   `public/brand/`. The exact canonical file mapping is intentionally left unresolved
   because that directory currently contains both the older medallion and the approved
   black-and-amber Z system; the owner must identify which set applies to which surface.
5. No production implementation begins until the remaining acquisition questions are
   answered and the result is converted into a PRD and isolated issues.

## Consequences

- Landing-page copy should say “food businesses” or name multiple relevant business
  types rather than repeatedly saying “restaurants.”
- Direction A's existing Kigali restaurant scene can remain a candidate hero asset,
  but the complete page must demonstrate that the service also fits bars and
  home-based delivery businesses.
- The lead form, CTA destination, launch geography/language, and pilot offer still need
  owner decisions.
- Brand cleanup across the current product is likely, but no asset replacement is
  authorized until the canonical files are confirmed.

## References

- `.scratch/product-architecture-audit/audit-2026-08-05.md`
- `.scratch/product-architecture-audit/issue-01.md`
- `.scratch/lead-funnel-prototype/NOTES.md`
- `.scratch/lead-funnel-prototype/issue-01.md`

