# Issue 03 — Production marketing page at `/` (C structure + A hero + scroll-world cinematic)

Status: **ready-for-agent** · Track 1 · ADR-0046 §5 + ADR-0047 (animation/motion stack)

Replace the root demo-storefront redirect with the production funnel page.
Design source: `.scratch/lead-funnel-prototype/` variant C structure (offer +
visible lead form first) + variant A cinematic hero (assets
`kigali-vendor-hero.png` + `kigali-shift-loop.mp4` — move into `public/`).
This is a port through real Next.js/Tailwind/DESIGN-token code, not a copy of
the throwaway prototype HTML.

**Motion/animation stack (owner directive 2026-08-05, ADR-0047):**
- **GSAP** (+ ScrollTrigger) for smooth entrance/scroll animations.
- **Three.js** for restrained 3D detail (prototype B's orbit lines are the
  taste reference — accent, not centerpiece).
- **Higgsfield** for all generated visual assets (hero still/loop exist; new
  scene assets generated through the pipeline below).
- **scroll-world skill** (INSTALLED: `.agents/skills/scroll-world/SKILL.md` —
  read it FIRST) for a scroll-scrubbed cinematic journey through ZanTap's
  story (e.g. storefront → order → kitchen → dispatch → grow).
  Non-negotiables from the skill: run its Step 1 interview with the owner
  (art direction, camera style, sections, mobile 9:16 opt-in, and **budget
  approval BEFORE any paid rendering** — Monid USD default, Higgsfield credits
  fallback); frame-locked seams (one model for the whole chain); blob-seek
  encoding (`-g 8`, crf ~20, faststart); seam QA per its Step 8.
- **Conversion guard:** the cinematic must never bury the lead form — C's
  structure wins on conflict. Form (or a sticky "Get free setup" CTA that
  jumps to it) reachable within one viewport on mobile at all times.
- **Performance guard:** `prefers-reduced-motion` falls back to stills (the
  engine does this — keep it); posters until first frame; lazy/nearby-only
  clip prefetch; Rwanda mobile data budgets matter — ship the 9:16 mobile
  chain only with owner budget sign-off, never a silent centre-crop.
- Dependencies to add at implementation time: `gsap`, `three` (npm, latest).

Constraints (fixed):
- Copy: "local food businesses" umbrella, free guided setup offer, no invented
  pricing, Rwanda-first; i18n-ready string constants, no hard-coded JSX copy.
- Screenshots only inside device frames; exclude any screen with customer or
  driver phone numbers.
- Brand: approved Z + amber; marketing surface treatment to be codified in
  Issue 08 (`DESIGN.md`) — coordinate if sequenced after.
- Form fields per prototype (business name, type, contact person, WhatsApp
  phone, area) + a consent line for follow-up contact.

- [ ] Read `.agents/skills/scroll-world/SKILL.md` + its references; run its owner interview (sections, art direction, camera, mobile opt-in, budget) before any paid generation.
- [ ] Move hero assets into `public/`; build the page as RSC + small client islands (form, video, scrub engine, Three.js accent).
- [ ] Add `gsap` + `three` via npm; GSAP entrance/scroll animations on copy/sections; Three.js accent detail per prototype B.
- [ ] scroll-world chain: stills → dives → connectors → encode → wire `scrub-engine.js` into a client island; seam QA (skill Step 8).
- [ ] Lead form submits via Server Action from Issue 04 (if 04 not yet done, land the UI behind the action's interface).
- [ ] SEO: metadata, Open Graph image, `sitemap.xml`, `robots.txt`; keep vendor storefronts crawlable policy explicit.
- [ ] Preserve `/[slug]` routing — ensure no slug can collide with the root page and reserved paths.
- [ ] Mobile-first check at 390px; no horizontal overflow; reduced-motion fallback to the still image.
- [ ] `npm run build`; Playwright/curl smoke; delete `.scratch/lead-funnel-prototype/` per its NOTES once verified in prod.
- [ ] Handoff per protocol (ADR for the root-IA change).
