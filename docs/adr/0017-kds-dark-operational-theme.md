# ADR-0017: Restore the dark operational KDS theme within the DESIGN.md system

Date: 2026-06-27
Status: Accepted (supersedes the visual-surface decision in ADR-0015)

## Context

ADR-0015 migrated the KDS Orders tab and shell from the legacy `zk-*`
charcoal/orange palette to the light ElevenLabs editorial tokens, for a single
unified brand. Operationally, the light KDS lost the qualities that made the
original kitchen screen feel premium and fit-for-purpose: a dark, low-glare
surface, high contrast, and an orange accent used as a functional status cue.

The owner asked to **restore the original dark + orange identity** while
**keeping all the workflow features** added since (kitchen stages, expandable
cards, dispatch, bulk select, relative timestamps, queue prioritization), and to
match a provided screenshot (dark surface, orange price/dispatch, colored status
chips, filter chips, sort dropdown, compact stat cards).

ADR-0005 already anticipated this: it keeps the KDS and storefront as one brand
system but explicitly allows **dark surface treatments** for KDS screens. So a
dark KDS is *within* the system, not a second brand.

Constraint discovered during design: the project's `cn()` helper is a plain
string join and does **not** de-duplicate Tailwind classes. Appending a dark
background utility over a primitive's built-in light background is therefore
unreliable (final paint depends on stylesheet order, not class order).

## Decision

Introduce a **scoped dark theme** for the KDS rather than re-adding a palette or
rewriting every component:

- Add a `.kds-dark` scope in `app/globals.css` that **remaps the editorial color
  utilities** (`bg-canvas`, `bg-surface-card`, `text-ink`, `text-muted`,
  `border-hairline`, `bg-primary`, `text-primary`, `text-on-primary`, success/
  error, plus the common opacity variants) to dark/charcoal values and the
  `momo` orange `#F5A623` for primary/accent. Specificity (`.kds-dark .text-ink`)
  guarantees the override wins regardless of Tailwind's output order.
- The KDS shell root carries `kds-dark`; all four tabs (Orders, Menu, History,
  Setup) and the dispatch/bulk/setup overlays inherit it and become dark with no
  per-component restyle.
- **Color is functional** (ADR cross-ref to the grill decisions): purple = new/
  accepted, orange = preparing, sky = ready, blue = out-for-delivery, green =
  paid/completed, red = late/failed only. Implemented in `lib/kds/stage-styles.ts`
  with explicit (non-remapped) Tailwind color utilities so they render as-is on
  the dark surface.
- Orders hero is hand-tuned: rotating rainbow card borders removed; clear
  collapsed hierarchy (Order # → stage badge → orange price; quiet secondary
  line); status **filter chips**, a **sort dropdown** (Oldest/Newest), and a
  **3-card stat row** showing only real data (gross, active count, New/Prep/Ready).
- The gradient orbs are kept but dimmed for a faint glassmorphic glow.
- The customer storefront is unaffected (scope is `.kds-dark` only).

## Consequences

- The KDS regains its dark, high-contrast, orange-accented operational identity
  while retaining 100% of the workflow features.
- Brand unity is preserved per ADR-0005: one token system, with the KDS using its
  sanctioned dark surface treatment.
- Future KDS components automatically inherit the dark theme as long as they use
  editorial token utilities inside the `.kds-dark` shell.
- Fake/unbacked metrics (% vs yesterday, sparkline, avg prep time) are explicitly
  NOT shown; adding them is deferred until per-stage timestamps and daily totals
  are tracked (a separate DB/server slice).
- ADR-0015 remains historically valid; this ADR supersedes only its *light-surface*
  visual decision for the KDS.

## Alternatives considered

| Option | Why not |
|--------|---------|
| Re-add the deleted `zk-*` palette | Reintroduces a second color system to maintain; ADR-0005 mandates one. |
| Per-component dark restyle via appended classes | Unreliable — `cn()` doesn't de-dup; brittle and high-churn across many files. |
| Dark Orders only, other tabs light | Jarring white flash on tab switch; rejected by owner. |
