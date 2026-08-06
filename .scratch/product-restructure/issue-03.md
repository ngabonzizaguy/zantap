# Issue 03 — Production marketing page at `/` (C structure + A hero + scroll-world cinematic)

Status: **✅ CORE SHIPPED · DEPLOYED · PROD-SMOKED 2026-08-06 (ADR-0049) — scroll-world cinematic pending owner interview/budget** · Track 1 · ADR-0046 §5 + ADR-0047

Deploy: `fe9f5d1` merged to `main` (fast-forward `4f64b5f..fe9f5d1`, carries
Issue 01 brand `877cef0` + Issue 02 sweep `2479b19`) → auto Vercel Production
`zantap-qv9d8y90w` → `https://zantap.app`. Prod smoke: `/` 200 serving the
funnel (no demo redirect; headline/CTA/hero/kitchen-screen/OG all in HTML),
`robots.txt` + `sitemap.xml` correct, storefront/KDS/onboard 200, Z favicon +
`/brand/approved-z/*` + hero mp4 200, prod mobile screenshot in
`issue-03-shots/prod-mobile-390-top.png`. `.scratch/lead-funnel-prototype/`
deleted per its NOTES (Higgsfield prompts preserved in git history +
`docs/adr/0046`).

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
- **Vendored design skills to consult (PRD §3b):** `ui-ux-pro-max` (design
  system + UX guideline queries), `gsap-core`/`gsap-scrolltrigger`/`gsap-react`
  (official GSAP patterns), `premium-frontend-ui` (Cinematic Pacing identity),
  `mobile-app-ui-design` (mobile-first: the page is designed at 390px FIRST,
  desktop second — owner directive), `scroll-world`. DESIGN.md/ADRs win over
  any skill advice on conflict.

Constraints (fixed):
- Copy: "local food businesses" umbrella, free guided setup offer, no invented
  pricing, Rwanda-first; i18n-ready string constants, no hard-coded JSX copy.
- Screenshots only inside device frames; exclude any screen with customer or
  driver phone numbers.
- Brand: approved Z + amber; marketing surface treatment to be codified in
  Issue 08 (`DESIGN.md`) — coordinate if sequenced after.
- Form fields per prototype (business name, type, contact person, WhatsApp
  phone, area) + a consent line for follow-up contact.

- [x] Read `.agents/skills/scroll-world/SKILL.md` + its references; run its owner interview (sections, art direction, camera, mobile opt-in, budget) before any paid generation. — Skill read 2026-08-06; **interview questions issued to owner at session end; NO paid rendering has run.** Answers to be recorded below.
- [x] Move hero assets into `public/`; build the page as RSC + small client islands (form, video, scrub engine, Three.js accent). — `public/marketing/`; `app/page.tsx` RSC + `components/marketing/*` islands (HeroMedia, LeadForm, MarketingMotion, OrbitAccent, StickyCta). Scrub engine island deferred with the cinematic.
- [x] Add `gsap` + `three` via npm; GSAP entrance/scroll animations on copy/sections; Three.js accent detail per prototype B. — `MarketingMotion` (matchMedia-gated), `OrbitAccent` (lazy three import).
- [ ] scroll-world chain: stills → dives → connectors → encode → wire `scrub-engine.js` into a client island; seam QA (skill Step 8). — **BLOCKED on owner interview answers + budget approval (ADR-0047 decision 3). Dedicated follow-up session.**
- [x] Lead form submits via Server Action from Issue 04 (if 04 not yet done, land the UI behind the action's interface). — UI built against `lib/leads/types.ts` `SubmitLeadInput`; interim transport = prefilled WhatsApp to the owner (no lead silently dropped); Issue 04 swaps `deliverLead` for the action.
- [x] SEO: metadata, Open Graph image, `sitemap.xml`, `robots.txt`; keep vendor storefronts crawlable policy explicit. — `app/robots.ts` (storefronts crawlable; api/ops/vendor/slip disallowed), `app/sitemap.ts`, OG = hero still.
- [x] Preserve `/[slug]` routing — ensure no slug can collide with the root page and reserved paths. — `RESERVED_VENDOR_SLUGS` enforced in BOTH store adapters' `isSlugAvailable` (+ unit & contract tests).
- [x] Mobile-first check at 390px; no horizontal overflow; reduced-motion fallback to the still image. — Playwright check: 0px overflow at 390/1440, no console errors; video gated by `useSyncExternalStore` reduced-motion/Save-Data.
- [x] `npm run build`; Playwright/curl smoke; delete `.scratch/lead-funnel-prototype/` per its NOTES once verified in prod. — build/lint/`npm test` (256/78) green; shots in `.scratch/product-restructure/issue-03-shots/`; prototype deleted after prod smoke.
- [x] Handoff per protocol (ADR for the root-IA change). — ADR-0049.

Notes:
- Fresh Z-brand kitchen screenshot captured against the in-memory store
  (`.scratch/product-restructure/issue-03-capture-kds.mjs`) — the July
  `public/brand/UI-screens/` captures show the retired medallion + a
  `zantap.ai` URL; don't reuse those on marketing surfaces.

## Scroll-world owner interview (recorded when answered)

- Art direction: _pending_
- Camera style: _pending_
- Journey sections: _pending_ (proposed: storefront → order → kitchen → dispatch → grow)
- Mobile 9:16 chain: _pending_
- Budget tier + biller + approval: _pending_ (NO paid rendering until this line is a yes)
