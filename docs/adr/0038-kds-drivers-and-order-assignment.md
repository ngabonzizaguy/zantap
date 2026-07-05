# ADR-0038: KDS drivers tab and order driver assignment

Date: 2026-07-05
Status: Accepted

## Context

Vendors need to manage delivery drivers (name + phone), assign READY orders to
drivers for audit trail, and call drivers — without WhatsApp to drivers. The bottom
KDS **Setup** tab duplicated the hamburger setup drawer; owner mockups replace it
with a **Drivers** tab. Storefront share and menu lightbox were owner-requested
polish in the same batch (candidate #22).

## Decision

### Storefront (22-01, 22-02)

- Wire Hero share via `getStorefrontUrl` + `navigator.share` / clipboard fallback.
- `MenuImageLightbox` on thumb tap (`stopPropagation`); customize sheet unchanged.

### Setup visit cap (22-03)

- `localStorage` key `zantap:kds-setup-visits-<slug>`; auto-open `SetupDrawer` max
  **2×** when onboarding checklist incomplete; manual hamburger never increments.

### Drivers (22-04)

- Bottom nav **Drivers** replaces **Setup**; hamburger `SetupDrawer` unchanged.
- Store CRUD: `createDriver`, `updateDriver`, `deleteDriver` (name + phone, E.164
  normalize); owner-token guarded actions in `lib/actions/vendor-drivers.ts`.
- `DriversPanel`: search, Soon status filter, purple FAB add, edit/delete rows.

### Assignment (22-05)

- Migration `Order.driverId` optional FK → `Driver`; `assignedDriver` on domain `Order`.
- `assignOrderDriver` / `bulkAssignOrderDriver` — one driver for all bulk-selected
  READY orders; order **stays READY** (no auto `OUT_FOR_DELIVERY`).
- `AssignDriverModal` replaces WhatsApp `DispatchModal` path; call hint footer.
- Ticket shows assigned driver + `tel:`; separate **Mark out for delivery** button.
- Vendor WhatsApp notify on PAID tickets unchanged (ADR-0028).

### Deferred v1

- Driver Online/Busy/Offline presence (UI shows Soon on filter only).

## Consequences

- Dispatch audit trail is per-order `driverId` in Postgres.
- Legacy `?tab=setup` deep links map to `drivers` tab (drawer not forced open).
- `DispatchModal.tsx` retained but unused — safe to delete in a cleanup pass.
