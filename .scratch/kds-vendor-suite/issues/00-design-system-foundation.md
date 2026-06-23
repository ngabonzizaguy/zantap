# Design system foundation — Tailwind tokens + primitive kit

Status: done

## Parent

PRD: `.scratch/kds-vendor-suite/PRD.md`  
Grill: `.scratch/kds-vendor-suite/grill-decisions.md`  
ADR: `docs/adr/0005-elevenlabs-brand-design-system.md`

## Scope (one session)

Wire `DESIGN.md` into `tailwind.config.ts`, load display + body fonts, and ship a
small reusable primitive kit. **No feature logic** (no Store changes, no menu CRUD,
no new KDS tabs beyond optional nav shell stub). Issue 00 **blocks issues 01–05**.

Resolve open questions #1–2 from the PRD in this slice:

1. **Display font** — pick **Instrument Serif** (already `--font-instrument-serif`)
   or add **EB Garamond** via `next/font`; document choice in issue comments or ADR note.
2. **KDS canvas** — default **light editorial** (`canvas`, `ink`, `hairline` tokens);
   retain `surface-dark` tokens for elevated order-ticket panels if glare is a concern.

## What to build

### Tailwind tokens

Translate `DESIGN.md` color, typography, spacing, and radius tokens into
`tailwind.config.ts` extensions, e.g.:

- Colors: `canvas`, `ink`, `body`, `muted`, `hairline`, `surface-card`,
  `surface-dark`, `gradient-mint`, `gradient-peach`, `gradient-lavender`,
  `gradient-sky`, semantic success/error.
- Typography: `font-display`, `font-body`; size/weight utilities aligned with
  `DESIGN.md` scale (display-mega → caption).
- Radius / spacing as needed for pills, cards, modals.

### Fonts

- Body: **Inter** via `next/font/google` if not already loaded app-wide.
- Display: chosen substitute for Waldenburg (Instrument Serif or EB Garamond).
- Expose CSS variables on `app/layout.tsx` (or vendor layout) for primitives.

### Primitive kit

Create `components/ui/primitives/` (or `components/brand/` — pick one, document):

| Component | Variants / notes |
|-----------|------------------|
| `Button` | Primary ink pill, outline secondary; min 60px touch height for KDS |
| `Input` | Hairline border, ink label, error state |
| `Card` | `surface-card`, soft shadow, hairline border |
| `Modal` | Focus trap, backdrop blur, primitive styling only |
| `Badge` | Status chips (success, muted) |
| `GradientOrbs` | Pastel atmospheric blurs per `DESIGN.md` |

Export a barrel `index.ts`. Add a **dev-only or Storybook-free** smoke page only if
needed for visual check — prefer a minimal usage in one vendor chrome file.

### Deprecation markers

Add comments in `tailwind.config.ts` and/or `components/vendor/*` that `zt-*` /
`zk-*` are **deprecated**; do not migrate legacy surfaces in this issue.

### Optional (only if trivial)

- Extend `KdsDashboard` nav labels to four tabs (`Orders | Menu | History | Setup`)
  with **placeholder panels** for Menu/History/Setup — or leave tabs to Issue 01/03/05
  if that risks scope creep. Prefer **nav shell only** (no feature UI).

## Files touched

| Area | Paths |
|------|-------|
| Tokens | `tailwind.config.ts`, possibly `app/globals.css` |
| Fonts | `app/layout.tsx` (or `app/vendor/[slug]/layout.tsx`) |
| Primitives | `components/ui/primitives/*.tsx`, `components/ui/primitives/index.ts` |
| Docs | `DESIGN.md` (reference only), optional short note in `CONTEXT.md` |
| Vendor (optional) | `components/vendor/KdsDashboard.tsx`, `components/vendor/Tabs.tsx` — nav labels only |

**Do not touch:** `lib/store/*`, `prisma/schema.prisma`, `lib/actions/*` (except import paths if layout changes).

## Acceptance criteria

- [x] `DESIGN.md` palette available as Tailwind utilities (no new `zt-*` / `zk-*` in primitives).
- [x] Display + body fonts loaded and applied via `font-display` / `font-body`.
- [x] Primitive kit exports `Button`, `Input`, `Card`, `Modal`, `Badge`, `GradientOrbs`.
- [x] KDS touch targets ≥ 60px on interactive primitives (per `.cursorrules`).
- [x] Legacy `zk-*` vendor components unchanged functionally; deprecation noted in comments.
- [x] `npm run build` passes.
- [x] `npm test` green (no regressions).

## Test plan

1. **Build:** `npm run build` — no Tailwind / font / SSR errors.
2. **Unit:** Add lightweight render tests for `Button` + `Input` if project pattern exists; otherwise manual only.
3. **Visual smoke:** Open `/vendor/inka-steakhouse` — Orders tab still works; any new nav labels render; primitives visible if wired to a placeholder.
4. **Token check:** Confirm `bg-canvas`, `text-ink`, `border-hairline` compile and match `DESIGN.md` hex values in devtools.

## Blocked by

- None (candidate #6 foundation slice).

## Unblocks

- Issues 01, 02, 03, 04, 05 — all feature UI must compose from this kit only.

## ADR

No new ADR required (ADR-0005 already records brand decision). Record display-font choice in issue `## Comments` when resolved.

## Comments

**Display font (PRD Q1):** Instrument Serif via `--font-display` (already in repo; no EB Garamond added). Weight 400 is the closest open substitute for Waldenburg Light 300.

**KDS canvas (PRD Q2):** Light editorial tokens wired as canonical; `surface-dark` / `surface-dark-elevated` retained for future elevated order-ticket panels. Legacy `zk-*` KDS chrome untouched until feature issues migrate surfaces.

**Primitive location:** `components/ui/primitives/` (barrel `index.ts`).

**Nav shell:** Four tabs shipped (`Orders | Menu | History | Setup`). Menu tab still renders legacy `InventoryGrid` (functional parity); History/Setup use `TabPlaceholder` with new primitives.

**Verified 2026-06-23:** `npm run build` green; `npm test` 88/88 green.
