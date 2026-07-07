# ADR-0042: Remove dead `zt-*` Tailwind palette

Date: 2026-07-07
Status: Accepted
Builds on: ADR-0041 (storefront DESIGN.md migration), ADR-0016 (`zk-*` removal pattern)

## Context

Candidate #10 migrated all customer storefront surfaces off the legacy `zt-*`
blush-glass Tailwind palette to `DESIGN.md` editorial tokens. Prod curl on
`/inka-steakhouse` confirmed zero `zt-brown` / `zt-warm` / `zt-accent` classes
in the deployed bundle (`9473ccc` → `dpl_B9zuaxYf72mgJGPbJ4vXJ6LDAWZy`).

ADR-0041 noted the `zt` color block in `tailwind.config.ts` could be removed
once migration was complete (mirror ADR-0016).

## Decision

Remove from `tailwind.config.ts`:

1. The deprecated `zt` color block (blush, brown, warm, accent, success).
2. Unused legacy animations `ztfloat`, `ztspin`, `ztshim`, `ztpulse` and their
   keyframes — zero TS/TSX references after #10; `GradientOrbs` uses
   `animate-brandfloat`.

**Keep** (not Tailwind palette tokens):

- `.zt-hidescroll` in `app/globals.css` — scrollbar-hiding utility used across
  customer + KDS horizontal scroll containers.
- `.zt-confetti-piece` / `.zt-live-glow` in `globals.css` — onboarding confetti
  and Live step halo (CSS-only, not the blush palette).

Update the dormant `components/ui/Orbs.tsx` to `animate-brandfloat` so it
does not reference a removed animation if revived.

## Consequences

- No new `bg-zt-*` / `text-zt-*` utilities can be accidentally introduced.
- `npm run build` must stay green after removal.
- Optional follow-up: delete unused `Orbs.tsx` and blush-era `shadow-glass` /
  `shadow-cart` box shadows (also zero references).

## Alternatives considered

- **Rename `zt-hidescroll` → `hidescroll`** — deferred; rename touches many
  files for cosmetic naming only; utility is stable and documented.
