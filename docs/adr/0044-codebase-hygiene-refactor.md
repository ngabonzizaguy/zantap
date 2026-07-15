# ADR-0044: Codebase hygiene refactor (zero behavior change) + react-hooks v6 lint conventions

- **Status:** Accepted
- **Date:** 2026-07-15
- **Branch:** `refactor/codebase-hygiene` (commits `c2bc2ff`, `e030cc8`) — deliberately NOT on `main` until reviewed/smoked.

## Context

`main` accumulated hygiene debt: orphaned components, unused exports, dead Tailwind
tokens, duplicated helpers, and — after the React hooks ESLint plugin gained the
`set-state-in-effect` / `refs` rules — **22 lint errors** that made `npm run lint`
fail outright. Two unsafe casts in the Store contract test also failed `tsc --noEmit`.
The mandate for this pass: refactor and fix with **zero functionality / UI / logic
change**, on a branch, never on `main`.

## Decisions

### 1. Dead-code deletions (verified zero importers before deleting)

- `components/ui/GlassPanel.tsx` + its `.glass-panel` / `.glass-panel-strong` /
  `.glass-pill` CSS in `globals.css` (legacy light blush-glass; the live storefront
  uses `.glass-liquid*` per ADR-0043).
- `components/vendor/TabPlaceholder.tsx`.
- Unused server actions `advanceOrderStatus` (`lib/actions/vendor.ts`) and
  `addMenuImageByUrl` (`lib/actions/vendor-menu.ts`) — Store methods remain.
- Unused `settings` icon glyph in `components/ui/Icon.tsx`.
- Deprecated `resolveStorefrontOrigin` alias and the whole `lib/vendor/storefront-url.ts`
  re-export barrel; all callers now import from `@/lib/base-url` directly.
- Unused Tailwind theme tokens: `display-mega`, `display-xl`, `nav-link`,
  `fontFamily.serif`, `on-dark`, `surface.dark`/`surface.dark-elevated`,
  `borderRadius.4xl`/`5xl`, `spacing.section`/`xxs`, and the stale `./pages/**`
  content glob. `tsconfig.json` `allowJs: false` (no JS sources exist).
- Stale `PROVISION_SECRET` docs normalized in `.env.example` + script header
  (retired since ADR-0022/0025; no code path reads it).

### 2. Deduplication

- `hydrateFilters` (identical in `lib/actions/vendor-history.ts` and
  `lib/vendor/export-orders.ts`) → single `hydrateOrderHistoryFilters` in
  `lib/orders/history-filters.ts`.
- The 3× copy-pasted Kigali `en-GB` datetime formatter (HistoryPanel, export,
  receipt) → `formatKigaliDateTime(date, month?: "short" | "long")` in `lib/format.ts`.

### 3. react-hooks v6 lint conventions (the load-bearing decision)

`npm run lint` is green again (0 errors, 0 warnings). Two sanctioned patterns:

- **"Adjust state during render"** (React-docs pattern; a `prev` state key compared
  during render, setState inside the mismatch branch) is the standard fix for
  *reset-state-when-a-prop/open-flips* effects. Applied in: `Modal` (exit-fade +
  handle reset), `MenuImageLightbox`, `MenuItemCustomizeSheet`, `AssignDriverModal`,
  `MenuItemModal`, `SetupDrawer` (draft seeding + slug status), `BusinessStep`
  (slug status), `KdsDashboard` (onboarding override drop), `HistoryPanel`
  (loading flip; fetch stays in the effect with `.then` callbacks). The debounced
  slug-availability probes stay in effects; only their synchronous
  idle/invalid/checking classification moved to render.
- **Targeted `eslint-disable-next-line react-hooks/set-state-in-effect` with a
  justification comment** is allowed ONLY for client-only external-state reads
  that would break SSR hydration if run during render: localStorage
  (`useOwnerToken`, `Coachmark`, KDS setup visit-cap), sessionStorage checkout
  restore (`useCheckout`), URL params (`OnboardWizard ?recover=1`), randomized
  client-only seeding (`Confetti`), object-URL lifecycle (`useDishPhotoPreview`),
  and live DOM measurement (`Coachmark measure()`). Do NOT blanket-disable the
  rule in `eslint.config.mjs`.
- `refs`-during-render fixes: `onCloseRef`/`onSnapshotRef` mirror assignments moved
  into dep-less `useEffect(() => { ref.current = fn; })`.

### 4. Deliberately deferred (would violate zero-behavior scope)

Component splits (`SetupDrawer` ~1.2k lines, `lib/store/prisma.ts` ~1.8k),
Select/Combobox merge, `formatRwf` adoption in `MetricsBanner`/`VendorDetailPanel`
(separator differences), `INGREDIENTS_UI_ENABLED` dead-branch removal, server-action
error-style unification.

## Verification

`npm run lint` 0/0 · `npx tsc --noEmit` clean · `npm run build` clean ·
`npm test` 253 passed / 77 skipped (Prisma suite opt-in per convention).
No prod deploy from this branch yet.
