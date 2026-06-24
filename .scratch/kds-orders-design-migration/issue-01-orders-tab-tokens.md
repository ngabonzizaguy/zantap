# Issue 01 — KDS Orders tab → DESIGN.md tokens

Status: **closed** (6/6 migrated · committed `199048e` · local + prod smoke complete · deployed `dpl_G4kS89FBo71KhZLn43hvuSGZD4Wg` → `zantap-psi.vercel.app` 2026-06-24) · Labels: `ready-for-agent`

## Goal

Migrate the KDS **Orders tab** (and its chrome that only serves Orders) from legacy
`zk-*` palette to `DESIGN.md` tokens + `components/ui/primitives`, matching Menu /
History / Setup tabs already on the editorial system.

**Out of scope this slice:** customer storefront (`zt-*`), `/to-prd`, shell-wide
`KdsDashboard` / `Tabs` migration (optional follow-up issue 02 if needed for visual
consistency after Orders tab lands).

## Why now

- Candidates #1–#7 backlog is complete.
- Menu, History, Setup use `Card` / `Button` / `Badge` / `Modal` primitives on
  light tokens; Orders tab is still charcoal + orange `zk-*` — jarring tab switch.
- Recent fix (`a21d91f`): urgency pulse must stay on a **small dot only** — never
  `animate-zkpulse` on the whole ticket (causes stagger/bounce).

## Files in scope (migrate in this order — one file per session)

1. ✅ `components/vendor/MetricsBanner.tsx` — sticky header + gross/active cards (DESIGN.md tokens + `Card` primitive; 2026-06-24)
2. ✅ `components/vendor/OrderTicket.tsx` — tickets + OrdersList on `Card`/`Badge`/`Button`; gradient border accents; ink dispatch CTA; urgency ring + `animate-pulse` dot only (2026-06-24)
3. ✅ `components/vendor/BulkActionBar.tsx` — light canvas bar + hairline; `Button size="kds"` outline chips; no momo/zk (2026-06-24)
4. ✅ `components/vendor/DispatchModal.tsx` — bottom sheet on light `surface-card` + `canvas-deep/40` overlay (SetupDrawer pattern; centered `Modal` not used — KDS bottom sheet UX); `Button` copy chip + success Call badges; light slip pre; WhatsApp brand green retained (2026-06-24)
5. ✅ `components/vendor/Tabs.tsx` — ink pill active + outline inactive via `Button size="kds"`; no orange gradient / zk-* (2026-06-24)
6. ✅ `components/vendor/KdsDashboard.tsx` — shell `bg-canvas text-ink`, `border-hairline`, `GradientOrbs` replaces legacy zk orbs (2026-06-24)

## Reference implementations (read before editing)

- `DESIGN.md` — token names, type scale, no saturated CTA (ink pill primary)
- `components/vendor/HistoryPanel.tsx` — Card + Badge + Button patterns
- `components/vendor/MenuSection.tsx` — Card grid, touch targets
- `components/vendor/SetupDrawer.tsx` — drawer + Input + Button
- `components/ui/primitives/` — Button, Card, Badge, Modal
- `docs/adr/0005-elevenlabs-brand-design-system.md` — KDS keeps large touch targets;
  dark treatment optional via `surface-dark` tokens, not a separate palette

## Acceptance

- [x] No new `zk-*` / `zt-*` in migrated files (`MetricsBanner`, `OrderTicket`, `BulkActionBar`, `DispatchModal`, `Tabs`, `KdsDashboard`)
- [x] KDS touch targets preserved (`h-[60px]` dispatch, bulk bar, stage chips) — `OrderTicket` stage chips + dispatch use `Button size="kds"`
- [x] Urgency: static ring + small pulsing dot only (no card-scale animation)
- [x] `npm run build` green (2026-06-24, post-`KdsDashboard`)
- [x] Manual smoke on `/vendor/inka-steakhouse` Orders tab: expand ticket, stage chips, dispatch modal, bulk select (local dev 2026-06-24 — light canvas shell, GradientOrbs, no `zk-*`; Orders/Menu/History tabs all `bg-canvas`; stage chips Accept/Preparing/Dispatch in SSR)
- [x] Prod deploy + brief smoke (`dpl_G4kS89FBo71KhZLn43hvuSGZD4Wg` → `zantap-psi.vercel.app` 2026-06-24 — HTTP 200, same token checks pass)

## Deferred (explicitly not this task)

- Customer storefront redesign (owner: new designs coming later)
- `/to-prd` post-backlog — owner wants probing conversation first, not agent-run yet
