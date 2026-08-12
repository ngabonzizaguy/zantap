# Issue 03 — Production marketing page at `/` (C structure + A hero + scroll-world cinematic)

Status: **✅ CORE + SCROLL-WORLD PREVIEW SHIPPED · DEPLOYED · PROD-SMOKED 2026-08-12 (ADR-0049/0052; `3a80e3e` → `dpl_6iMs3LEJw3Y8VPgfdc56SHiynCLn` → `zantap.app`) — native 16:9 + 9:16 real-footage replacement remains pending** · Track 1 · ADR-0046 §5 + ADR-0047

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

- [x] Read `.agents/skills/scroll-world/SKILL.md` + its references; run its owner interview (sections, art direction, camera, mobile opt-in, budget) before any paid generation. — Completed 2026-08-06; answers recorded below. Rendering later began within the approved Higgsfield-credit budget and was halted by the owner mid-chain at an 881.42-credit balance.
- [x] Move hero assets into `public/`; build the page as RSC + small client islands (form, video, scrub engine, Three.js accent). — `public/marketing/`; `app/page.tsx` RSC + `components/marketing/*` islands (HeroMedia, LeadForm, MarketingMotion, OrbitAccent, StickyCta). Scrub engine island deferred with the cinematic.
- [x] Add `gsap` + `three` via npm; GSAP entrance/scroll animations on copy/sections; Three.js accent detail per prototype B. — `MarketingMotion` (matchMedia-gated), `OrbitAccent` (lazy three import).
- [ ] scroll-world final film: capture native continuous 16:9 + 9:16 walkthroughs → split into six frame-adjacent Architecture A clips → encode → wire desktop/mobile assets → seam/mobile QA (skill Step 8). — **FINISH PATH CHOSEN 2026-08-09:** real partner-restaurant footage, zero generation credits. Pre-production plan: `scroll-world/native-walkthrough-footage-plan.md`. Capture/integration pending. The complete desktop-preview release was separately approved on 2026-08-12 and does not close this final-film checkbox.
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

## Scroll-world owner interview — ANSWERED 2026-08-06 ✅

- **Art direction:** grounded cinematic **photoreal Kigali** (matches the live
  hero; reuse its palette: warm near-black, amber, natural wood, muted green —
  see the hero prompt preserved in git history of
  `.scratch/lead-funnel-prototype/NOTES.md`).
- **Camera style:** **one continuous forward walkthrough** → scroll-world
  **Architecture A** (sequential legs chained from each leg's ACTUAL last
  frame, NO `--end-image`, NO connectors — skip skill Step 5).
- **Journey sections (6):** 1) Kigali food-business storefront → 2) customer
  ordering on a phone → 3) MoMo payment moment → 4) the kitchen in motion →
  5) dispatch/delivery on the street → 6) the business growing (finale + CTA).
- **Mobile:** **YES — native 9:16 portrait chain** (never a centre-crop);
  ~2× video gens.
- **Biller / budget:** **Higgsfield credits ONLY** (owner has a subscription;
  do NOT use Monid USD). Approval given for available credits. Implementing
  session MUST: check `higgsfield workspace list` balance, run ONE still +
  ONE video probe to calibrate credit cost, estimate the full run
  (6 stills + 6 desktop legs + 6 portrait legs + ~25% photoreal-interior
  re-roll headroom ≈ 700–900 credits at 2026-07 observed rates), and warn if
  the estimate exceeds ~70% of the balance BEFORE batching.
- Model: `seedance_2_0` (default; Architecture A start-image-only works on
  the whole roster). One model for both chains. Photoreal interiors trip the
  NSFW filter — budget 3 attempts/leg, `kling3_0` as single-clip fallback.

## Scroll-world session log — 2026-08-06 (rendering HALTED by owner mid-chain)

**State: owner halted all new generations ("I'll decide later") — credits
earmarked for social-media marketing; hard floor: balance must NOT go below
700.** Balance at halt: **881.42** (started 1172.42; spent 291 total; nothing
in flight, nothing further billed).

Calibrated credit costs (measured, max plan): still (`gpt_image_2` 2k high)
= **7**; 8s `seedance_2_0` std **1080p** leg = **72**; 8s std **720p** leg =
**26** (aspect doesn't change price; billed at launch). NO NSFW rejections in
3 legs so far.

Assets rendered & on disk under `.scratch/product-restructure/scroll-world/`
(all raw masters, none encoded yet — result URLs already downloaded, safe):
- 6 desktop stills `still_{storefront,order,momo,kitchen,dispatch,grow}.png`
  (3:2 2k) — reviewed, cohesive photoreal golden-hour Kigali, APPROVED.
- 1 portrait still `still_storefront_m.png` (9:16) — approved.
- Desktop legs 1–3 (1080p 16:9 8s, frame-locked chain):
  `leg_storefront.mp4` → `leg_order.mp4` → `leg_momo.mp4`. Seam handoffs
  verified by eyeball (each leg started from the previous leg's ACTUAL last
  frame; extracted frames `probe_last.png`=leg1 last, `last_order.png`,
  `last_momo.png`). **Leg 4 (kitchen) must chain from `last_momo.png`**
  (calm forward frame down a service aisle toward a doorway — clean handoff).
- Portrait leg 1 `leg_storefront_m.mp4` (native 720×1280) — doubles as the
  720p price probe. Portrait legs 2–6 NOT rendered; portrait leg 2 must chain
  from `leg_storefront_m.mp4`'s last frame (not yet extracted).
- Prompt files (`preamble.txt`, `still_*.txt`, `leg_*.txt`) — the preamble is
  byte-identical across stills; leg prompts carry the motion-handoff contract.
  Read prompts with `Get-Content -Raw -Encoding utf8` (plain reads mojibake
  the em-dashes).

Remaining to finish the film (per owner interview: 6 scenes, desktop +
native 9:16 mobile): desktop legs 4–6, portrait legs 2–6, encodes (free),
engine wiring + seam QA (free). Cost options quoted to owner (none chosen):
1. Desktop-only finish at 720p (~78 + rerolls → ends ~780–800; mobile chain
   deferred; encode the whole desktop chain at 720p for uniformity — never
   upscale the 720p legs to 1080p).
2. Trim to 5 scenes (merge dispatch+grow), both chains 720p (~170 → ~710).
3. Both chains 720p full (~208, zero headroom → ~670, breaches the floor).
4. Top up credits, then finish as planned (desktop 1080p + portrait 720p).

**Owner feedback to honor on resume (2026-08-06):** wants the film to feel
NATIVE — real recognizable assets, not generic generation. Agreed approach:
(a) real MTN MoMo logo + real ZanTap UI screenshots belong in the HTML copy
overlay layer, NEVER baked into AI video (models distort logos); (b) owner
MAY supply real Kigali place photos as `--image` references for re-rolled
stills (costs re-generation: 7/still + leg re-renders) — ask before assuming
either way.

**Owner decision 2026-08-09: build the ZERO-CREDIT preview next session.**
Wire the scrub engine into `app/page.tsx` using ONLY the already-paid assets
(6 stills + desktop legs 1–3) so the owner can feel the scroll experience
before choosing between (a) finishing the AI chain (budget options above,
floor 700 credits) or (b) shooting REAL continuous walkthrough footage of a
partner restaurant (owner's phone/gimbal; zero credits; also satisfies the
native-assets feedback — the engine scrubs any mp4, one continuous take needs
no seam work, just segment cuts). Preview scope: scenes 1–3 scrub their legs,
scenes 4–6 still-crossfade (engine supports clip-less sections via the
optional-connector/still path); encode legs per pipeline §5 (crf 20, -g 8,
faststart, -an) into `public/marketing/vid/`; real MoMo logo + ZanTap screens
go in the copy overlay layer; NO Higgsfield calls at all.

Engine wiring plan (decided, not yet built): copy
`.agents/skills/scroll-world/references/scrub-engine.js` into
`components/marketing/scroll-world/` and adapt for a MID-PAGE embed — the
stock engine assumes it owns the page from scrollY=0 with position:fixed
layers. Adaptation: sticky viewport wrapper (height 100vh) inside the section
container (container height = (Σ scroll weights + 1)×vh), segment offsets
based on the container's document top, first/last segments clamp to opacity 1
outside the band, engine topbar/scrollbar dropped (page has its own masthead
+ StickyCta), route rail + hint kept, `connectors: []` + crossfade ~0.08
(arch A), dark theme via unlayered `--sw-bg:#0c0a09 --sw-ink:#f4f4f3
--sw-accent:#f5a623` (engine CSS is in `@layer sw`, page vars win). Placement:
between `#how` ("What happens next") and the offer section of `app/page.tsx`.
Conversion guard ADR-0047: last section's engine CTA → `#lead-form`; StickyCta
must stay reachable. Treat Save-Data like reduced-motion (skip clip loading).
No ADR written yet — decisions above are provisional until the film ships.

## Scroll-world session log — 2026-08-09 (ZERO-CREDIT preview BUILT, QA 13/13)

**No Higgsfield calls, zero credit spend (balance stays 881.42).** The owner's
2026-08-09 decision was executed exactly: the preview is live in the working
tree (UNCOMMITTED on `main`), built from the already-paid assets only.
Design record: **ADR-0052** (embed design finalized — engine scrubs any mp4,
so the AI-finish vs real-footage choice needs no engine rework).

What shipped locally:
- **Encodes (§5):** legs 1–3 → `public/marketing/vid/{storefront,order,momo}.mp4`
  (1080p native, crf 20, `-g 8`, `-an`, faststart, unsharp; 13.0/6.6/6.8 MB).
- **Posters:** `public/marketing/scroll/*.webp` — scenes 1–3 use each
  encoded leg's ACTUAL first frame (no poster→video flash); scenes 4–6 use
  the approved stills (61–223 KB each).
- **Real MoMo logo:** official "MoMo from MTN" lockup downloaded to
  `public/marketing/scroll/momo-logo.png` (320×320; rendered as a 64px badge
  in the scene-3 overlay). ZanTap screens reuse the fresh Z-brand captures
  `public/marketing/screen-{storefront,kitchen}.png` as cropped 190px chips
  in scenes 2/4. Nothing baked into video.
- **Engine:** `components/marketing/scroll-world/scrub-engine.ts` (adapted
  per the wiring plan below: sticky 100vh viewport, container height
  (Σw+1)×vh, container-top-relative offsets, clamped edge segments,
  unclamped prefetch, topbar/scrollbar/particles dropped, route rail + hint
  kept, `connectors: []`, crossfade 0.08, destroy() cleanup) +
  `ScrollWorldSection.tsx` client island; copy in `SCROLL_WORLD`
  (`lib/marketing/copy.ts`, i18n-ready). Mounted in `app/page.tsx` between
  `#how` and the product/offer flow. Finale CTA → `#lead-form`; Save-Data
  treated as reduced-motion; weights 5×1.3 + grow 1.6 w/ linger 0.35.
- **QA (skill Step 8):** `.scratch/product-restructure/scroll-world/preview-qa.mjs`
  — **13/13 PASS** (blob seekable, currentTime tracks scroll, seam
  before/after shots in `qa-shots/`, MoMo logo + CTA, zero console errors,
  reduced-motion loads ZERO videos + stills shown, 390px no overflow + copy
  visible). `npm run lint` clean, `npm run build` clean, `npm test` 266/80.

**Two hard-won gotchas (recorded in ADR-0052):**
1. Do NOT wrap the engine CSS in `@layer` on this page — Tailwind preflight
   is unlayered and beats ANY layered rule (`video{height:auto}` letterboxes
   the clips; `h3{font-size:inherit}` collapses titles). Inject unlayered.
2. The stock engine's per-frame copy transform OVERWRITES the CSS
   `translateY(-50%)` centering — fold `-50%` into the inline transform on
   desktop (mobile stays bottom-anchored) or tall copy blocks spill.

**Owner review 2026-08-09 (same day, after scrolling the preview):**
- Preview "looks good" EXCEPT AI-invented device UIs: the fake blue/white
  payment screen baked into `leg_momo.mp4` (close-up centerpiece of scene 3,
  clashes with the real MoMo badge beside it) and, minor, the blurry
  thumbnails in `leg_order.mp4`. `still_order.png` (woman + phone with fake
  menu grid) also flagged — it is NOT used on the page (scene 2's poster is
  the leg's first frame); leave it unused.
- **CREDIT BALANCE CORRECTION: ~112–120 credits remain** (owner spent the
  rest on social marketing; the 881.42 figures above are stale). Video
  re-renders (72cr/1080p, 26cr/720p) are effectively off the table → the
  AI-chain finish is no longer realistic; **real walkthrough footage is now
  the favored finish path** (also natively solves screens-in-frame). Stills
  (7cr) are acceptable to the owner but ONLY with explicit approval before
  each generation — always ask first.
- **APPROVED (to do in the NEXT session, zero credits): swap scene 3 to
  still-crossfade** — drop `clips.momo` in `ScrollWorldSection.tsx` and
  regenerate the scene-3 poster from `still_momo.png` (clean blank-amber
  phone screen, no fake UI) instead of the leg's first frame. Reversible:
  the corrected clip re-slots whenever the film is finished. Re-run
  `preview-qa.mjs` after (expect the blob/scrub checks to now cover 2 clips).
- Owner will test the swapped preview locally BEFORE any commit/deploy —
  do not push anything to production without his explicit go.
- **Proposed prompt clause for ALL future stills/legs** (pending formal
  owner approval, record verbatim in prompt files when approved):
  "Any phone, tablet or screen in frame is either switched off (dark
  glass), tilted away from camera, or catching window glare — its display
  content is NEVER visible or readable. Do not invent any app interface,
  menu screen, payment screen, buttons, or icons. The product's real
  interface is added later in post, outside this image."

## Scroll-world session log — 2026-08-09 (later session: scene-3 swap DONE)

**Owner-approved ZERO-CREDIT scene-3 still-crossfade swap executed. No
Higgsfield calls, no generations of any kind, zero credit spend (balance
stays ~112–120).** Still UNCOMMITTED on `main`; NOT deployed — owner tests
locally first.

- `ScrollWorldSection.tsx`: `momo` removed from `clips` (scene 3 now takes
  the engine's clip-less still-crossfade path, same as scenes 4–6; comment
  records why + that the clip re-slots when the film is finished).
  `public/marketing/vid/momo.mp4` left on disk, unused, per plan.
- Poster `public/marketing/scroll/momo.webp` regenerated from the approved
  `still_momo.png` (clean blank-amber phone screen, no fake UI) instead of
  the rejected leg's first frame — ffmpeg `scale=1600:-2` quality 82 →
  1600×1062, 142 KB.
- QA re-run **13/13 PASS** (`preview-qa.mjs`, dev server on 3000): blob/scrub
  checks now cover exactly 2 clips (storefront, order); scene-3 shot shows
  the clean amber screen + real MoMo badge; seam 2→3 is now a composition
  crossfade (order-leg last frame → momo still), same class as the existing
  still seams, softened by crossfade 0.08 — acceptable per the approved
  reversible plan. Fresh shots in `qa-shots/`.
- `npm run lint` clean, `npm run build` clean, `npm test` 266/80 (baseline).

Open gates (owner's): (a) scroll the swapped preview locally
(`npm run dev` → localhost:3000, section after "What happens next");
(b) finish path — real walkthrough footage now favored at current credits;
(c) whether/when the preview commits + deploys. The no-screens prompt clause
above still awaits formal approval before any future generation.

## Scroll-world session log — 2026-08-09 (logo + mobile hardening completed)

The owner returned after Cursor was interrupted by an unpaid-invoice gate and
asked Codex to inspect exactly what had and had not been completed, finish the
approved ZanTap logo treatment, and make the preview work on mobile. **No
Higgsfield/Monid/image generation was called; zero credits spent. Nothing was
committed or deployed.**

- Cursor had completed only the first item from its five-step checklist:
  `.scratch/product-restructure/build-wordmark-dark.mjs` plus generated proof
  assets. The script preserves amber `Tap`, recolors the near-black `Zan` to
  off-white `#f4f4f3`, and preserves antialiased alpha. The output
  `public/brand/approved-z/zantap-wordmark-logo2-darkbg.png` is 420×116.
- Codex wired that approved two-tone wordmark into the marketing masthead and
  footer, replaced fake `brightness-0 invert` treatment with the real asset,
  and kept intrinsic image dimensions for crisp responsive rendering.
- Mobile scroll hardening in `scrub-engine.ts`: sticky viewport is now
  `100svh` with a `100vh` fallback; JS reads that rendered stable viewport for
  all segment/track math; URL-bar-only resizes no longer relayout the band;
  passive touchmove/touchend events schedule the same rAF read; mobile seek
  catch-up is faster while the existing `video.seeking` guard prevents a
  decoder backlog; safe-area viewport metadata is enabled; the scroll hint is
  moved to the upper-left on phones so it cannot crowd the fixed CTA.
- `StickyCta` now owns a GPU-backed z-80 stacking layer. This fixes the mobile
  compositor case where the amber pill remained visible but its label could be
  painted under the scroll-world z-50/60 layers at the finale.
- QA harness upgraded from a 390px sanity check to a real touch-enabled mobile
  context: wordmark source checks, stable track math, fast-flick seek settling,
  active-copy bounds, sticky CTA label, portrait overflow, landscape rotation,
  and console errors. Result: **19/19 PASS**. Fresh mobile screenshots are in
  `qa-shots/`; portrait and landscape recompose with zero overflow.
- Fresh verification after the implementation: `npm run lint` clean,
  `npm run build` green, `npm test` **266 passed / 80 skipped**, and
  `git diff --check` clean apart from existing CRLF warnings.

Important boundary: the preview is now functionally hardened for mobile but
still uses the two existing 16:9 desktop clips. A true native 9:16 film remains
a separate footage asset pass. At ~112–120 remaining credits, real continuous
walkthrough footage is still the favored finish and no generation may run
without explicit owner approval.

The owner chose **Option B** on 2026-08-09: keep the complete preview local and
finish with native continuous walkthrough footage. On 2026-08-12 the owner
separately overrode the local-only boundary and approved shipping the preview;
the real-footage finish and no-generation boundary remain unchanged.

## Scroll-world session log — 2026-08-09 (Option B chosen; native-footage plan complete)

The owner explicitly chose **B** after confirming that planning and real-footage
integration consume no Higgsfield credits. The uncommitted preview stays local;
nothing was committed or deployed and no media-generation service was called.

- Finish architecture is now real Architecture A footage from a partner
  restaurant: one forward-moving landscape master plus a separately composed
  native 9:16 portrait master, each split into the existing six story beats.
- Detailed capture, choreography, privacy, device settings, frame-accurate
  segmentation, encoding, engine-integration, and QA requirements are recorded
  in `scroll-world/native-walkthrough-footage-plan.md`.
- Credit budget is **zero**. Existing ~112–120 Higgsfield credits remain
  untouched. Optional AI stills are not part of this path and would require a
  new explicit approval.
- The current engine needs optional `clipMobile`/`stillMobile` support when real
  footage arrives; that later code/media integration and any commit/deploy are
  separate owner gates.
- Next blocker is physical pre-production: partner location/permission, capture
  window, phone/gimbal, staged participants/releases, and sanitized demo data.

## Scroll-world session log — 2026-08-10 (capture-readiness intake unavailable)

The owner asked for the native-footage plan to be converted into a named,
location-specific call sheet and timed rehearsal route using readiness details
said to have been supplied in the conversation. A read-only audit of the current
task and the immediately preceding `Prepare partner footage call sheet` task
found only the handoff prompt and the seven unanswered intake questions; no
partner, permission scope, date/window, equipment/camera capabilities,
participants/releases, sanitized demo records, route constraints, or branding
preference is available to write down safely.

- No logistics were inferred and no placeholder was presented as confirmed.
- The existing native-footage plan remains authoritative and unchanged.
- The final-film checkbox stays open; capture and integration remain pending.
- No media was generated, no credits were spent, and no application code,
  commit, deployment, or production state was changed.
- Next gate: paste the eight factual intake fields into this task; then replace
  this blocker with the location call sheet and second-by-second rehearsal route.

Ops notes: Higgsfield CLI auth expired mid-session → `higgsfield auth login`
device flow works from the agent shell (owner approves in browser). ffmpeg 9.0
installed via winget (refresh PATH in each new shell:
`$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
[Environment]::GetEnvironmentVariable("Path","User")`). Parallel Higgsfield
calls: use separate background shells, NOT `Start-Process` (quoting mangles
prompts). Job survives a dropped `--wait`: re-poll with
`higgsfield generate get <job-id> --json`.

## Scroll-world session log — 2026-08-12 (preview release approved)

The owner explicitly approved shipping the complete existing preview while the
real footage is supplied later. Release scope includes the scrub engine, the
two accepted public video clips, six public posters, official MoMo overlay,
approved dark wordmark, raw/generated masters, prompts, boundary frames, QA
screenshots/harness, capture plan, and ADR-0052.

- Scenes 1–2 scrub accepted desktop preview clips; scenes 3–6 intentionally
  crossfade accepted stills. Mobile uses the hardened desktop-preview fallback;
  it is not represented as native 9:16 footage.
- The owner-rejected generated MoMo clip is retained only as raw archival
  evidence under `.scratch/`; its public encode is excluded and it is not wired.
- Provider `.json`/`.err` metadata is excluded from Git because it contains
  third-party job URLs/identifiers; the actual generated media and reproducible
  prompt/frame evidence are included.
- Release verification: `npm run lint` clean; `npm test` **284 passed / 89
  skipped**; `npm run build` green; scroll-world skill Step 8 **19/19 PASS**
  after a clean single-server restart, including blob seekability, scroll-time
  tracking, reduced motion, touch seek settling, CTA/copy bounds, and portrait/
  landscape overflow. Seam screenshots were visually reviewed.
- Final native 16:9 + 9:16 footage capture/integration stays open; no new media
  generation or payment behavior was authorized.
- Release commit `3a80e3e` was pushed to `main`; Vercel Production deployment
  `dpl_6iMs3LEJw3Y8VPgfdc56SHiynCLn` reached Ready on `zantap.app`. Production
  smoke passed: root and active public assets 200, video byte range 206, rejected
  `/marketing/vid/momo.mp4` 404, browser Step 8 19/19, and no error/warning logs
  in the release window. QA screenshots contain only public marketing content.
