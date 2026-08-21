# Issue 01 — Unified customer app and saved restaurants

Status: ready-for-agent

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

- [ ] New storefronts advertise one ZanTap customer manifest launching the hub;
      the Vendor KDS manifest is unchanged.
- [ ] Generic ZanTap installs have a compatible upgrade path, while legacy
      restaurant endpoints/icons keep launching their storefront with a hub link.
- [ ] One versioned repository supports browser IndexedDB and an in-memory test
      adapter without scattered direct storage calls.
- [ ] Explicit save, first cart addition, checkout start and Order placement
      idempotently save/update a Vendor; passive views do not.
- [ ] Pre-install state carries into the installed app, and install acceptance
      does not navigate away from the current storefront.
- [ ] The one-time ZanTap invitation explains saved restaurants/updates, appears
      only after engagement and does not automatically nag after dismissal.
- [ ] The hub resolves only supplied stable IDs, follows slug changes, sorts by
      recency, searches only saved Vendors and supports confirmed removal.
- [ ] Suspended/missing Vendors remain unavailable and recover on later resolution.
- [ ] Manifest, public resolution, repository, trigger, hub, accessibility and
      responsive tests pass.

## Blocked by

None — can start immediately.
