# Codex ↔ Cursor shared continuity prompt

Last reconciled: **2026-08-15 (Africa/Kigali)**
Scope: the product-restructure, marketing, lead-capture, PWA/KDS-polish,
Paypack-preparation work, plus the new **Ops outreach + KDS + marketing batch**
on branch `feat/ops-kds-marketing-batch` (shared Cursor ↔ Codex).

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
5. The relevant issue under `.scratch/ops-kds-marketing-batch/` (candidate #23),
   `.scratch/product-restructure/`, or `.scratch/pwa-kds-paypack-polish/issue-01.md`.
6. The relevant ADR(s), especially `docs/adr/0046-*.md` through
   `docs/adr/0056-*.md`.

Then run `git status --short --branch` and inspect the relevant commit/diff.
Preserve every pre-existing dirty or untracked path unless the current task
explicitly owns it.

### Reconciled repository and production state

- **Current checkpoint (2026-08-15):** branch
  `feat/ops-kds-marketing-batch` is at PWA release candidate `61c4687`. The
  owner approved only the 10-file PWA/install-hint/scope slice; it was isolated
  from the shared `KdsDashboard.tsx` Setup hunk and committed. Focused PWA
  16/16, TypeScript, lint, and a clean production build are green. Commits
  `61c4687` + docs `aafdd47` were pushed to main and deployed as Production
  `dpl_ETqURpRh9qFyGPZyJBxXtNY5yg1y` on `zantap.app`. Core routes, narrowed
  live manifest scopes, install-hint bundle presence, and error/5xx log scans
  pass. The owner confirmed Android storefront + KDS
  install/coexistence/standalone/airplane-mode and iOS Add-to-Home-Screen
  acceptance PASS on 2026-08-15, closing PWA Issue 09a. Closeout docs commit
  `06ac77a` shipped to `main` and deployed on 2026-08-16 as
  `dpl_4PxCbQZ8E2HCcvDDFBTs75jMUWea`; route, manifest-scope, and release-log
  smoke passed. The preserved uncommitted
  implementation now comprises 2 Setup-guide paths and 29 marketing-only
  i18n/Ops CRUD/Store persistence paths (31 unique files). No code was discarded
  or regenerated; no migration, Web Push, performance pass, footer/social fix,
  or production "Inka Steakhouse Smoke" cleanup occurred.
- Audit findings: feature flags are present in full KDS snapshots but absent
  from the lightweight revision, so Ops toggles do not push over SSE; Marketing
  Site Settings saves revalidate `/ops/settings` but not `/`, matching the stale
  social-link symptom; all 30 Lead Form strings are in the Ops-editable key set,
  but end-to-end CRUD/render tests are missing and translated business-type
  labels currently double as submitted values. ADR-0059 is now reconciled with
  the local narrowed scopes; the i18n implementation still has no approved ADR
  despite the existing deferred-CMS grill requirement. The PWA slice is
  complete locally; marketing i18n and Setup-guide follow-ups remain owner-gated.

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
- Production tip remains `main` at `3a80e3e` (scroll-world) →
  `dpl_6iMs3LEJw3Y8VPgfdc56SHiynCLn` on `zantap.app`.
- **Active shared feature branch:** `feat/ops-kds-marketing-batch` (Cursor
  implemented 2026-08-13). Issues A–E coded (Prospects, flags, Stock, Profit,
  marketing polish, scroll-world code + shot list). ADRs 0054–0056. Migration
  `20260813120000_ops_kds_marketing_batch` is in-repo but **not applied to
  production**.   Fee machinery deferred. Journey 02 and Journey 03 attempt 1 are
  owner-accepted. Journey 03 was **integrated by Cursor on 2026-08-14** on
  `feat/ops-kds-marketing-batch`: the Scene 03 poster
  `public/marketing/scroll/momo.webp` was rebuilt from
  `.scratch/ops-kds-marketing-batch/journey-03-payment-success-attempt-1.png`
  (source PNG preserved); no retry was submitted and the Codex branch carries
  no integration. Branch is **not committed/pushed/deployed** — owner review
  next.
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

### 2026-08-15 — Codex — PWA physical-device acceptance passed

- Owner confirmed the complete production device matrix PASS: Android Chrome
  storefront + KDS install/coexistence, correct standalone launches, install-
  hint suppression, and airplane-mode offline fallback; iOS Safari Add to Home
  Screen also passed.
- Closed the remaining acceptance checkbox in the PWA release issue and marked
  Issue 09a complete in the product issue and architecture tracker. ADR-0059 now
  carries the final physical evidence. Issue 09b (offline kitchen-stage writes
  and in-app order chime) remains separate and ready for an approved session.
- Acceptance recording was documentation-only. No application code, migration,
  production data, footer social links, marketing i18n/Ops CMS implementation,
  partial Setup Guide wiring, or retained artifact changed.
- Published the five-file acceptance closeout as `06ac77a` to `origin/main`.
  Automatic Production deployment `dpl_4PxCbQZ8E2HCcvDDFBTs75jMUWea` reached
  Ready on `zantap.app`; root/storefront/KDS/onboard returned 200, Ops retained
  its expected 307 auth redirect, both manifest scopes remained correct, and
  the observed release-window logs contained only successful/info requests.

### 2026-08-15 — Codex — PWA install-hint/scope shipped to production

- Owner explicitly authorized commit, push, and production deployment of the
  approved PWA slice only. Localization, Setup-guide, footer/social, migration,
  Web Push, offline queue, and retained artifacts remain excluded.
- Selectively staged the two PWA hunks in `KdsDashboard.tsx`; its Setup-guide
  callback remains unstaged. Commit `61c4687` contains exactly 10 PWA paths.
- Clean-commit verification: focused PWA 16/16, TypeScript, lint, and production
  build pass. Pushed `bbf1cdb..aafdd47` to main; Vercel Production
  `dpl_ETqURpRh9qFyGPZyJBxXtNY5yg1y` is Ready on `zantap.app`.
- Production smoke: root/storefront/KDS/onboard 200, Ops 307 auth; storefront
  scope `/inka-steakhouse`, KDS scope `/vendor/inka-steakhouse`; both client
  bundles carry the hint; error and 5xx scans empty. Remaining gate: physical
  Android storefront+KDS coexistence/standalone/airplane-mode and iOS A2HS.

### 2026-08-15 — Codex — approved PWA install-hint/scope slice completed locally

- Owner explicitly approved only the existing PWA slice. No Web Push,
  marketing i18n, Setup-guide follow-up, performance work, production cleanup,
  migration, commit, deployment, or production-data work was started.
- Extracted the install-hint browser lifecycle behind `lib/pwa/install-hint.ts`
  and kept `InstallHintBanner` as its React view. Eight behavior tests cover
  prompt capture/install, five-second auto-hide, delayed iOS instructions,
  `appinstalled` and manual dismissal, standalone suppression, and independent
  storefront/KDS seen buckets. Restricted storage now shows once per pageview.
- Added direct KDS manifest route coverage for encoded `id`, `start_url`, and
  narrowed scope. ADR-0059 and the PWA issue now record root `/`, storefront
  `/{slug}`, and KDS `/vendor/{slug}` scope ownership.
- Verification: focused PWA 16/16, `npx tsc --noEmit`, lint, and production
  build clean. The preserved tree remains unstaged and uncommitted. Remaining
  PWA gate: Android Chrome + iOS physical-device acceptance.

### 2026-08-15 — Codex — interrupted 37-file follow-up audited; approval gate retained

- Read the required repo rules, continuity file, CONTEXT, ADR-0059, PWA issue,
  reference image, branch status, all 22 tracked diffs, and all 15 untracked
  implementation files. Preserved every pre-existing dirty/untracked path.
- Exact ownership: PWA = 7 files; Setup-guide wiring = 2 files; marketing-only
  i18n = 29 files; `components/vendor/KdsDashboard.tsx` is shared by PWA and
  Setup, yielding 37 unique implementation files.
- Confirmed gaps without changing product code: KDS SSE revision omits feature
  flags; marketing settings do not revalidate `/`; Ops exposes all 30 Lead Form
  copy keys but lacks end-to-end CRUD/render coverage; rw/fr/sw each cover 131
  of 137 marketing keys (six intentionally fall back to English); Web Push,
  performance work, and production-name cleanup are absent.
- Only continuity/issue-tracker documentation was updated. No new design
  decision was accepted, so no ADR was created or amended. No test was rerun,
  commit created, migration applied, deployment started, or production data
  changed. Next gate: owner approves the isolated slice order.

### 2026-08-14 — Cursor — candidate #23 batch SHIPPED to production (`7d87984` → `zantap.app`)

- Owner confirmed the batch was reviewed and asked to ship. Committed the full
  working tree as `7d87984` (238 files: issues A–E code, Journey 02 clip +
  Journey 03 still, ADRs 0054–0059, per-storefront PWA manifest, batch
  `.scratch` artifacts per precedent). Excluded: other `.scratch` streams,
  `__pycache__`, third-party generation `.json`/`.err`, stray root screenshot.
- Ship order: `npm run db:deploy` applied migration
  `20260813120000_ops_kds_marketing_batch` to prod FIRST, then pushed
  fast-forward to `main` (`f57ccbb..7d87984`) → auto Vercel Production
  `zantap-ozp9b64ja` → `zantap.app` (Ready, 1m build).
- Prod smoke PASS: core routes 200 (`/`, privacy, terms, storefront, KDS,
  onboard), `/ops` 307 auth; per-slug PWA manifest 200 with prod vendor name +
  `start_url`, unknown slug 404, storefront HTML links it; `momo.webp` 200 and
  `order.mp4` range 206; comparison + footer copy in served HTML; runtime log
  scan info-only. Data note: prod vendor is named "Inka Steakhouse Smoke"
  (stale smoke rename; consider restoring via Ops).
- Gotcha: PowerShell `Set-Content` mangled UTF-8 in `.scratch` issue files
  during status flips — restored from the commit and redone with the editor
  tool. Never bulk-edit UTF-8 markdown with `Set-Content` default encoding.
- Next queued (owner 2026-08-14): install-hint banner (top notice, ~5s
  auto-hide, storefront + KDS) as the next slice; Web Push now WANTED
  (supersedes the earlier "not wanted") — needs grill/PRD (SW push handler,
  permission UX, VAPID, subscriptions through the Store seam, order-paid
  trigger; iOS 16.4+ installed-only). Owner still owes the Android install
  smoke, now covering both KDS and storefront installs.

### 2026-08-14 — Cursor — per-storefront PWA install manifest (branch `feat/ops-kds-marketing-batch`)

- Owner asked whether the PWA covers both storefront and KDS installs. Audit:
  KDS installs per-vendor (own manifest, starts at `/vendor/{slug}`); storefront
  pages inherited the root manifest, so customers installed generic "ZanTap"
  launching into the marketing root. Closed the gap per ADR-0059: pure builder
  `lib/pwa/storefront-manifest.ts` (+7 unit tests), thin route
  `app/[slug]/manifest.webmanifest/route.ts` (Store read; 404 for
  missing/suspended vendors; 1h cache), `app/[slug]/layout.tsx` metadata
  (manifest link + vendor-name apple title). Icons stay approved-Z.
- Owner clarified notifications: the Issue 09b in-app KDS chime is sufficient;
  Web Push is NOT wanted — do not scope it.
- Verification: full suite 314/102, lint + `next build` clean; local smoke via
  the running dev server — vendor manifest JSON 200 (`start_url`
  `/inka-steakhouse`, name "Inka Steakhouse"), unknown slug 404, storefront
  HTML links the per-slug manifest. UNCOMMITTED, rides with the candidate #23
  batch; no migration.
- Remaining gates: owner's physical-device Android install smoke (Issue 09a,
  now covering both KDS and storefront installs after the batch deploys).

### 2026-08-14 — Cursor — Journey 03/06 payment-success still integrated (branch `feat/ops-kds-marketing-batch`)

- Switched HEAD from `codex/journey-02-walkthrough` to
  `feat/ops-kds-marketing-batch` — both pointed at `f57ccbb`, so the move was
  pointer-only and every pre-existing dirty/untracked path was preserved.
- Integrated the owner-accepted Journey 03 still: Scene 03 poster
  `public/marketing/scroll/momo.webp` rebuilt from
  `.scratch/ops-kds-marketing-batch/journey-03-payment-success-attempt-1.png`
  via the batch's poster pipeline (ffmpeg `scale=1600:-2`, libwebp q82 →
  1600×1062, 143 KB). Source PNG untouched under `.scratch`. Scene 03 remains
  deliberately clip-less (still-crossfade); the rejected `leg_momo` encode is
  still unused. `ScrollWorldSection.tsx` doc comments updated to record the
  accepted-still state (ADR-0058 reference).
- Validation: new scene-3 harness
  `.scratch/ops-kds-marketing-batch/journey-03-scene-check.mjs` **10/10**
  (desktop 1440×900 + mobile 390×844: fresh 1600×1062 poster served,
  payment-success hierarchy recognizable, crossfade seams to scenes 2/4
  healthy, zero overflow/console errors; shots in `journey-03-shots/`);
  scroll-world `preview-qa.mjs` 16/19 (only the three pre-documented stale
  assertions: footer wordmark filename, removed MoMo-logo overlay, new
  sticky-CTA wording); lint clean; production build green.
- Zero generations, uploads, retries, or credit spend (balance stays 86.72).
  Journey 02 untouched. Scene 04/06 remains separately gated. Nothing
  committed or deployed; migration `20260813120000_ops_kds_marketing_batch`
  still not applied to production. Remaining gate: owner review of the full
  batch → commit → `db:deploy` → deploy → smoke.

### 2026-08-14 — Cursor — batch re-validated; owner review gate open (branch `feat/ops-kds-marketing-batch`)

- No code changes. Re-verified the full uncommitted batch after rounds 2–6:
  `tsc --noEmit` clean, `npm run lint` clean, `npm test` **307 passed /
  102 skipped** (suite grew from 284/89 with the batch's new tests). Dev
  server confirmed serving `http://localhost:3000` (HTTP 200) for the owner's
  local walkthrough.
- Remaining gate (owner-owned): review the marketing page, KDS Stock/Profit,
  and Ops Prospects/settings locally; on approval → commit the branch, apply
  migration `20260813120000_ops_kds_marketing_batch` via `npm run db:deploy`,
  deploy, prod-smoke. Scroll-world scene generation stays gated on the
  Higgsfield budget (Codex ledger 2026-08-14).

### 2026-08-14 — Cursor — marketing feedback round 2 (branch `feat/ops-kds-marketing-batch`)

- Owner feedback applied on the shared branch (still not committed/deployed):
  sticky "Get setup" pill now also hides while the hero `#top` is on screen
  (masthead already carries the CTA); footer renders all 7 social icons with
  unconfigured ones as dimmed non-clickable placeholders until URLs are set in
  Ops → Marketing site settings; "Your own mobile menu" storefront DeviceFrame
  replaced with `components/marketing/ScreenCardDeck.tsx` — GSAP auto-cycling
  3-card deck (per owner's two reference videos; caption pill + dots; pause on
  hover/press; reduced-motion static) using `public/marketing/card-*.png`
  copies of `kds-store-live`/`momo-pay-step`/`kds-dashboard`. Deliberately
  supersedes ADR-0046 §5 device-hardware-only rule for that one section at
  explicit owner request (noted in issue D).
- Languages CRUD in Ops (rw/fr/sw word-for-word editor → future full CMS)
  recorded as DEFERRED: `.scratch/ops-kds-marketing-batch/deferred-language-cms.md`.
- Validation: tsc, lint, `npm run build` all clean; dev visual check
  (`.scratch/ops-kds-marketing-batch/deck-visual-check.mjs`) — sticky absent on
  hero, 7 footer icons, deck cycles (shots in `deck-shots/`).
- Round 3 (same day): deck placement corrected per owner — original storefront
  `DeviceFrame` restored in "Your own mobile menu", `ScreenCardDeck` replaces
  the kitchen terminal frame in "A clearer kitchen" (`PRODUCT.kitchen.cards`);
  footer LinkedIn + YouTube fully hidden until Ops URLs are set (other 5 keep
  dimmed placeholders). tsc + lint clean; visual check re-run — 5 icons, deck
  in kitchen block (`deck-shots/kitchen-deck.png`).
- Rounds 7–8 (same day): torn-paint treatment. Round-7 halo blob behind the
  form (`PaintSplash.tsx`) was rejected by the owner and deleted. Round 8:
  `TornPaint.tsx` — `TornPanelBackdrop` makes the LeadForm card itself
  torn-edged (straight edges replaced by an feTurbulence-displaced cream
  sheet). Round 9: the cream walkthrough seams were rejected (wrong color);
  `TornEdge` now overlays the page's own near-black tearing into the footage
  at the scroll-world track's top/bottom seams instead. Pending owner taste
  check.
- Rounds 5–6 (same day): deck swap smoothed (1.5s `power2.inOut`, z-index
  interpolated in-tween, caption swaps mid-transition; right → left travel);
  masthead `LanguageSwitcher` added (globe pill, en/rw/fr/sw dropdown, en-only
  enabled with "Soon" badges, localStorage `zantap.lang` + `<html lang>` via
  `useSyncExternalStore`) — the deferred language-CMS session plugs into it.
- Round 4 (same day): deck cards restyled as phone hardware — DeviceFrame-style
  chassis (no notch, so no UI covered), one uniform elongated `aspect-[10/19]`
  screen height for all three cards, screenshots fill the width top-down
  uncropped (dark screen below), and back-card transparency replaced with a
  solid GSAP-animated dark scrim. tsc + lint clean; shot
  `deck-shots/kitchen-deck-framed.png`.

### 2026-08-14 — Codex — journey 02/06 final prompt gate

- Inspected the owner’s open Higgsfield draft without uploading or generating: Seedance 2.5, References mode, 5s, 16:9, 720p, high bitrate, 38.33 credits per attempt; no references attached and the older generic prompt remains.
- Owner-approved direction is grounded photoreal Repub Lounge + the real local `storefront.png`, superseding the stylized/Pixar-like option for journey 02/06 only.
- Exact attempt-1 prompt and two-reference/one-generate action are recorded in `.scratch/ops-kds-marketing-batch/shot-list-scenes-2-4.md` and ADR-0057. No prompt was entered into Higgsfield and zero credits were spent.
- Budget gate: owner-reported 126 credits; attempt 1 costs 38.33, attempt 2 is considered only after attempt-1 owner review, and attempt 3 is a hard reserve requiring fresh explicit approval.
- The owner then approved attempt 1. The Higgsfield two-file chooser opened, but Chrome denied file attachment because the ChatGPT browser extension lacks file-URL access. No reference attached, Generate was not clicked, and zero credits were spent. Resume the still-valid approval after the owner enables that permission.
- The owner subsequently enabled file-URL access and refreshed Higgsfield. Extension/native-host diagnostics passed, but Chrome control timed out claiming the refreshed tab and a fresh same-profile tab/window. No reference attached, the prompt was not transmitted, Generate was not clicked, and all 126 credits remain. Reinstall the Browser plugin from the ChatGPT plugin UI, then resume the still-valid one-attempt approval.
- The owner exposed the Higgsfield connector, which supported the exact approved Seedance 2.5 omni-reference controls and both local images. Exactly one 32.5-credit job was submitted (`0a409cd1-425b-4ffd-a5c1-22bb104601a4`) and saved locally as `.scratch/ops-kds-marketing-batch/journey-02-attempt-1.mp4` with review frames/contact sheet. The owner accepted the shot (“This shot is fine. Truly!”), so attempt 2 is skipped. Attempt 3 remains reserved and untouched; confirmed balance is 93.72 credits.
- The owner confirmed Cursor's lead-form and marketing batch work is on point and asked Codex to isolate the accepted video integration. On `codex/journey-02-walkthrough`, Journey 02 now replaces `public/marketing/vid/order.mp4` as a native 1280×720/24fps, audio-free, dense-keyframe H.264 web encode; `public/marketing/scroll/order.webp` is its true first frame. The existing overlay and scroll engine are unchanged. Visual seam/reduced-motion/mobile checks passed for the integration; the legacy preview harness reports 16/19 because three assertions still expect pre-Cursor branding/copy. ESLint is clean. Nothing was committed or deployed.

### 2026-08-14 — Codex — journey 03/06 payment-success still accepted

- Owner requested one corrected Scene 03 image only; Cursor will integrate it with the other marketing corrections.
- Composition reference: `public/marketing/scroll/momo.webp`. UI reference: `public/brand/UI-screens/new-UI-screens & video walkthrough/successful-payment.png`. The edit changes only the blank amber phone display and makes the existing thumb read as tapping the real successful-payment UI.
- Historical `still_momo.json` confirms the original settings: GPT Image 2, 3:2, 2K, High. The exact edit prompt and action are recorded in the shot list and ADR-0058.
- Higgsfield read-only preflight: 7 credits. Current balance 93.72; projected balance 86.72. No reference uploaded and no generation submitted. Wait for exact owner approval, then submit once and review before any retry.
- The owner approved exactly. Both references were uploaded in order and one job was submitted: `3f09077f-13e7-45fd-9d29-31b0b1dd4713`. Result: `.scratch/ops-kds-marketing-batch/journey-03-payment-success-attempt-1.png` (2048×1360). The payment-success UI is integrated into the phone and the lower thumb contacts the screen; core UI reads correctly, with some tiny generated body-copy softness. Confirmed balance: 86.72 after the 7-credit charge. No retry. The owner accepted attempt 1 on 2026-08-14. Cursor must integrate from that exact path; Codex made no page or public-asset integration change.

### 2026-08-13 — Cursor — Ops outreach + KDS + marketing batch implemented

- Grilled decisions locked (Prospect vs Lead, dish-level stock, per-vendor
  flags, gated assets, fee machinery deferred).
- Branch `feat/ops-kds-marketing-batch` created; issues A–E + ADRs 0054–0056 +
  CONTEXT glossary terms written.
- Store: Prospect/Interaction, MarketingSiteSettings, VendorExpense, feature
  flags, stock/cost fields; both adapters; contract coverage.
- Ops: `/ops/prospects`, Flags tab, marketing settings on `/ops/settings`,
  vendor overview stock/profit cards when flags on.
- KDS: Stock tab, Drivers in Setup, Profit eye panel, NEW badge, item thumbs,
  WhatsApp gated, export totals, storefront Sold out.
- Marketing: footer/socials, privacy/terms, comparison section, sticky CTA,
  hero loop + Z, eased scrub + soft screenshots, shot list for scenes 2–4.
- Verification local: `tsc` clean, lint clean, store + unit tests green.
  Not deployed; migration not applied to prod.

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

### 2026-08-16 — Codex — launch vendor tools, locales, and funnel insights

- Implemented universal KDS Stock CRUD and complete Profit access, prominent
  always-visible profit eye, and actionable Setup Guide destinations. Legacy
  Stock/Profit flags no longer gate vendor functionality.
- Completed English/Kinyarwanda/French/Kiswahili marketing + Lead Form copy,
  Store-backed Ops translation CRUD, canonical submitted business-type values,
  and root invalidation. Footer social destinations and payments are unchanged.
- Added privacy-minimal first-party funnel events and authenticated Ops Insights.
  Migration `20260816150000_marketing_funnel_events` applied successfully;
  translation migration was already applied.
- Added exact-host permanent redirect from `zantap-psi.vercel.app` to
  `zantap.app`; existing old-origin installs need one uninstall/reinstall.
- Local gate: 346 passed / 104 skipped, TypeScript, lint, production build, and
  mobile browser feature smoke passed. ADR-0060.
- SHIPPED: `1027572` → `dpl_6kzBXFKEibFG29ywS6UHvofEMtQ8` → `zantap.app`.
  Production smoke passed: legacy host 308 to canonical domain; root,
  storefront and KDS 200; Ops Insights auth/API healthy; analytics 204;
  Kinyarwanda/French/Kiswahili SSR copy present; runtime scan had no errors.
