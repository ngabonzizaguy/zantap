# Issue 01 — ZanTap Briefing viewer page

Status: **✅ DONE · committed · pushed · deployed · production-smoked 2026-08-27**

Implement the first viewer-facing `/briefing` vertical slice from the approved
discovery decisions. This issue deliberately excludes the permanent Ops CMS and
per-recipient Access-grant persistence; those remain a separate backend slice.

- [x] Protected preview gate is server-enforced and expires.
- [x] Mobile-first cinematic viewer uses authentic ZanTap product captures; generated marketing scenes are labeled atmospheric/conceptual.
- [x] Universal narrative excludes Ops completely.
- [x] Expandable documentation, viewer notice, watermark, and countdown work.
- [x] GSAP/Three.js motion respects reduced motion and cleanup.
- [x] Express-interest ending is usable without inventing a new persistence path — prepared `mailto:` handoff.
- [x] `/briefing` is reserved from Vendor slugs, noindexed, and excluded in robots.
- [x] Focused tests, lint, typecheck/build, and responsive visual QA pass.
- [x] Product imagery was refreshed after owner review: the retired Drivers-era
  KDS capture is excluded; the live composition uses the current storefront and
  current Inventory dashboard from `public/brand/UI-screens/new-UI-screens & video walkthrough/`.

## Release evidence

- Commit/push: `dbfaf74` on `codex/customer-restaurant-hub`.
- Production: `dpl_CNgdjjhspB7EmWBjxhEW9AxD8hov` → `zantap.app`.
- Production configuration: temporary preview secret (Sensitive), recipient
  label, and 72-hour expiry ending `2026-08-30T14:05:44+02:00`.
- Local verification: production build passed; 66 test files passed, 424 tests
  passed / 117 intentionally skipped; focused lint clean; TypeScript clean.
- Browser QA: 390×844 and 1440×1000; no horizontal overflow, zero browser
  warnings, five expandable documentation panels, one Three.js canvas; gate
  unlock and countdown/watermark verified.
- Production smoke: `/briefing` 200; unauthenticated HTML contains gate and
  `noindex` but not protected hero content; `robots.txt` disallows `/briefing`;
  live secret unlock navigated successfully to the Briefing.
- Screenshot correction: `849a04b` → Production
  `dpl_BT2yJP1YADmHU9D7etNoDabJbfYr` on `zantap.app`. Live Playwright QA
  confirmed the current storefront + selected Inventory screen, zero driver UI,
  zero browser errors, and an empty exact-deployment Vercel error scan.

## Deliberate boundary

This issue ships the viewer page with an isolated environment-backed preview
gate. The permanent per-recipient Access-grant persistence, structured Ops
editor, immutable Briefing versions, activity history, and durable Briefing
interest inbox are not implemented yet and must replace/extend this preview seam
in later isolated issues.
