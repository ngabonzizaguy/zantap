# ADR-0047: Landing-page motion stack (GSAP, Three.js, Higgsfield, scroll-world)

- **Status:** Accepted
- **Date:** 2026-08-05
- **Branch:** `product/restructure-audit`
- **Amends:** ADR-0046 §5 (landing direction) — structure/offer unchanged

## Context

ADR-0046 fixed the marketing page as prototype C's conversion-first structure
plus prototype A's cinematic Kigali hero. The owner subsequently directed that
the production landing page use smooth animation and generated assets: GSAP,
Three.js, Higgsfield, and the open-source **scroll-world** skill
(github.com/oso95/scroll-world), which builds a scroll-scrubbed, seamless
"fly-through" cinematic from Higgsfield/Monid-rendered clips.

## Decision

1. The production landing page (issue-03) uses:
   - **GSAP** (+ ScrollTrigger) for entrance/scroll animations;
   - **Three.js** for restrained 3D accent detail (prototype B's orbit lines
     are the taste reference);
   - **Higgsfield** for generated visual assets (existing hero still + loop,
     plus new scene assets);
   - the **scroll-world** skill for a scroll-scrubbed cinematic journey.
     The skill is vendored at `.agents/skills/scroll-world/` (MIT-licensed
     copy of the upstream repo's skill folder).
2. **Conversion beats cinematic.** C's structure is unchanged: the free-setup
   offer and lead form stay primary; the form or a sticky CTA must be
   reachable within one viewport at all times. Any conflict resolves in favor
   of conversion.
3. **Skill guardrails are binding:** run scroll-world's owner interview (art
   direction, camera style, sections, mobile 9:16 opt-in) and obtain explicit
   owner **budget approval before any paid rendering** (Monid per-clip USD
   default; Higgsfield credits fallback). One video model per chain;
   frame-locked seams; seam QA before ship.
4. **Performance/accessibility guardrails:** `prefers-reduced-motion` falls
   back to stills; posters until first frame; lazy nearby-only prefetch; the
   native 9:16 mobile chain ships only with owner sign-off (never a silent
   centre-crop) — Rwanda mobile data budgets are a first-class constraint.
5. New runtime dependencies `gsap` and `three` are added at implementation
   time via npm (latest), scoped to the marketing page's client islands.

## Consequences

- Issue-03 (`.scratch/product-restructure/issue-03.md`) carries the
  implementation checklist; the PRD §Track-1.3 references this ADR.
- The implementing session must read `.agents/skills/scroll-world/SKILL.md`
  and its `references/` before building; the scrub engine
  (`references/scrub-engine.js`) is framework-agnostic and mounts in a client
  island.
- Rendering costs are owner-approved per build; no generation runs without a
  stated estimate and a go.
