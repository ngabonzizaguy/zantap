# Vendor onboarding guides — Setup drawer, checklist, coachmarks

Status: done

## Parent

PRD: `.scratch/kds-vendor-suite/PRD.md`  
Grill: `.scratch/kds-vendor-suite/grill-decisions.md`

## Scope (one session)

Ship a `SetupDrawer` with data-derived checklist, dismissible coachmarks on key KDS
controls, and a persistent "?" affordance. **No server schema** for guide progress —
completion derives from Store reads; dismissals in `localStorage` only.

## What to build

### Setup drawer

- Component: `components/vendor/SetupDrawer.tsx` (primitive kit styling).
- Opens from **Setup** nav tab and/or persistent "?" FAB in KDS chrome.
- Includes write-secret entry row (if not already in Issue 01 prompt).

### Checklist steps (auto-complete from Store)

| Step | Complete when |
|------|----------------|
| Add a menu item | `getMenu(slug).length > 0` |
| Add a photo | any active item has `images?.length > 0` |
| Open kitchen | `isKitchenOpen(slug) === true` |
| Receive first order | any order with status in `PAID \| DISPATCHED \| COMPLETED` |
| Dispatch an order | any order `DISPATCHED` or `COMPLETED` |

Server read helper or RSC props bundle checklist booleans in one call (avoid N+1).

### Coachmarks

- Lightweight anchored tooltips on first visit:
  - Menu "+" (create item)
  - Kitchen open/close toggle
  - Dispatch button on order ticket
- Dismissal keys: `zantap:kds-coachmark-<id>` in `localStorage`.
- Reopen via "?" clears nothing unless user explicitly "Show tips again" (optional).

### Nav

Ensure **Setup** tab or "?" is wired in `KdsDashboard` (four-section IA complete).

### No new Store writes

Read-only composition of existing Store methods (+ optional thin `getOnboardingState(slug)` helper in `lib/vendor/onboarding.ts` that calls Store — not a Store interface change unless unavoidable; prefer composing existing reads in a server helper).

## Files touched

| Area | Paths |
|------|-------|
| UI | `components/vendor/SetupDrawer.tsx`, `components/vendor/Coachmark.tsx` (new), `components/vendor/KdsDashboard.tsx`, `components/vendor/Tabs.tsx` |
| Server helper | `lib/vendor/onboarding.ts` (new), `lib/actions/vendor-guides.ts` (optional read action) |
| Write-secret UI | may extend `lib/vendor/useWriteSecret.ts` if setup row lives here |

**Avoid:** new Prisma models, guide progress tables.

## Acceptance criteria

- [x] Checklist steps reflect live Store state (refresh on tab open or SSE tick).
- [x] Steps auto-check without manual "mark done".
- [x] Coachmarks show once per key; dismiss persists across reload.
- [x] "?" reopens Setup drawer from any KDS tab.
- [x] Four-section nav complete: Orders | Menu | History | Setup.
- [x] Styled with primitive kit only.
- [x] `npm test` green if helper unit tests added; `npm run build` passes.

## Test plan

1. **Unit (optional):** `getOnboardingState` with mocked Store returns correct booleans per fixture.
2. **Build:** `npm run build`.
3. **Manual dev smoke:**
   - Fresh vendor / empty menu → checklist shows incomplete steps.
   - Create menu item (Issue 01) → step 1 checks.
   - Add photo (Issue 02) → step 2 checks.
   - Open kitchen → step 3 checks.
   - Complete customer order → steps 4–5 progress.
   - Dismiss coachmark → does not reappear after reload.
   - "?" opens drawer.

## Blocked by

- Issue 00 (`design-system-foundation`) — drawer + coachmarks use primitives.
- Issue 01 (`menu-crud-store-and-ui`) — checklist reads menu; coachmark targets Menu "+".

**Soft dependency:** Issue 02 for photo step (step shows incomplete until 02 shipped — acceptable).

## Unblocks

- Candidate #6 batch-level acceptance (guides item).

## Comments
