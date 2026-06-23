# ADR-0005: Adopt the ElevenLabs (editorial) aesthetic as the single brand design system

Date: 2026-06-23
Status: Accepted

## Context

ZanTap shipped two divergent visual languages: the Customer storefront in a
`zt-*` blush-glassmorphic system and the Vendor KDS in a `zk-*` matte-dark
"industrial" system. `.cursorrules` actively mandated and enforced both as
*separate* aesthetics ("never mix"). The owner decided they prefer the
**ElevenLabs editorial look** (off-white canvas `#f5f5f5`, warm near-black ink,
Waldenburg-Light display serif, Inter body, pastel atmospheric gradient orbs;
captured in `DESIGN.md`) and want the **whole brand** — storefront *and* KDS — to
adopt it.

The spec arrived via `npx getdesign@latest add elevenlabs`. Important: that CLI
only writes the `DESIGN.md` markdown spec at the repo root for AI agents to read.
**It installs no tokens, no Tailwind config, and no components.** Adopting the
aesthetic is therefore a real migration, not a package install.

Note: getdesign's marketing blurb calls ElevenLabs "dark cinematic," but the
`DESIGN.md` committed here is the **light editorial** variant. The committed file
is the source of truth.

## Decision

`DESIGN.md` is now the **single source of truth for all UI** across both the
Customer view and the KDS. This supersedes the per-surface "glassmorphic
customer / dark-industrial KDS" mandates in `.cursorrules` (now rewritten to
point at `DESIGN.md`).

- Translate `DESIGN.md` tokens (color, type scale, spacing, radius, components)
  into `tailwind.config.ts` as the canonical token set; migrate components onto
  them. The legacy `zt-*` / `zk-*` palettes are deprecated and removed as
  surfaces migrate.
- **Customer vs Vendor remain separate functional areas** (routes, components,
  data boundaries) — only the *visual language* is unified. The KDS keeps its
  ergonomic requirements (large touch targets, high legibility for kitchen use),
  realized with `DESIGN.md` tokens rather than a separate dark system. `DESIGN.md`
  includes dark surface tokens (`surface-dark`, `surface-dark-elevated`) if a
  specific KDS screen still needs a dark treatment within the same system.
- The brand migration should land **before/alongside** the new KDS features
  (menu CRUD, media, export, filters, guides) so those are built natively in the
  new system instead of being skinned twice.

## Consequences

- `.cursorrules` and `CONTEXT.md` styling descriptors are updated in this same
  change; the old `bg-zinc-950` / `backdrop-blur-xl` mandates no longer apply.
- A migration window exists where some components still use `zt-*` / `zk-*`
  tokens. That is expected; treat any surface not yet migrated as legacy.
- Waldenburg is licensed; `DESIGN.md` documents EB Garamond / GT Sectra as
  open-source display substitutes — pick the substitute when wiring fonts.

## Alternatives considered

| Option | Why not |
|--------|---------|
| Keep dark `zk-*` KDS, ElevenLabs for storefront only | Owner wants one brand; two systems is the current pain |
| Hybrid (dark order-taking KDS + light admin area) | Two token sets to maintain; rejected for a unified brand |
| Treat `getdesign add` as a finished install | False — it only ships `DESIGN.md`; tokens/components are still hand-built |
