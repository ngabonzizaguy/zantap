# Issue 01 — Product and architecture audit

Status: **ready-for-agent — Phase 1 + full owner interview complete (ADR-0046); next = PRD + issues**

- [x] Read repository instructions, product glossary, design authority, ADRs, roadmap, and operational notes.
- [x] Map production routes, product surfaces, Store architecture, data model, and test coverage.
- [x] Review representative onboarding, storefront, KDS, landing-funnel, and approved-brand assets.
- [x] Audit PWA, SEO, accessibility, responsive, performance, authentication, payment, and notification readiness from source.
- [x] Verify `npm run lint`, `npx tsc --noEmit`, `npm test`, and `npm run build`.
- [x] Record Phase 1 findings in `audit-2026-08-05.md`.
- [x] Owner answers Interview Group 1 (launch objective, business model, brand authority, and landing direction).
- [x] Record the approved acquisition audience and Direction A in ADR-0045.
- [x] Owner answers Interview Groups 2–4 (domain, recovery, payment verification, lead workflow, design authority, positioning, PWA scope, vendor fields, offline conflict model, sequencing, notifications, language) — recorded in **ADR-0046** on branch `product/restructure-audit`.
- [x] Confirm the exact canonical logo/favicon files within `public/brand/` — the approved black-and-amber Z (`public/brand/approved-z/`) is product-wide (ADR-0046 §4); the medallion is retired.
- [x] Create a separate branch before recording or implementing approved decisions (`product/restructure-audit`, supersedes `codex/partner-funnel-direction-a`).
- [ ] Convert approved priorities into a PRD (`/to-prd`) and isolated implementation issues (`/to-issues`).

## Interview decision summary (full detail in ADR-0046)

1. 90-day goal: recruit Kigali food-business partners.
2. Offer: free guided setup now → per-order commission long-term.
3. Brand: black-and-amber Z product-wide (replace medallion in app/onboarding/favicon).
4. Landing: prototype C structure + A cinematic hero.
5. Domain: buy **zantap.app** (canonical origin).
6. Recovery: operator-gated manual reissue only (no self-serve slug+phone).
7. Payments: vendor-verification state for manual MoMo ("customer says paid" ≠ verified).
8. Leads: Store → Postgres → ops-console inbox → WhatsApp follow-up.
9. Design authority: rewrite `DESIGN.md` to codify live reality (no repaint).
10. Positioning: any local food business, Rwanda-first.
11. PWA: manifest + install + read-only shell + offline queue for kitchen-stage moves only (server wins).
12. Vendor fields: hours/open-state first, then delivery zones & fees.
13. Notifications: KDS chime for pilot; push/WhatsApp later.
14. Language: English-only pilot, i18n-ready copy.
15. Sequencing: brand+domain+funnel → trust hardening → PWA+hours → rest.

ADR-0045 records the audience decision; ADR-0046 supersedes its provisional
Direction A and resolves its open items. No application code has been changed.
