# ADR-0059 — Per-storefront PWA install manifest (customer side)

Date: 2026-08-14
Status: Accepted
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

`scope` stays `/` (same as the KDS manifest); installed-app identity is
disambiguated by the manifest `id`, which Chromium uses since the `id`
member shipped.

## Consequences

- Customers install "<Restaurant>" launching into `/{slug}`; vendors install
  "ZanTap Kitchen" launching into `/vendor/{slug}`; the marketing root keeps
  the generic "ZanTap" manifest.
- One extra `getVendorBySlug` read per storefront render (layout
  `generateMetadata`) — indexed lookup, accepted.
- Service worker unchanged; notifications remain out of scope (Issue 09b
  covers the in-app KDS chime; Web Push would be a separate grilled issue).
- Verification: 7 new unit tests green (full suite 314/102), lint + `next
  build` clean; local smoke — vendor manifest JSON 200, unknown slug 404,
  storefront HTML links `/{slug}/manifest.webmanifest`.
