# Codex ↔ Cursor shared continuity prompt

Last reconciled: **2026-08-12 (Africa/Kigali)**
Scope: the product-restructure, marketing, lead-capture, PWA/KDS-polish, and
Paypack-preparation work performed across Cursor- and Codex-associated sessions.

This is the durable coordination entry point for both agents. It summarizes
current truth and points to the detailed artifacts; it does not replace issue
files, ADRs, commit diffs, or the production log in `AGENTS.md`.

## Prompt for the next Cursor or Codex session

You are continuing ZanTap in a repository that has recently been worked on by
both Cursor and Codex. Treat the filesystem and Git history as shared state.
Do not assume that a branch name identifies the only author, and do not discard
uncommitted work you did not create.

Before changing anything, read these files in order:

1. `AGENTS.md`, especially the mandatory handoff protocol, Store seam rules,
   production lessons, and dated status entries.
2. `.cursorrules`, especially Anti-YOLO, UI boundaries, and payment grilling.
3. This file: `docs/agents/codex-cursor-shared-handoff.md`.
4. `.scratch/architecture-candidates.md`.
5. The relevant issue under `.scratch/product-restructure/` or
   `.scratch/pwa-kds-paypack-polish/issue-01.md`.
6. The relevant ADR(s), especially `docs/adr/0046-*.md` through
   `docs/adr/0053-*.md`.

Then run `git status --short --branch` and inspect the relevant commit/diff.
Preserve every pre-existing dirty or untracked path unless the current task
explicitly owns it.

### Reconciled repository and production state

- The Issue 05 behavior-bearing tip is `943efbc` (2026-08-12): multi-recipient
  WhatsApp routing plus its Lead-age hydration review fix on top of the two
  PWA/KDS commits plus the approved durable-lead-capture replay:
  - `0b685ea` — PWA/installable-kitchen baseline (replay of source commit
    `fce8360`).
  - `1cf4a5a` — KDS tap-state/filter-rail polish (replay of source commit
    `9f0a66d`).
  - `c79738e` — durable lead capture (conflict-free cherry-pick of `2d6e391`;
    owner-approved after Cursor audit 2026-08-09).
  - `1626c13` — Issue 05 Ops Leads, audited routing settings, and the
    user-confirmed public WhatsApp continuation.
  - `5aee9b2` — multiple independently enabled recipients, immutable Lead
    assignments, and concurrency-safe round-robin through both Store adapters.
  - `943efbc` — suppresses expected relative-time hydration drift in both Lead
    inbox layouts after production review found two recoverable React errors.
- Latest behavior-bearing production deployment is
  `dpl_6iMs3LEJw3Y8VPgfdc56SHiynCLn` (`zantap-qg9ax88dn`, 2026-08-12), Ready at
  `https://zantap.app` from main at `3a80e3e`; it ships the scroll-world preview
  on top of the already-smoked Issue 05 routing behavior.
  Migration `20260811234500_multi_recipient_lead_routing` is applied. Final
  authenticated configuration is complete: `…8786` enabled and owner-supplied
  `…7771` disabled, with `1 of 2 enabled` visible in Ops. Persistence-first and
  assigned Lead smokes passed; the post-fix Lead inbox has zero console errors.
- The current working branch is `main`; scroll-world release commit `3a80e3e`
  is pushed to `origin/main`. The documentation closure records its exact
  Production evidence without changing application behavior.
- The working tree was already dirty before this continuity file was added.
  Modified tracker files included `.scratch/architecture-candidates.md` and
  several product-restructure/social issue files. Untracked work included
  `.scratch/product-restructure/scroll-world/` and
  `.scratch/pwa-kds-paypack-polish/`. These are retained project records/assets,
  not cleanup targets.

### What the Cursor-associated product-restructure stream changed

- `877cef0` rolled the approved black-and-amber Z mark through onboarding,
  KDS, Ops, and browser icons; it retired the old medallion and recorded the
  dark-surface asset rule in ADR-0048. A later commit, `88a6fb0`, added the
  Cursor Cloud single-server/in-memory-development guidance to `AGENTS.md`.
- `2479b19` swept live configuration/docs from `zantap.ai` to `zantap.app`
  after the domain cutover. Production now uses `zantap.app`; historical dated
  references may remain as history.
- `fe9f5d1` replaced the root demo redirect with the production marketing
  funnel: conversion-first page, Kigali hero media, GSAP reveals, restrained
  Three.js accent, mobile sticky CTA, i18n-ready copy, lead-form interface,
  SEO/robots/sitemap, and Store-level reserved vendor slugs. ADR-0049 is the
  decision record. It shipped with the Z-brand and domain work in deployment
  `zantap-qv9d8y90w`; that deployment is now superseded by the later PWA/KDS
  production deployment, which retains the same features.
- Durable form submission superseded the interim WhatsApp transport in
  `c79738e`; it is deployed and DB-smoked (see the latest production state and
  Issue 04 ledger entry).

Detailed sources:

- `.scratch/product-restructure/issue-01.md`
- `.scratch/product-restructure/issue-02.md`
- `.scratch/product-restructure/issue-03.md`
- `docs/adr/0048-z-mark-surface-variant-mapping.md`
- `docs/adr/0049-marketing-root-page.md`

### What the Codex-associated stream changed

- The owner interview and restructure direction were formalized in ADR-0046;
  the marketing motion stack and conversion guard were formalized in ADR-0047.
  The issue plan is under `.scratch/product-restructure/`.
- Scroll-world generation is halted at ~112–120 credits. Six desktop stills,
  one portrait still, desktop legs 1–3, portrait leg 1, prompts, and handoff
  frames are retained under `.scratch/product-restructure/scroll-world/`.
  The zero-credit preview is encoded, committed, and deployed; scene 3 uses the
  owner-approved clean still, and mobile behavior/branding are hardened with
  local and Production 19/19 QA. On 2026-08-09 the owner chose **Option B**:
  finish with native continuous
  partner-restaurant footage (16:9 + separately composed 9:16, zero generation
  credits). Capture/integration plan:
  `.scratch/product-restructure/scroll-world/native-walkthrough-footage-plan.md`.
  Never resume generation without a new explicit owner decision.
- Commit `2d6e391` implemented durable marketing lead capture through the
  existing Store seam: Prisma model/migration, both Store adapters, contract
  tests, async-only Server Action, validation, canonical phones, honeypot, and
  best-effort limits. Migration `20260806213500_durable_lead_capture` was
  applied. After Cursor audit and owner approval it was replayed to main as
  `c79738e`, deployed, and smoked through the live form and production DB.
  ADR-0050 and Issue 04 are authoritative.
- Source commits `fce8360` and `9f0a66d` delivered the PWA/KDS-polish batch,
  later replayed to clean main as `0b685ea` and `1cf4a5a`. Shipped behavior:
  root and vendor-specific install manifests; approved-Z standard/maskable
  icons; production-only service-worker registration; versioned static-shell
  caching that excludes API/SSE/payment traffic; offline fallback and global
  offline indicator; Lucide-based shared icon adapter; newest-first KDS queue;
  coachmarks disabled; subtler 44px help control; normal deferred Setup cards
  with “Soon” badges; dark-KDS press/hover polish; contained swipeable Orders
  filter rail. ADR-0051 records the accepted baseline.
- Paypack work in that batch was research/documentation only:
  `docs/integrations/paypack-api-reference.md`. Production payment behavior was
  not changed; manual MoMo remains live. Any real Paypack/MTN callback or money
  state implementation requires the mandated payment grilling first.

Detailed sources:

- `.scratch/product-restructure/issue-03.md`
- `.scratch/product-restructure/issue-04.md`
- `.scratch/pwa-kds-paypack-polish/issue-01.md`
- `docs/adr/0046-restructure-decisions-owner-interview.md`
- `docs/adr/0047-landing-page-motion-stack.md`
- `docs/adr/0050-durable-lead-capture.md`
- `docs/adr/0051-pwa-icon-and-kds-polish-baseline.md`
- `docs/integrations/paypack-api-reference.md`

### Shipped versus not shipped — decision boundary

| Work | Local/main state | Production state |
|---|---|---|
| Z-brand rollout, `zantap.app` sweep, root marketing funnel | On main | Shipped and smoke-tested |
| PWA baseline + KDS visual/interaction polish | On main (`0b685ea`, `1cf4a5a`) | Shipped and curl-smoked; owner visual pass |
| Durable lead capture | On main (`c79738e`, replay of `2d6e391`); migration applied | Shipped 2026-08-09 (`zantap-lxwwvr7vs`); live form + DB row smoked; WhatsApp interim transport retired |
| Scroll-world cinematic | Preview on main (`3a80e3e`): engine, active public media, generated/raw evidence, scene-3 still swap, dark wordmark, stable mobile/touch hardening, ADR-0052, QA 19/19 | Preview shipped + prod-smoked 2026-08-12 (`dpl_6iMs3LEJw3Y8VPgfdc56SHiynCLn`); native 16:9 + 9:16 partner footage replacement pending; generation remains halted |
| PWA Android install/standalone/airplane-mode acceptance | Code shipped | Human device smoke still pending |
| Offline kitchen-stage mutation queue + new-order chime (Issue 09b) | Not implemented | Not shipped |
| Paypack API integration | Reference document only | Not implemented; manual MoMo unchanged |
| Ops lead inbox + configurable WhatsApp lead routing (Issue 05) | On main (`5aee9b2`, review fix `943efbc`); multi-recipient CRUD, immutable assignment, concurrency-safe round-robin, one public action | Done: migration applied, prod-smoked, and configured 1 of 2 enabled (`…8786` enabled, `…7771` disabled); post-fix Lead inbox zero console errors |

### Required engineering boundaries for subsequent work

- Use `lib/store/` as the only server data seam. Update both in-memory and
  Prisma adapters plus contract tests. Never introduce browser-side or ad-hoc
  Supabase access.
- A `"use server"` module exports async actions only. Import types from their
  source modules; never re-export types or non-async values from action files.
- Payment, callback, settlement, verification, or offline money-state changes
  require `/grill-with-docs` (or the required structural interview) before
  edits. Never queue payment/menu/profile/dispatch mutations in the offline KDS
  queue.
- Read `DESIGN.md` before UI work, but also reconcile its stale light-editorial
  claims with ADR-0043/0046 and the actual dark storefront/KDS tokens. Issue 08
  exists specifically to make that authority coherent.
- Use one dev server on port 3000. With no `DATABASE_URL`, development uses the
  seeded in-memory Store. Run `npm run build` after server-action or bundler-
  sensitive edits; dev-green is insufficient.
- Never call something deployed from the existence of a commit or migration.
  Record the deployment ID and smoke evidence separately.

### Current safe next decisions

1. Issue 05 multi-recipient routing is DONE: deployed, prod-smoked, and configured
   with `…8786` enabled and `…7771` disabled. No remaining Issue 05 gate.
2. Complete the Android install/standalone/airplane-mode human smoke for PWA
   Issue 09a. This is an acceptance task, not authorization to build Issue 09b.
3. Issue 09b (offline kitchen-stage queue + chime) is separately ready for an
   agent. Follow ADR-0046 and create the required offline-model ADR.
4. ~~Scroll-world zero-credit preview + owner-requested logo/mobile pass~~ —
   SHIPPED + PROD-SMOKED 2026-08-12 (`3a80e3e`, 19/19). **Option B remains:**
   capture native continuous partner-restaurant footage as the final asset
   replacement. Next gate is physical pre-production using
   `scroll-world/native-walkthrough-footage-plan.md`; generation remains
   prohibited. The 2026-08-10
   call-sheet pass found no actual partner logistics in the current or preceding
   task history, so the owner must paste the missing intake before the plan can
   be made location-specific.
5. Do not implement Paypack merely from the reference document. Run the payment
   grilling flow and create a dedicated PRD/issues first.

### How both agents must maintain this file

At the end of any session that changes one of the workstreams above:

1. Update the reconciled repository/production state and the shipped/not-
   shipped table in this file.
2. Append one concise entry to the session ledger below with agent, branch,
   commits, files/issues/ADRs, validation, deployment ID, and remaining gate.
3. Update the actual issue checkboxes/status and
   `.scratch/architecture-candidates.md`; write an ADR for a real design or
   architecture decision.
4. Print the mandatory copy/paste-ready next-session prompt. Point that prompt
   back to this file and the exact issue/ADR involved.

Do not paste secrets, owner tokens, API keys, personal recipient details, or
database credentials here.

## Session ledger

### 2026-08-12 — Codex — scroll-world preview release

- Owner explicitly approved shipping the complete preview while real footage is
  supplied later. Commit `3a80e3e` includes the engine, active public clips/
  posters, approved dark wordmark, raw/generated masters, prompts, boundary
  frames, capture plan, QA harness/screenshots, and ADR-0052. Provider job
  `.json`/`.err` files remain local; the rejected MoMo video is archival only.
- Validation before release: lint clean, full suite 284 passed / 89 skipped,
  production build green, local Step 8 19/19. Production deployment
  `dpl_6iMs3LEJw3Y8VPgfdc56SHiynCLn` reached Ready on `zantap.app`.
- Production smoke: root + active public media 200, rejected public MoMo encode
  404, video byte-range request 206, desktop/touch/reduced-motion Step 8 19/19,
  no browser errors or overflow, and no Vercel warning/error logs in the release
  window. The harness now waits for decoder-settled seeks and can write prod
  evidence to a separate `QA_SHOTS` directory.
- Remaining gate: capture/integrate separately composed native 16:9 + 9:16
  partner footage. The shipped phone experience remains a clearly documented
  desktop-preview fallback; no new generation was authorized.

### 2026-08-12 — Codex — Issue 05 multi-recipient routing release

- Implemented from `1626c13` with TDD through the Store interface and both
  adapters: Ops recipient CRUD/toggles, persist-before-route behavior, immutable
  assignment snapshots, one public CTA, and advisory-lock-serialized round-robin.
  Migration: `20260811234500_multi_recipient_lead_routing`; design: ADR-0053.
- Validation: Prisma/TypeScript/lint/build green; full suite 284 passed / 89
  skipped; focused 97 passed; isolated Postgres Lead contract 11/11 including a
  12-way concurrent assignment run. Scoped implementation commit `5aee9b2` was
  pushed and deployed as `dpl_C5BBDbY4wiZVypSAvofSz2quRqpX`.
- Authenticated Production Ops configured recipient `…8786`. With it disabled,
  labeled Lead `ISSUE05 PERSIST FIRST 20260812 0017` persisted as Unassigned and
  exposed no public WhatsApp action. After enabling it, labeled Lead
  `ISSUE05 ROUTED 20260812 0018` exposed exactly one action and appeared assigned
  to `Primary operator · WhatsApp …8786`. Error/warning runtime scans were empty.
- Production review found two recoverable hydration mismatches from relative Lead
  ages rendered in desktop/mobile markup. `943efbc` wraps both in stable semantic
  `<time>` nodes with expected hydration drift suppressed; focused 97, TypeScript,
  lint, and the production build passed before push. Follow-up deployment
  `dpl_HTWEh9G18kJ9QF5Er9hatqfuTScq` reached Ready on `zantap.app`; root returned
  200, unauthenticated Ops routes retained their expected 307 login redirect,
  and its initial runtime error scan was empty.
- Final configuration completed later on 2026-08-12 after the owner supplied the
  approved number: Ops canonicalized it and shows `1 of 2 enabled`, with `…8786`
  enabled and `…7771` disabled. `/ops/leads` loaded with zero browser console
  errors. The authenticated settings tab was left as a handoff; documentation
  retains suffixes only.

### 2026-08-11 — Codex — Issue 05 multi-recipient refinement opened

- Owner requires multiple WhatsApp routing recipients with independent availability;
  two initial numbers were supplied and are recorded only as suffixes `…8786` and
  `…7771`. Recipient `…7771` is temporarily unavailable and must start disabled.
- Audited the deployed interface: one singleton setting stores one `whatsappPhone`,
  and a successful Lead returns one `whatsappUrl`. No code, schema, production
  configuration, Lead, or WhatsApp action changed in this pass.
- Open decision before TDD implementation: distribute enabled recipients one Lead at
  a time (recommended round-robin), expose multiple public actions, or use ordered
  primary/fallback routing. The existing authentication/configuration smoke remains
  pending after the refinement ships.

### 2026-08-11 — Codex — Issue 05 authentication re-check blocked safely

- Claimed the existing Chrome ZanTap Ops tab and navigated directly to
  `https://zantap.app/ops/settings`; production redirected to `/ops/login`, whose
  visible state was the empty operator sign-in form. The browser is not authenticated.
- The routing recipient supplied in the continuation prompt was still the literal
  placeholder `<APPROVED E.164 NUMBER>`, not a usable E.164 value. No operator secret
  or phone value was inspected, entered, or recorded.
- No routing setting, public Lead, WhatsApp action, status, code, deployment, or
  production data changed. The Ops login tab remains open for owner authentication.
- Remaining gate: authenticate the open Chrome tab and provide the actual approved
  E.164 recipient; then save/enable routing and prove public Lead persistence in
  `/ops/leads` before activating `Continue on WhatsApp`.

### 2026-08-11 — Codex — Issue 05 continuation awaiting owner input

- Re-read the release issue, architecture tracker, ADR-0053, shared handoff,
  migration, and project rules; confirmed `main` matches `origin/main` at
  `1626c13` and preserved every unrelated dirty/untracked path.
- Connected to the existing Chrome ZanTap Ops tab and navigated to
  `/ops/settings`; production redirected it to `/ops/login`, confirming the
  browser is not authenticated. The login tab was left open for the owner.
- No actual approved recipient was available beyond the earlier placeholder,
  so no routing setting, Lead, status, code, deployment, or production data was
  changed. No ADR amendment was warranted because no decision changed.
- Remaining gate: owner signs in on the open Ops tab and provides the approved
  E.164 recipient; then save/enable routing and run the public Lead persistence
  → `/ops/leads` → WhatsApp CTA smoke in that order.

### 2026-08-11 — Codex — Issue 05 production release (configuration blocked)

- Reviewed `1626c13`; it contains the scoped Issue 05 implementation and none
  of the unrelated dirty scroll-world, PWA, branding, or continuity work.
- Owner explicitly approved production release. Applied migration
  `20260810222500_lead_routing_settings`, pushed `main`, and verified Vercel
  Production deployment `dpl_4b9iYy6gHFcP4fsShoBdsLJuxQBE`
  (`zantap-pb9sk1dwr`) Ready on `zantap.app`.
- Root and Ops routes returned 200; guarded `/leads` and `/lead-routing` reads
  returned 200; release-window runtime logs contained no errors.
- Remaining gate: the approved-recipient field was supplied as the literal
  placeholder `<E.164 number>`, and both browser profiles redirect to the Ops
  login. The actual E.164 recipient and an authenticated `/ops/settings`
  session are required before saving routing and running the public Lead smoke.

### 2026-08-10 — Codex — capture-readiness intake audit blocked safely

- Read the required repo rules, shared handoff, Issue 03, ADR-0052, native
  footage plan, scroll-world skill, and `git status --short --branch`; preserved
  the existing dirty/untracked tree on `main` at `c79738e`.
- Read the current task and the immediately preceding `Prepare partner footage
  call sheet` task. They contain the handoff prompt and the unanswered intake
  questionnaire, but none of the promised location-specific facts.
- Did not invent logistics or write a misleading call sheet. No media was
  generated, no credits were spent, and no application code, commit,
  deployment, or production state changed. No ADR amendment was warranted
  because no design decision was made.
- Remaining gate: owner pastes partner/location, written-permission scope,
  date/time, gear/camera-lock capabilities, participants/release status,
  sanitized demo vendor/order data, route constraints, and branding preference.

### 2026-08-09 — Codex — Option B selected; native-footage plan completed

- Owner explicitly chose to keep the complete scroll-world preview local and
  finish with real footage. No media was generated, no credits were spent, and
  nothing was committed or deployed.
- Wrote `.scratch/product-restructure/scroll-world/native-walkthrough-footage-plan.md`:
  two continuous masters (16:9 + native 9:16), six-beat choreography, 4K/25 fps
  1/50 capture settings, permissions/PII controls, frame-adjacent segmentation,
  1080p/720p encodes, later `clipMobile`/`stillMobile` wiring, and expanded QA.
- Amended Issue 03 and ADR-0052 and updated the architecture status. Existing
  preview/app/media changes and all unrelated dirty/untracked paths remain
  preserved.
- Next gate: owner supplies the partner location/permission, capture window,
  phone/gimbal, staged participants/releases, and sanitized ZanTap demo data.
  Footage integration and any commit/deploy remain separate approvals.

### 2026-08-09 — Codex — completed Cursor-interrupted logo + mobile pass

- Audited the interrupted Cursor checklist. Cursor had completed the
  dark-surface wordmark builder/output/proof only; masthead/footer wiring,
  mobile scrub changes, final QA, and handoff were untouched.
- Wired `zantap-wordmark-logo2-darkbg.png` into the marketing masthead/footer
  and removed `brightness-0 invert`. The asset preserves amber `Tap` and uses
  off-white `Zan` for the charcoal surface.
- Hardened the local scroll-world preview on phones: 100svh/100vh fallback,
  JS measurement of the rendered stable viewport, URL-bar-resize guard,
  passive touchmove/touchend rAF reads, faster coalesced mobile seek catch-up,
  viewport-fit cover, upper-left mobile hint, and z-80 isolated/GPU-backed
  StickyCta to prevent its label painting under the engine.
- Upgraded `preview-qa.mjs`; **19/19 PASS** in desktop, reduced-motion,
  touch-enabled 390×844 portrait, and 844×390 landscape. Fresh validation:
  lint clean, build green, tests 266/80, diff check clean except CRLF warnings.
- No image/video generation, no Higgsfield/Monid calls, zero credits spent.
  Nothing committed or deployed. Native 9:16 footage remains a separate
  asset decision; real walkthrough footage remains favored.
- Remaining gate: owner explicitly authorizes commit/deploy, or keeps the
  preview local while planning real footage.

### 2026-08-09 — Cursor — scroll-world scene-3 still-crossfade swap (zero credits)

- Executed the owner-approved swap exactly: NO Higgsfield calls, no
  generations, zero credit spend (balance stays ~112–120). Not committed,
  not deployed — owner tests locally first.
- `components/marketing/scroll-world/ScrollWorldSection.tsx`: `momo` entry
  removed from `clips` — scene 3 now uses the engine's clip-less
  still-crossfade path (scenes 4–6 already do); the rejected
  `leg_momo.mp4` encode stays on disk at `public/marketing/vid/momo.mp4`
  (unused; re-slots when the film is finished with clean footage).
- Poster `public/marketing/scroll/momo.webp` regenerated from the approved
  `still_momo.png` (clean blank-amber phone, no AI-invented payment UI) via
  ffmpeg scale=1600:-2 q82 (1600×1062, 142 KB).
- Validation: `preview-qa.mjs` 13/13 PASS against the running dev server
  (blob/scrub checks now cover exactly 2 clips); scene-3 + seam shots
  eyeballed (2→3 is a composition crossfade, acceptable per plan); lint
  clean, build green, tests 266 passed / 80 skipped.
- Remaining gates unchanged and owner-owned: local scroll test of the
  swapped preview; real-footage vs AI finish (real footage favored);
  commit/deploy decision for the preview. ADR-0052 amended with the swap.

### 2026-08-09 — Cursor — scroll-world ZERO-CREDIT preview built & QA'd

- Executed the owner's 2026-08-09 decision exactly: NO Higgsfield calls, zero
  credit spend (balance stays 881.42). Built from already-paid assets only.
- Encoded desktop legs 1–3 per pipeline §5 (1080p native, crf 20, `-g 8`,
  `-an`, faststart) → `public/marketing/vid/`; webp posters (leg first-frames
  for scenes 1–3, approved stills for 4–6) → `public/marketing/scroll/`;
  downloaded the official "MoMo from MTN" logo for the overlay.
- Adapted the skill's scrub engine into
  `components/marketing/scroll-world/scrub-engine.ts` as a mid-page sticky
  embed (sticky 100vh viewport, container-top-relative offsets, clamped edge
  segments, no connectors, crossfade 0.08, Save-Data ≡ reduced-motion,
  destroy() cleanup) + `ScrollWorldSection.tsx` island; mounted on `/`
  between `#how` and the product/offer flow; `SCROLL_WORLD` copy in
  `lib/marketing/copy.ts`; finale CTA → `#lead-form`. ADR-0052 records the
  design incl. two gotchas (engine CSS must be UNLAYERED vs Tailwind
  preflight; desktop copy centering must ride inside the per-frame
  transform).
- QA 13/13 PASS (`.scratch/product-restructure/scroll-world/preview-qa.mjs`:
  blob seek, scrub tracking, seam shots, overlay media, reduced-motion loads
  zero videos, 390px sanity). Lint clean, build green, tests 266/80.
- Deliberately NOT committed/deployed — the preview lives in the main
  working tree for the owner to scroll. Remaining gates: owner picks
  AI-finish vs real walkthrough footage, and whether the preview ships
  before the film is complete.
- Same-day owner review addendum: preview approved EXCEPT AI-invented
  device UIs (worst: the fake payment screen inside `leg_momo.mp4`).
  **Credit balance corrected to ~112–120** (prior 881.42 figures are stale;
  video re-renders effectively unaffordable → real-footage finish now
  favored). Owner APPROVED a zero-credit scene-3 still-crossfade swap
  (clean `still_momo` poster, drop the momo clip) to be done in the next
  session; owner tests locally before any commit/deploy. Never generate
  anything (even 7cr stills) without asking first. Details + proposed
  no-screens prompt clause: issue 03, 2026-08-09 owner-review block.

### 2026-08-09 — Cursor — durable lead capture audited, approved, deployed

- Audited `2d6e391` against main per the continuity report: single scoped
  commit (15 files); `"use server"` file exports only the async `submitLead`;
  no client Store import; both adapters implement
  `createLead`/`listLeads`/`updateLeadStatus` with in-adapter phone
  canonicalization; honeypot + best-effort IP/phone rate limits; action +
  contract test coverage. Replay was conflict-free by construction (main tip
  vs `9f0a66d` differed only by the lead files). Owner approved deploy.
- Replayed as `c79738e` on main (cherry-pick; pre-existing dirty scratch/docs
  files stashed and restored, preserved uncommitted). Fresh validation: lint
  clean, 266 passed / 80 Prisma-gated skipped, production build green. Pushed;
  auto production deployment `zantap-lxwwvr7vs` → `zantap.app`.
- Prod smoke PASS: `.scratch/product-restructure/lead-capture-prod-smoke.mjs`
  (playwright-core `--no-save`, msedge channel) submitted a labeled test lead;
  Server Action POST 200; success state; row verified in prod DB via
  `lead-capture-db-check.mjs` (canonical `2507…` phone, NEW,
  marketing-root). First attempt cold-start-timed-out without persisting
  (fail-safe confirmed). Smoke lead left in DB, clearly labeled.
- Updated issue 04 status, this file, and `.scratch/architecture-candidates.md`.
  No new ADR: ADR-0050 already records the design; this session only executed
  its deploy gate.
- Remaining gates: Android PWA install/standalone/airplane-mode human smoke
  (Issue 09a acceptance); Issue 05 Ops lead inbox now ready for an agent;
  scroll-world stays paused pending owner budget choice.

### 2026-08-10 — Codex — Issue 05 Ops Leads + WhatsApp pilot

- Owner approved the user-confirmed pilot: persist the Lead first, then offer
  `Continue on WhatsApp` to an operator-configured recipient. Automatic
  WhatsApp Business API sending remains deferred.
- Implemented `/ops/leads`, `/ops/settings`, guarded Control API routes,
  Store-backed `LeadRoutingSettings`, audited mutations, forward-only Lead
  status progression, and the public post-submit handoff. ADR-0053.
- Migration `20260810222500_lead_routing_settings` created but not applied to
  production. Nothing deployed.
- Verification: schema/TypeScript/lint/build green; 274 passed / 81 skipped;
  local browser flow passed settings → Lead submit → WhatsApp CTA → Ops inbox →
  Contacted, with no console errors or responsive overflow.

### 2026-08-09 — Codex — continuity reconciliation

- Created this shared prompt from Git history, current worktree state, issue
  trackers, ADR-0046 through ADR-0051, and the recorded deployment smoke.
- Made no application, database, environment, or deployment changes.
- Live verification note: the local PowerShell response-metadata probe failed
  and `vercel inspect` returned no custom-domain record; the production facts
  above therefore use the latest successful smoke recorded on disk
  (2026-08-08), with that limitation stated explicitly.
- Next gate: owner direction on durable lead capture, or the pending Android
  PWA acceptance smoke.
