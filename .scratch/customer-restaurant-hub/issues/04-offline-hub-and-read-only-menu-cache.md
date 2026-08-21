# Issue 04 — Offline hub and read-only menu cache

Status: ready-for-agent

## Parent

`.scratch/customer-restaurant-hub/PRD.md`

## What to build

Serve the last successful saved-Vendor, update-summary and previously visited
public-menu read models offline from the versioned device repository. Offline
state is explicitly stale and read-only: customers may inspect restaurants and
menus, but cart mutation, Order creation, checkout and payment remain blocked.
Service-worker caching is limited to the customer shell and approved public
data and never absorbs API, SSE, payment or authenticated KDS traffic.

## Acceptance criteria

- [ ] Hub renders cached Vendor/update summaries offline with offline/stale and
      last-refresh labels.
- [ ] Previously visited menus render cached public data with `Last updated…`;
      never-visited menus fail clearly.
- [ ] Offline menus cannot mutate cart, create an Order, start checkout or payment,
      or call a Server Action.
- [ ] Reconnection refreshes live truth without losing saved/seen state.
- [ ] Service-worker versions update/discard customer caches safely and do not
      change the separate KDS runtime.
- [ ] API, SSE, payment, owner-token, Operator and authenticated responses never
      enter Cache Storage or customer device state.
- [ ] Storage clearing/unavailability degrades safely and explains the local-only boundary.
- [ ] Repository, worker, transitions, stale labels, checkout blocking,
      accessibility and responsive tests pass.

## Blocked by

- Issue 01 — Unified customer app and saved restaurants
- Issue 03 — Update tray, viewer and aggregate analytics
