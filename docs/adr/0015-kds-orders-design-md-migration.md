# ADR-0015: Migrate KDS Orders tab and shell to DESIGN.md tokens

Date: 2026-06-24
Status: Accepted

## Context

Candidate #6 migrated Menu, History, and Setup to the ElevenLabs editorial system
(ADR-0005). The Orders tab and its chrome (`MetricsBanner`, `OrderTicket`,
`BulkActionBar`, `DispatchModal`, `Tabs`, `KdsDashboard`) still used the legacy
`zk-*` charcoal/orange palette — a jarring tab switch and a violation of the
single-brand mandate.

Candidate #7 added workflow UI (kitchen stages, bulk bar, dispatch modal) on top
of the dark palette. Urgency animation on whole cards caused bounce (fixed in
`a21d91f`); the dot-only pulse pattern must be preserved after migration.

## Decision

Migrate all Orders-tab-specific vendor components and the KDS shell to
`DESIGN.md` tokens and `components/ui/primitives`:

- Light `bg-canvas` shell with `GradientOrbs` (replacing legacy zk orbs).
- Ink pill primary CTAs; outline chips for bulk/stage actions via `Button size="kds"`.
- `Card` / `Badge` for tickets; hairline borders; no new `zk-*` / `zt-*`.
- `DispatchModal` stays a bottom sheet (SetupDrawer pattern), not centered `Modal`.
- Urgency: static ring + small `animate-pulse` dot only — never card-scale animation.
- KDS touch targets preserved (`h-[60px]` dispatch, bulk bar, stage chips).
- WhatsApp brand green retained on dispatch share button.

Customer storefront (`zt-*`) remains deferred until new designs arrive.

## Consequences

- KDS is visually unified across all four tabs on the editorial system.
- Legacy `zk-*` Tailwind palette can be removed once no references remain.
- Post-backlog queue is empty of active slices; only deferred items remain
  (storefront redesign, `/to-prd`, candidate #5 Prisma-type-source).
