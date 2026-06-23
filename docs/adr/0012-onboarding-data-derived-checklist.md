# ADR-0012: Data-derived onboarding checklist with localStorage coachmarks

Date: 2026-06-23
Status: Accepted

## Context

Less-technical vendors need in-app setup guidance on the KDS without adding
auth, schema migrations, or per-device server state. Guide completion must stay
correct when the vendor configures menu, photos, kitchen, and orders from any
device.

## Decision

- **Checklist completion** derives from existing Store reads in one composed
  call (`loadOnboardingState` / `deriveOnboardingState`): menu count, any item
  with `images`, `isKitchenOpen`, and order statuses (`PAID+`, `DISPATCHED+`).
  No Prisma models or Store interface changes for guide progress.
- **Client live updates** reuse the KDS snapshot (`menu`, `kitchenOpen`,
  `orders`) via SSE; opening the Setup drawer optionally refreshes from the
  server action for full `listOrders` accuracy.
- **Coachmark dismissal** persists in `localStorage` only
  (`zantap:kds-coachmark-<id>`). Reopen via Setup drawer “Show tips again”
  clears keys and dispatches a client event — no server writes.
- **UI:** `SetupDrawer` (side panel) + persistent `?` FAB; coachmarks anchor to
  `data-coachmark-target` on kitchen toggle, Menu “+ Add item”, and dispatch
  button.

## Consequences

- Checklist is cross-device correct because it reflects real data, not local
  flags.
- Coachmark “seen” state is per-browser; acceptable until real auth + prefs.
- Pure `deriveOnboardingState` is unit-testable without DB; server action bundles
  Store reads to avoid N+1 from the client.
