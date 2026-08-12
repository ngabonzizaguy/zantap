# ADR-0052 — Scroll-world cinematic as a mid-page sticky embed on `/`

Date: 2026-08-09
Status: Accepted (amended 2026-08-12: preview approved for production;
native real-footage replacement remains selected)
Relates to: ADR-0047 (motion stack + conversion guard), ADR-0049 (marketing
root page), `.scratch/product-restructure/issue-03.md` (scroll-world session
log), `.agents/skills/scroll-world/SKILL.md`

## Context

The owner approved (2026-08-09) a ZERO-CREDIT preview of the Issue-03
scroll-world cinematic: wire the already-paid assets (6 approved stills,
frame-locked desktop legs 1–3) into the live marketing page so the scroll
experience can be felt before deciding how to finish the film — (a) resume
the AI chain within the credit floor, or (b) shoot real continuous
walkthrough footage of a partner restaurant. The skill's stock engine
(`references/scrub-engine.js`) assumes it owns the whole page from scrollY=0
with `position:fixed` layers; `/` is an existing conversion-first funnel
(ADR-0049) where the cinematic must never bury the lead form (ADR-0047).

## Decision

1. **Mid-page sticky embed, not a takeover.** The engine is adapted into
   `components/marketing/scroll-world/scrub-engine.ts` (vanilla logic,
   typed) + a `ScrollWorldSection.tsx` client island mounted between `#how`
   and the product/offer flow of `app/page.tsx`. A `position:sticky` 100svh
   viewport (`100vh` fallback) lives inside a track container whose height is
   (Σ scroll weights + 1) × vh; segment offsets are measured from the
   container's document top (read per rAF frame). Scroll progress is clamped
   to the band so the first/last scenes hold their edge frame at full
   opacity while the section scrolls in/out; clip prefetch uses the
   UNCLAMPED offset (nearby-only loading). Engine topbar/scrollbar/nav/
   particles are dropped (the page has its own masthead + StickyCta); route
   rail + scroll hint are kept. The engine returns a destroy() cleanup for
   React StrictMode.
2. **Architecture A wiring, preview shape.** No connectors; `crossfade`
   0.08. Scenes 1–2 scrub the accepted §5-encoded legs (1080p native,
   crf 20, `-g 8`, `-an`, faststart, unsharp →
   `public/marketing/vid/{storefront,order}.mp4`, 6.6–13 MB); scenes 3–6
   crossfade their accepted stills (the engine's clip-less path). Posters are
   webp in `public/marketing/scroll/`: scenes 1–2 use each leg's actual first
   frame (no poster→video flash), and 3–6 use the accepted stills.
3. **Native-asset rule honored in HTML, never in video.** The real
   "MoMo from MTN" logo (`public/marketing/scroll/momo-logo.png`, official
   lockup) and the real ZanTap product screens (`screen-storefront.png`,
   `screen-kitchen.png`) render in the copy overlay layer via a per-section
   `media` config (`kind: "logo" | "screen"`, screens cropped to a
   top-aligned 190px chip). AI video never carries logos or UI.
4. **Engine CSS is injected UNLAYERED** — a deliberate deviation from the
   stock engine's `@layer sw` wrapper. Tailwind's preflight is unlayered and
   unlayered styles beat ANY layered rule: `video{height:auto}` letterboxed
   the clips and `h3{font-size:inherit}` collapsed the titles under the
   layer. The dark theme (`--sw-bg:#0c0a09`, `--sw-ink:#f4f4f3`,
   `--sw-accent:#f5a623`, `--font-display`/`--font-body` vars) is baked into
   the `.sw-root` defaults instead of relying on page-level overrides.
5. **Guards per ADR-0047:** `navigator.connection.saveData` is treated
   exactly like `prefers-reduced-motion` (stills crossfade, clips are never
   fetched); the finale section's engine CTA links to `#lead-form`; the
   page's StickyCta remains mounted and reachable throughout the band.
   Desktop copy centering rides inside the per-frame parallax transform
   (`translateY(calc(-50% + …vh))`) so tall copy blocks (title + body +
   media chip) cannot spill off-viewport; mobile stays bottom-anchored.
6. **i18n copy stays in `lib/marketing/copy.ts`** (`SCROLL_WORLD` constant,
   6 sections + media alt strings) — no JSX-hardcoded strings.

## Consequences

- The embed design is final regardless of how the film is finished: the
  engine scrubs any mp4, so AI legs 4–6 or real walkthrough footage drop
  into the same config (real footage from one continuous take needs no seam
  work, only segment cuts + §5 encodes).
- QA harness `.scratch/product-restructure/scroll-world/preview-qa.mjs`
  (19 checks: blob seekability, currentTime tracking, seam shots, overlay
  media, CTA, reduced-motion, dark wordmark wiring, stable mobile viewport,
  fast touch scrub, copy/CTA bounds, and portrait/landscape overflow) is the re-run gate for any
  future asset swap.
- ~20 MB of active mp4 lives in `public/marketing/vid/`; clips load only when
  the visitor nears the band, and never under reduced-motion/Save-Data, so
  the Rwanda data budget is respected. Mobile currently receives the
  desktop encodes (acceptable for a desktop-preview); a native 9:16 chain
  remains an explicit owner opt-in per the skill.
- No mobile 9:16 chain, no connectors, and legs 4–6 remain unrendered in this
  shipped preview. The owner selected native real footage as the final-film path;
  capture and integration are pending under the amendment below.

## Amendment — 2026-08-09: scene 3 demoted to still-crossfade (owner review)

The owner rejected the AI-invented payment screen baked into `leg_momo.mp4`
(clashes with the real MoMo badge in the overlay — violates the
native-asset rule in spirit). Zero-credit fix, executed same day:

- `momo` removed from the `clips` config in `ScrollWorldSection.tsx`; scene
  3 now takes the engine's clip-less still-crossfade path. Scenes 1–2 scrub
  video; 3–6 crossfade stills.
- The scene-3 poster (`public/marketing/scroll/momo.webp`) is regenerated
  from the approved `still_momo.png` (clean blank-amber phone screen)
  rather than the rejected leg's first frame.
- Reversible by design: the rejected generated source remains archived as
  `.scratch/product-restructure/scroll-world/leg_momo.mp4`, but its unused
  public encode is excluded from production. Replacement footage re-slots into
  the same config whenever the film is finished.
- QA harness re-run 13/13; its blob/scrub checks are count-agnostic and now
  cover the 2 remaining clips.

## Amendment — 2026-08-09: approved wordmark + stable mobile preview

The owner requested that the dark marketing surface use the provided ZanTap
wordmark professionally and that the scroll-world work on mobile. Cursor was
interrupted after generating the wordmark variant; Codex audited and completed
the remaining zero-credit work:

- `zantap-wordmark-logo2-darkbg.png` is the approved transparent wordmark for
  dark surfaces: off-white `Zan`, amber `Tap`, original antialias alpha. The
  masthead/footer use it directly; CSS inversion is removed.
- The sticky viewport is `100svh` (`100vh` fallback), and JS measures the
  rendered viewport so segment math cannot diverge from CSS when browser chrome
  opens/closes. Width-stable mobile resize events schedule a read but do not
  rebuild the track; rotation still relayouts.
- Passive touchmove/touchend reads and a faster mobile catch-up coefficient
  improve scrub response without defeating seek coalescing or native scrolling.
  `viewport-fit=cover` and existing safe-area offsets protect notches/home bars.
- The mobile scroll hint moves above the content/CTA collision zone. The global
  StickyCta sits in an isolated GPU-backed z-80 layer, above the engine's z-60
  chrome, fixing a captured compositor paint loss of its text.
- QA is now 19/19 in a touch-enabled 390×844 context plus 844×390 rotation.
  No generated media or credits were used in this hardening pass. The preview
  was subsequently approved for release in the 2026-08-12 amendment below.

This amendment hardens the desktop-preview footage on phones; it does **not**
claim a native portrait film. A real 9:16 chain or real portrait walkthrough
footage remains a separately approved asset decision under the scroll-world
skill's mobile rule.

## Amendment — 2026-08-09: native continuous walkthrough selected (Option B)

The owner explicitly chose to keep the complete preview local and finish the
cinematic with real partner-restaurant footage. This decision consumes zero
Higgsfield credits and makes further AI-chain generation out of scope unless a
later owner decision explicitly re-authorizes it.

The final asset contract is:

- Architecture A remains: no connectors and no camera reversal at section
  boundaries.
- Capture one continuous 16:9 landscape master and a separately composed native
  9:16 portrait master of the same six-beat route. Portrait is not a crop.
- Split each master into six adjacent clips that share their source boundary
  frame; retain the existing `crossfade: 0.08` as codec/seam insurance.
- Capture at 4K/25 fps, 1/50 shutter, SDR with locked exposure/white balance,
  then deliver 1080p desktop and 720×1280 mobile H.264 scrub encodes. The lower
  delivery resolutions are deliberate for Rwanda mobile data budgets; 4K raw
  masters remain archived.
- Real or sanitized ZanTap UI may appear only when it exposes no personal or
  payment data. The official MoMo and ZanTap assets remain in the HTML overlay;
  no invented interface or logo is baked into replacement footage.
- When footage arrives, the embed gains optional `clipMobile`/`stillMobile`
  fields and the full native-mobile Step 8 QA. That code/media integration,
  local owner review, commit/deploy, and production smoke are separate gates.

The actionable capture and integration specification is
`.scratch/product-restructure/scroll-world/native-walkthrough-footage-plan.md`.
## Amendment — 2026-08-12: preview release approved

The owner explicitly approved shipping the current preview while real footage is
prepared later. The engine, active public preview media, generated source shots,
prompt/frame/QA evidence, and this ADR are committed together. The current release
therefore exposes the complete six-scene experience: scenes 1–2 scrub the approved
preview clips and scenes 3–6 crossfade approved stills. It does not claim to be the
final native-footage film or a native 9:16 mobile chain.

Release hygiene:

- the rejected MoMo clip is archived only under `.scratch/`; it is not public or wired;
- Higgsfield JSON/error metadata containing provider URLs is retained locally, not
  committed;
- generated masters, prompts, boundary frames, and QA screenshots are committed as
  reproducible project evidence;
- the Step 8 harness passes 19/19 after a clean dev-server restart, including blob
  seekability, scroll tracking, reduced motion, touch seek settling, safe-area bounds,
  and portrait/landscape overflow.

Real 16:9 and 9:16 partner-restaurant footage remains a future asset replacement under
the existing capture plan; no new generation or payment behavior is authorized here.
