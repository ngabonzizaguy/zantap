# Issue 22-03 — Setup drawer auto-open visit cap

Status: **Done** · Priority: 3 · Boundary: KDS client only
Feature: candidate #22

## Goal

`SetupDrawer` auto-opens on reload/revisit **at most twice** per vendor slug per
browser when the onboarding checklist is incomplete. Manual hamburger open is always
available and does not consume the budget.

## Locked behavior

- Key: `zantap:kds-setup-visits-<slug>` (integer, max 2).
- Auto-open when: visit count `< 2` **and** checklist has incomplete steps
  (`deriveOnboardingState` / existing `checklist` prop).
- Increment count only on **auto-open**, not on hamburger / explicit user open.
- After 2 auto-opens OR checklist complete → never auto-open (including
  `?tab=setup` deep links — land on Orders tab, drawer closed).
- Coachmarks unchanged; "Show tips again" still resets coachmark keys only.

## What to build

- Pure helper: `lib/vendor/setup-visit-cap.ts` (read/increment/shouldAutoOpen) +
  unit tests.
- `KdsDashboard`: replace unconditional `tab === "setup"` auto-open with cap logic.
- Onboarding / recovery deep links: `?tab=setup` respects cap (may redirect tab to
  `orders` when cap exceeded).

## Files

| Area | Paths |
|------|-------|
| Logic | `lib/vendor/setup-visit-cap.ts`, `lib/vendor/__tests__/setup-visit-cap.test.ts` |
| UI | `components/vendor/KdsDashboard.tsx` |

## Acceptance

- [x] Visit 1–2 with incomplete checklist: drawer auto-opens
- [x] Visit 3+: drawer stays closed on load; hamburger still opens it
- [x] Checklist complete: never auto-opens
- [x] Manual open does not increment visit count
- [x] Unit tests for cap helper green
- [x] `npm run build` clean

## Blocked by

Nothing.

## Unblocks

22-04 (independent).
