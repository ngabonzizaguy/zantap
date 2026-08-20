# ADR-0063: Storefront menu paging preserves client cart state

Status: Accepted locally — 2026-08-20 (not deployed)

## Decision

The Customer view filters available Menu items by category and case-insensitive
search before clamping and slicing ten dishes per page. A pure
`lib/menu/storefront-pagination.ts` module owns query parsing, filtering,
clamping, slicing and URL serialization; its interface is the test seam.

The URL keys are `category`, `search` and `page`. Default state is omitted from
the URL, unrelated keys such as `from=kds` are preserved, and invalid category
or page values resolve safely. The server parses the initial URL for refresh and
shared-link rendering. Subsequent customer interactions update browser history
synchronously while the mounted Storefront and `CartProvider` remain in place;
`popstate` restores category/search/page for Back and forward navigation.

Category and search changes return to page 1. Page changes move scroll and
keyboard focus to the `Menu` heading. Empty and one-page result sets retain the
same accessible Previous/Page/Next navigation, with unavailable dishes excluded
before totals and pages are calculated.

## Consequences

- Cart quantities and customization notes survive category, search, page and
  browser-history changes because pagination does not remount the cart module.
- Refreshing or sharing a URL reconstructs the same visible menu page from
  server-provided initial query state; cart state itself remains intentionally
  session-local and is not persisted by this decision.
- The Store continues to return the available menu through its existing seam;
  this UI pagination slice introduces no second data path or migration.
- Production release remains gated on review/application of migration
  `20260820183000_real_vendor_inventory`, one combined deployment and production
  smoke for Issues 01–03.
