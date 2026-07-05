# Issue 22-04 — Drivers tab + Store CRUD

Status: **Done** · Priority: 4
Boundary: Store + KDS UI
Feature: candidate #22

## Goal

Replace bottom-nav **Setup** with **Drivers**. Vendors add/edit/remove drivers
(name + phone). Hamburger `SetupDrawer` unchanged.

## What to build

### Store seam

- `createDriver(vendorSlug, { name, phone })` — canonicalize phone (reuse
  `canonicalizePhone` / Rwanda E.164 pattern from recovery/MoMo).
- `updateDriver(vendorSlug, driverId, { name?, phone? })`
- `deleteDriver(vendorSlug, driverId)`
- Derive `initials` + `hue` on create (existing seed pattern).
- Owner-token guarded server actions in `lib/actions/vendor-drivers.ts`.
- Prisma + in-memory adapters; contract tests.

### KDS UI (match owner mockup — `ui-spec.md`)

- `KdsTab`: `"setup"` → `"drivers"`; active tab = orange pill + delivery icon.
- `DriversPanel`:
  - Sub-header: **Drivers** title
  - Search bar (client filter name/phone)
  - Status filter: disabled **Soon** (no fake Online/Busy/Offline)
  - Rows: initials avatar (`hue`), name, `formatPhoneDisplay`, edit (pencil), ⋮ delete
  - Purple FAB **+ Add driver** → add sheet (name + phone)
  - Edit sheet reuses add pattern
- Empty state when no drivers.
- Owner token via `useOwnerToken` (never prompt).
- Deep links: `?tab=setup` → `?tab=drivers` where appropriate (`LiveStep`, recovery, etc.).

### Unchanged

- Hamburger in `MetricsBanner` → still opens `SetupDrawer` (profile, checklist).
- `?tab=setup` deep links → migrate to `?tab=drivers` where appropriate, or
  `orders` per 22-03 cap rules.

## Files

| Area | Paths |
|------|-------|
| Store | `lib/store/types.ts`, `prisma.ts`, `in-memory.ts`, `__tests__/contract.ts` |
| Actions | `lib/actions/vendor-drivers.ts` (new) |
| UI | `components/vendor/Tabs.tsx`, `DriversPanel.tsx` (new), `KdsDashboard.tsx` |
| Links | `components/onboard/steps/LiveStep.tsx`, `RecoverAccessDialog.tsx`, etc. |

## Acceptance

- [x] Bottom nav: Orders | Menu | History | **Drivers** (no Setup tab)
- [x] Add driver with name + phone persists after refresh
- [x] Edit + delete driver works; owner-token guarded
- [x] Hamburger still opens full Setup drawer
- [x] Contract tests for driver CRUD green
- [x] `npm run build` clean

## Unblocks

22-05 (assignment needs drivers in DB).
