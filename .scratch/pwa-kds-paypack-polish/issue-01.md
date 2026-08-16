# Issue 01 — PWA, KDS, icon, and Paypack preparation

Status: **DONE · install-hint/scope follow-up SHIPPED 2026-08-15 (`61c4687` + docs `aafdd47` → `dpl_ETqURpRh9qFyGPZyJBxXtNY5yg1y` → `zantap.app`) · prod smoke PASS · Android/iOS physical-device acceptance PASS 2026-08-15** · Baseline `0b685ea` + `1cf4a5a`

Acceptance closeout shipped 2026-08-16 as documentation commit `06ac77a` →
Production `dpl_4PxCbQZ8E2HCcvDDFBTs75jMUWea` → `zantap.app`. Core routes retained
their expected 200/307 statuses, both narrowed manifest scopes remained correct,
and the release-window logs contained only successful/info requests.

Approved follow-up 2026-08-15 (shipped in isolated release `61c4687`; no
migration; production deployment `dpl_ETqURpRh9qFyGPZyJBxXtNY5yg1y`): the install-hint
banner and narrowed storefront/KDS manifest scopes were isolated from the
preserved dirty tree. `lib/pwa/install-hint.ts` now owns the
browser lifecycle behind the interface used by `InstallHintBanner`; 8 behavior
tests cover prompt capture/install, auto-hide, iOS instructions, manual and
`appinstalled` dismissal, standalone suppression, and independent storefront/KDS
seen buckets. A direct KDS route test locks encoded `id`/`start_url`/`scope`.
ADR-0059 now records the narrowed scopes and approved install-hint behavior.
Verification: focused PWA 16/16, TypeScript, lint, and production build clean.

Physical-device acceptance PASS 2026-08-15: Android Chrome storefront + KDS
install/coexistence, standalone suppression, and airplane-mode smoke; iOS
Add-to-Home-Screen smoke.
Web Push remains a separate grilled PRD/ADR and is not part of this slice. The
owner authorized commit, push, and production deployment of this PWA slice only;
no migration or production-data mutation is part of the release.

Production smoke: `/`, storefront, KDS, and `/onboard` returned 200; `/ops`
retained its expected 307 auth redirect. Storefront manifest scope is
`/inka-steakhouse`; KDS manifest scope is `/vendor/inka-steakhouse`; both live
client bundles contain the install-hint copy. Deployment error-level and 5xx
log scans were empty. The owner subsequently confirmed the complete
physical-device acceptance matrix PASS.

- [x] Add InstallHintBanner lifecycle behavior coverage.
- [x] Add KDS manifest-scope route coverage.
- [x] Reconcile ADR-0059 and this issue with narrowed scopes and install hints.
- [x] Run focused PWA tests, TypeScript, lint, and production build.
- [x] Complete Android Chrome and iOS physical-device acceptance.

Follow-up 2026-08-14 (ADR-0059, SHIPPED same day in `7d87984` → `zantap.app`,
prod smoke PASS — manifest JSON 200, unknown slug 404, HTML links per-slug
manifest): per-storefront install manifest.
`lib/pwa/storefront-manifest.ts` (pure builder + 7 unit tests),
`app/[slug]/manifest.webmanifest/route.ts` (Store read, 404 on missing/suspended,
1h cache), `app/[slug]/layout.tsx` (manifest link + vendor-name apple title).
Customers now install "<Restaurant>" launching into `/{slug}` instead of generic
"ZanTap" → marketing root. Full suite 314/102, lint + build clean; local smoke:
manifest JSON 200 with vendor name/start_url, unknown slug 404, storefront HTML
links the per-slug manifest. Android install smoke (existing gate) still pending
on the owner's physical device — now covers BOTH the KDS install and a
storefront install once this deploys.

- [x] Fast-forward-check `main` against `origin/main` and branch from the latest local state.
- [x] Research Paypack's official authentication, cash-in, transaction lookup, webhook, idempotency, and rate-limit documentation.
- [x] Persist a ZanTap-specific Paypack integration reference without changing the live manual-MoMo flow.
- [x] Replace the hand-drawn shared UI glyphs with a professional, free, themeable icon library.
- [x] Add the PWA manifest, branded standard/maskable launcher icons, service-worker registration, and explicit offline shell/state.
- [x] Make the KDS help affordance smaller/subtler while preserving a 44 px touch target.
- [x] Turn setup coachmarks off behind an explicit feature flag and hide their reset control.
- [x] Keep deferred Setup Guide rows on the standard card treatment with a textual “Soon” badge.
- [x] Default the KDS queue to newest-first and cover the default in tests.
- [x] Prevent hover/active background fills from sticking over tappable controls on the dark KDS.
- [x] Contain the Orders status chips in the same horizontal swipe rail used by History filters.
- [x] Run targeted tests, lint, full tests, production build, and visual/PWA smoke checks.
- [x] Record decisions in an ADR, update `.scratch/architecture-candidates.md`, commit, and hand off.

Verification: focused tests 9/9; full suite 266 passed / 80 expected
Prisma-gated skips; lint clean; production build clean. Local production visual
checks passed on desktop, 390×844 mobile, and 844×390 landscape with zero app
console errors or horizontal overflow. Root/KDS manifests and service worker
return 200; icons verify at 192×192 and 512×512. Browser automation sandboxes
do not expose the Service Worker API, so Android Chrome install + airplane-mode
fallback remains a physical-device smoke rather than an implementation blocker.

Tap-state follow-up (2026-08-08): the Setup and Help controls no longer resolve
to light editorial fills, and the dark KDS now preserves each control's resting
background through hover/active states. A 390×844 production-browser audit
covered Orders, Menu, History, Drivers, tickets, filters, sorting, stage actions,
Setup (including scrolled settings), Help, and modal controls with stable
before/after computed backgrounds and zero console errors. Lint and production
build are clean.

Setup Guide visual reversal (2026-08-08): owner rejected the grayed block
treatment after visual review. Deferred rows are restored to the pre-`fce8360`
surface, opacity, label, and hint styling; the textual “Soon” badge remains.

Orders filter rail follow-up (2026-08-08): the stage chips now use History's
contained, touch-momentum, snap-scrolling pattern instead of the edge-to-edge
negative-margin rail. Mobile verification confirms the rail scrolls to reveal
Completed while the document stays fixed at viewport width (`window.scrollX=0`).

Main handoff (2026-08-08): only the two PWA/KDS commits were replayed from clean
`origin/main`, producing `0b685ea` + `1cf4a5a`; unaudited durable-leads commit
`2d6e391` was deliberately excluded. `origin/main` now resolves to `1cf4a5a`.
Automatic Production deployment `dpl_6yTBeB4YTo8cdDuBf3ahVgmTS8yn` is Ready and
aliased to `zantap.app`. Root, KDS, both manifests, service worker, offline page,
and launcher assets return 200; manifest launch targets and cache exclusions
verify. Runtime error scan clean.

Scope boundary: this session implements Issue 09a's installable PWA baseline and
offline-safe shell only. The kitchen-stage offline write queue and order chime in
`.scratch/product-restructure/issue-09.md` remain a separate 09b task.
