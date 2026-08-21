# Issue 01 — Unified customer app and saved restaurants

Status: done · owner-requested hub redesign implemented locally · visual approval pending · not deployed

## Parent

`.scratch/customer-restaurant-hub/PRD.md`

## What to build

Replace new restaurant-specific installs with one ZanTap customer app and
deliver `Your restaurants`. Meaningful storefront actions save a Vendor in a
versioned device-local collection keyed by stable ID; the hub resolves current
public identity, follows slug changes, supports recency/search/removal, and
keeps suspended or unreachable Vendors visible as unavailable. The install
invitation appears once only after engagement, later icon launches open the
hub, and existing restaurant-specific and KDS installs remain functional.

## Acceptance criteria

- [x] New storefronts advertise one ZanTap customer manifest launching the hub;
      the Vendor KDS manifest is unchanged.
- [x] Generic ZanTap installs have a compatible upgrade path, while legacy
      restaurant endpoints/icons keep launching their storefront with a hub link.
- [x] One versioned repository supports browser IndexedDB and an in-memory test
      adapter without scattered direct storage calls.
- [x] Explicit save, first cart addition, checkout start and Order placement
      idempotently save/update a Vendor; passive views do not.
- [x] Pre-install state carries into the installed app, and install acceptance
      does not navigate away from the current storefront.
- [x] The one-time ZanTap invitation explains saved restaurants/updates, appears
      only after engagement and does not automatically nag after dismissal.
- [x] The hub resolves only supplied stable IDs, follows slug changes, sorts by
      recency, searches only saved Vendors and supports confirmed removal.
- [x] Suspended/missing Vendors remain unavailable and recover on later resolution.
- [x] Manifest, public resolution, repository, trigger, hub, accessibility and
      responsive tests pass.

## Blocked by

None — can start immediately.

## Completion evidence

- Implemented test-first repository, engagement, public-resolution and hub
  seams, including IndexedDB persistence with a resilient in-memory fallback.
- `npm test`: 377 passed / 110 skipped; `npm run lint`: clean;
  `npm run build`: clean.
- Local browser verification covered passive storefront behavior, explicit
  save, the saved-only hub, refreshed public resolution, responsive two-column
  layout and zero browser errors/overflow.
- Owner walkthrough 2026-08-21: PASS with no failed checks. The owner confirmed
  the Issue 01 local experience after manually exercising the customer flow;
  the saved-restaurant behavior, hub behavior and responsive presentation had
  no reported acceptance failure. Issue 01 remains closed.
  - Passed: the complete requested local Issue 01 walkthrough.
  - Failed: none reported.
- Owner-requested UI/UX refinement 2026-08-21 (ADR-0066): replaced the flat
  collection header and utility cards with a mobile-first restaurant-passport
  composition: editorial split layout on desktop, compact phone header,
  high-contrast saved-place cards, direct `Open menu`, quiet remove action,
  search only when useful, an instructive empty state, safe-area padding and
  reduced-motion handling. No persistence, resolver, install or PWA identity
  semantics changed. The resilient repository now falls back after a bounded
  IndexedDB non-response so restricted browsers cannot leave the hub loading
  forever. Focused accessibility/storage tests, TypeScript, lint, full Vitest
  (378 passed / 110 skipped) and production build are clean. Owner visual
  approval remains pending.
- Issues 02–04 remain untouched. No migration, deployment or production smoke
  was performed.
