# ADR-0059 — Per-storefront PWA install manifest (customer side)

Date: 2026-08-14
Status: Accepted
Amended: 2026-08-15 (narrowed app scopes + install-hint acceptance)
Extends: ADR-0051 (PWA baseline)

## Context

The PWA baseline (ADR-0051) shipped a root manifest (`app/manifest.ts`,
`start_url: /`) and a per-vendor KDS manifest
(`app/vendor/[slug]/manifest.webmanifest/route.ts`, starts at the KDS route).
Storefront pages inherited the root manifest, so a customer installing from
`zantap.app/{slug}` got a generic "ZanTap" app that launched into the
marketing page — not the restaurant they were ordering from. The owner wants
both sides (customer storefront and vendor KDS) installable with a native
feel.

## Decision

Give each active storefront its own manifest, mirroring the KDS pattern:

- **Pure builder** `lib/pwa/storefront-manifest.ts` —
  `buildStorefrontManifest(vendor)` returns `id`/`start_url` = `/{slug}`,
  `name` = vendor name, `short_name` derived by a 12-char word-boundary
  truncation, description = vendor description or generic fallback, light
  editorial theme (`#f5f5f5`), standalone display. Unit-tested without a DB.
- **Thin route** `app/[slug]/manifest.webmanifest/route.ts` — reads the
  vendor through the Store seam; 404 for missing or suspended
  (`!isActive`) vendors; 1h cache + SWR headers like the KDS route.
- **Layout metadata** `app/[slug]/layout.tsx` — links the per-storefront
  manifest and sets `applicationName`/`appleWebApp.title` to the vendor
  name (iOS install title). Missing/suspended vendors return empty metadata
  and keep the root manifest.

Launcher icons stay on the approved-Z set for all manifests: vendor
logos are not guaranteed square, opaque, or maskable-safe. Per-vendor
launcher icons are a possible future refinement with validation.

Keep each installed surface inside its own navigation scope:

- root ZanTap marketing app: `/`;
- customer storefront app: `/{encodedSlug}`;
- vendor KDS app: `/vendor/{encodedSlug}`.

Manifest `id` still provides stable installed-app identity, but it does not
replace scope isolation. The former shared `/` scopes let an installed root or
KDS app claim storefront URLs and could suppress a distinct storefront install.

Both customer and KDS surfaces mount the shared `InstallHintBanner`. It is a
one-time hint per surface, suppressed in standalone mode, and never requests
notification permission. Chromium's `beforeinstallprompt` drives the real
Install action and auto-hides after five seconds; iOS receives delayed
Add-to-Home-Screen instructions and an eight-second reading window. Restricted
storage falls back to once per pageview rather than suppressing the hint.

## Consequences

- Customers install "<Restaurant>" launching into `/{slug}`; vendors install
  "ZanTap Kitchen" launching into `/vendor/{slug}`; the marketing root keeps
  the generic "ZanTap" manifest.
- Storefront and KDS installs no longer claim the root or each other's routes;
  the root marketing app remains the only manifest with `/` scope.
- Install guidance is visible but non-blocking, surface-specific, and absent
  after installation.
- One extra `getVendorBySlug` read per storefront render (layout
  `generateMetadata`) — indexed lookup, accepted.
- Service worker unchanged; notifications remain out of scope (Issue 09b
  covers the in-app KDS chime; Web Push would be a separate grilled issue).
- Verification: 7 new unit tests green (full suite 314/102), lint + `next
  build` clean; local smoke — vendor manifest JSON 200, unknown slug 404,
  storefront HTML links `/{slug}/manifest.webmanifest`.
- 2026-08-15 follow-up verification: 16/16 focused PWA tests cover the
  storefront builder, encoded KDS route scope, and install-hint lifecycle;
  TypeScript, lint, and the production build are clean.
- Production release `61c4687` + docs `aafdd47` deployed as
  `dpl_ETqURpRh9qFyGPZyJBxXtNY5yg1y` on 2026-08-15. Live storefront and KDS
  manifests expose their narrowed scopes; both client bundles contain the
  install-hint behavior; core routes and deployment error/5xx scans are clean.
- Physical-device acceptance passed 2026-08-15: Android Chrome installed the
  storefront and KDS as coexisting apps, both launched in standalone mode with
  install guidance suppressed, and both retained the explicit offline fallback
  in airplane mode; iOS Add to Home Screen also passed.
- Acceptance closeout documentation commit `06ac77a` shipped to `main` on
  2026-08-16 and deployed as `dpl_4PxCbQZ8E2HCcvDDFBTs75jMUWea` on
  `zantap.app`. Core route statuses, both narrowed manifest scopes, and the
  release-window log scan passed.
