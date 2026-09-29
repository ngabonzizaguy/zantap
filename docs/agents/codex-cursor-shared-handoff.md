# Codex ↔ Cursor shared continuity prompt

### 2026-09-28 — Candidate #11 MoMo Open API gateway + Slices 1–3 on `main` (recorded by 2026-09-29 reconcile)

`9329ddf` (feat) + `2f0d673` (docs) on `main`: Open API client/webhook/collection, `VendorPayout` + Ops Payouts retry, Commission settings + per-Vendor controls, minimum order total. `2f0d673`/ADR-0097 state Slices 2–3 are deployed and migration `20260927210722_commission_settings_and_vendor_payout` is applied to Production; no `dpl_` ID or smoke is recorded, and `20260922170000_vendor_payout_transfer_refs` Production status is unrecorded. Production `MOMO_MODE` stays code-default `manual`; Test B / cutover is an owner gate. Still open on `main`: Order fee snapshot write and snapshot-based Vendor payout (currently full `payment.amount`); webhook trust model (ADR-0098 proposed). Tracking: `.scratch/architecture-candidates.md` Candidate #11; `.scratch/momo-open-api/issue-03-commission.md`.

### 2026-09-22 — Cursor — KDS rw/fr/sw baselines SHIPPED to Production

`b0289f9` on `main` → Production `dpl_Hn2FAFCjHxNLL4ky8onYp6Bsx1vn` READY, aliased `zantap.app` (+ `zantap-psi.vercel.app`). Curl: `/vendor/inka-steakhouse` 200 (`kds-dark` + language selector); `/ops/settings` 307 (auth). No migration. Owner still self-serves Kinyarwanda "Soon" in Ops → Settings → KDS languages. Preserved continuity tests stay in the vitest suite as agent documentation.

### 2026-09-22 — Cursor — KDS rw/fr/sw wording loaded into the Ops editor (local only)

Owner translated `locales/kds.en.json` into `locales/kds.{rw,fr,sw}.json` (861 keys each, order + placeholder parity) and asked for those translations to fill the **existing** Ops KDS copy editor so they can be reviewed/edited there. Generated in-repo baselines `lib/i18n/kds-translations/{rw,fr,sw}.ts` (684 registered keys each, `satisfies KdsDictionary`) aggregated by `lib/i18n/kds-baselines.ts`, and passed them as `baselines` to the `surface="kds"` editor in `app/ops/(dashboard)/settings/page.tsx` (was `{}`). Ops → Settings → Languages (KDS copy) now shows `0 overrides saved · 0 untranslated` per locale with real wording in every field; only owner edits become DB overrides. Key mapping is by **section + exact English value** (camelCase↔kebab is not reversible); regenerate via `node .scratch/kds-translation-baselines/generate-baselines.mjs`.

**Runtime fallback added the same day.** The owner reported that switching the KDS language did nothing: the selector worked (locale state, cookie, chip, `lang`) but `getKdsTranslations()` read only `SiteTranslation` rows, and with 0 overrides every dictionary was empty, so everything fell back to `KDS_COPY`. Owner approved the fallback: `getKdsTranslations()` now merges baselines under overrides (override → baseline → English) and `pickKdsLocales()` serializes only Ops-enabled locales. Keep the merge in that **server-only** module — client components import `createKdsTranslator` from `lib/i18n/kds-localize.ts`, so baselines there would land in the KDS client bundle. A store failure now keeps baselines rather than English. Also: **Kinyarwanda is flagged "Soon" in Ops**, so that option is disabled and `resolveKdsLocale` pins those devices to English (ADR-0094 gate, owner-controlled). Owner asked to **re-include** preserved `.scratch/repository-continuity/preserved-*` tests as agent documentation (synced KDS translations contract + README); `vitest.config.ts` clears leaked `VERCEL` from `.env.production.local` so menu-intake unit tests stay green.

**Deliberately not done:** no DB override seeding, no registration of the 177 `notYetRegistered` strings, no English wording change, no schema or language-flag change. Local gate: full **535 passed / 117 skipped**, `tsc` clean, scoped ESLint clean, `next build` clean, Ops harness 8/8, KDS switch harness 9/9. ADR-0095; `.scratch/kds-translation-baselines/issue-01.md`.

### 2026-09-18 — Cursor — KDS English catalog extracted (no wiring)

Owner asked for an English-only KDS string catalog before any further translation/integration. Wrote `locales/kds.en.json` (861 leaf keys: 684 from live `KDS_COPY` + 177 hardcoded leftovers) and `locales/KDS_LANGUAGE_EXTRACTION.md`. No i18n integration, no translations, no application behavior change. Owner must approve the English JSON before rw/fr/sw or wiring. Tracking: `.scratch/kds-english-catalog/issue-01.md`.

### 2026-09-18 — Cursor — owner self-serves KDS Soon flags in Ops

KDS translation is already live. Owner will mark languages Soon / hide the selector from Ops → Settings → **KDS languages** (authenticated `patchMarketingSiteSettingsAction`). Agent will not toggle Production flags. Next session waits for a new scoped card. ADR-0094.

### 2026-09-18 — Cursor — KDS translation shipped on `main` / Production

Owner liked the c29 local KDS translation. Ported onto `feat/kds-translation-on-main`, fast-forwarded `origin/main` to `f6c3932`. Production `dpl_SPtBgijdcTpfb63jGKZ3L1ePT1Nd` (`zantap-gjreeypto`) READY, aliased `zantap.app`. Migration `20260916120000_kds_language_availability` applied first (defaults true). Curl: `/` 200 with phone picker; `/vendor/inka-steakhouse` 200 `kds-dark` + KDS language bundle; storefront has no `kds-dark`. Stash `2026-09-18 tracked dirty on 6510df6 before canonical main` kept and not mixed. Do not toggle live language flags unless the owner asks. ADR-0094.

### 2026-09-18 — Cursor — KDS translation ported onto `feat/kds-translation-on-main`

Owner liked the c29 local KDS translation. Ported onto this folder from `zantap-kds-translation-c29` (`be28a09` + language-availability working tree) onto GitHub `main` `5db897c` (Q11 phones kept). Branch `feat/kds-translation-on-main`. Cherry-picks: `5edc595` / `52cd57e` / `1167a24`. Language-availability overlay uses ADR-0094 (ADR-0093 stays the Q11 isolate). Stash `2026-09-18 tracked dirty on 6510df6 before canonical main` was not dropped and leftover KDS from this folder was not mixed. **Not pushed. Not deployed. Migration `20260916120000_kds_language_availability` not applied.** Store seam: flags on `MarketingSiteSettings` in both adapters.

### 2026-09-18 — Cursor — Q11 phones live on `main` / Production

Do **not** re-run the 2026-09-12 fast-forward. Owner approved push + merge + Production. GitHub `origin/main` is `5db897c` (`f32fca8` phones + docs). Live `zantap.app` is Production `dpl_AbmSN4zVWPhhi8VuhddoQPvjKErY` (`zantap-jqur1qppf`), aliased. Browser smoke: lead form defaults Rwanda `+250`, search `+44` lists United Kingdom, selecting it sets `GB +44`. Did not submit a Lead. KDS translation now lives locally on `feat/kds-translation-on-main`. ADR-0093 is the Q11 isolate ADR. Tracking: `.scratch/repository-continuity/issue-02-canonical-main-then-q11.md`.

Last reconciled: **2026-09-29** — weekly continuity reconcile against `origin/main` `2f0d673` (Candidate #11 entry above). Previous: 2026-09-18 (Africa/Kigali) — Git/Q11 isolate; Candidate #29 product truth below still starts 2026-09-08.

### 2026-09-12 — Cursor — owner-approved KDS translation coverage complete locally

Owner chose full reviewed coverage because KDS wording must be editable/replaceable in Ops. On `codex/kds-translation-control-c29`, the follow-up fixes `ProfitPanel` so translated expense labels never replace persisted English category tokens, and registers/wires `ReadinessGuideModal`, the Help readiness CTA, SetupDrawer guided/status/error copy, and VendorUpdatesPanel metrics. DPO, Terms, payment runtime, schema, database, and production remain untouched. Focused tests 8/8; full suite 488/117; TypeScript, changed-file lint, build, and diff check pass. Follow-up is local only; ask the owner before push or deploy. See ADR-0089 and `.scratch/kds-translation-control/issues/01-ops-kds-translations.md`.

### 2026-09-12 — Cursor — KDS translation review of `6079447` (no push/deploy)

Reviewed local branch `codex/kds-translation-control-c29` tip `ac93913` (feature `6079447` on repaired `main` `3037217`). Architecture matches ADR-0089. **Do not push or deploy yet.** Blocker: `ProfitPanel` expense `<option value>` uses translated text (can persist non-English categories). Coverage gaps: `ReadinessGuideModal` fully English; Help readiness CTA English; SetupDrawer guided copy partially English; VendorUpdatesPanel metric titles English. Original dirty `zantap` tree and production snapshot remain preserved. DPO/Terms/payment runtime untouched. Details: `.scratch/kds-translation-control/issues/01-ops-kds-translations.md` § Review.

### 2026-09-12 — Cursor — GitHub main repaired; KDS translation ported

GitHub `main` was fast-forwarded from `6510df6` to Candidate 29 tip `3037217`; no production history was rebased. The push-triggered Production build is a docs-only child of live product SHA `3337db5`, not an old-main deployment.

KDS translation work was copied from the preserved dirty `codex/kds-translation-control` checkout onto `codex/kds-translation-control-c29`, based directly on repaired `main`, and committed locally as `6079447`. Candidate 29 behavior won every overlap; translation hooks were then combined into `HelpModal`, `KdsDashboard`, and `SetupDrawer`. Focused tests pass 6/6; full suite 486/117; TypeScript, changed-file lint and production build pass. Repository-wide lint retains only two documented, pre-existing Briefing hook errors. The new branch was not pushed or deployed.

The damaged detached Candidate 26 temp worktree was removed. Eleven local and eleven remote branches proven merged into repaired `main` were deleted; one local branch required a forced local-only deletion after ancestry verification because its configured upstream was stale. The original dirty translation checkout, Candidate 29 evidence worktree, detached `3337db5` production snapshot, and unique branches remain. Colliding unshipped poster/glass ADRs in the dirty tree were renumbered from 0083/0084 to 0091/0092. No DPO, Terms, or payment runtime code was touched. Read `.scratch/repository-continuity/issue-01.md`, `.scratch/kds-translation-control/issues/01-ops-kds-translations.md`, ADR-0089, and ADR-0090 next.
Scope: the product-restructure, marketing, lead-capture, PWA/KDS-polish,
Paypack-preparation work, plus the new **Ops outreach + KDS + marketing batch**
on branch `feat/ops-kds-marketing-batch` (shared Cursor ↔ Codex), and candidate
#25 Inventory/pagination work and Candidate #26 customer-app work on
`codex/customer-restaurant-hub`.

This is the durable coordination entry point for both agents. It summarizes
current truth and points to the detailed artifacts; it does not replace issue
files, ADRs, commit diffs, or the production log in `AGENTS.md`.

## Prompt for the next Cursor or Codex session

### 2026-09-08 — Codex — Candidate #29 Stage 2 released and production-smoked

- Owner explicitly authorized release. Verified remote `9dc87fa` plus exactly
  `9772439` (Stage 2) and `3337db5` (docs); pushed through `3337db5` to
  `codex/candidate-29`. No main merge or unrelated product scope was included.
- Clean detached checkout `C:\Users\G\Desktop\2025\Projects\zantap-release-stage2-20260908`
  deployed full SHA `3337db5e5598ae7c2b9e53ceb36481a4b2904dde` as
  `dpl_FWg1wrFxKR5pKTRJbfoZxjRQPPTo`, READY on `https://zantap.app`.
  Immutable deployment: `https://zantap-g5ushkko8-ngabonziza-guys-projects.vercel.app`.
- Migration check: all 22 current on documented Production Supabase project
  `vzhauguzvhdlpwvqhsfo`. Vercel downloaded DB variables were empty/redacted;
  initial Prisma validation failed before connecting. Successful read-only
  check used main checkout's existing direct connection. No migration/seed or
  Production configuration change. Credentials never printed.
- Verification: focused 12/12, full 482 passed / 117 expected skips,
  TypeScript, scoped ESLint, diff hygiene and Vercel production build pass.
- Read-only production browser smoke PASS: welcome/checklist; all four
  contexts and decoded authentic images at 390×844/1440×1000; masked payout;
  all four live destinations; Done versus Return chip; checklist return;
  Help replay; no automatic reopen after reload. Routes KDS/storefront/
  restaurants/menu-intake 200 and Ops intake 307 → login. Restaurants renders.
  Zero browser errors; existing unused-font-preload warnings were observed
  before/after deployment. Runtime scan: 27 requests, zero
  error/fatal/warning/5xx entries. Mutation transitions/Kitchen warning retain
  the completed local in-memory gate; no production business data was changed.
- Pre-existing four closeout-document edits were preserved and incorporated.
  All `.playwright-cli/` and `output/` artifacts remain; new evidence lives in
  `output/playwright/kds-readiness-stage2/prod-*.png` and
  `output/stage2-*20260908.*`. Release checkout retained. Browser CLI's Node 25
  help crash was avoided with the bundled stable Node runtime; a cache scan's
  transient missing concurrency.lock did not affect any release operation.
- Next: Stage 2 is complete. Await the owner's next scoped priority; do not
  start Question 11, broader guide catalogues or Marketing Lead Form work by
  inference. Read AGENTS.md, issue 02, ADR-0083 and this handoff first.

### 2026-09-05 — Codex — Stage 2 complete locally; release held

- Owner explicitly authorized the exact `9dc87fa` release, including save-once
  Stage 1, the `/restaurants` remote-image fix and the already-tested Ops → KDS
  import workflow. `codex/candidate-29` was pushed; detached clean Vercel
  Production `dpl_CvDf7he6jAQjDQzMcSzLPkQhXc5j` is `READY` on `zantap.app`.
  No migration was needed or run.
- Production browser smoke: KDS welcome → Guide me → live `3 of 4` checklist
  with actionable missing-logo row; `/restaurants` rendered with zero console
  errors; guarded `/ops/menu-intakes` correctly redirected to operator login.
  The owner had already passed the real import flow. No production import or
  customer-update fixture was created. A Vercel log command using
  `--until now` failed because CLI 54 rejects that time format; do not cite it
  as log evidence.
- Stage 2 is complete locally after commits `9772439` and `3337db5`. Every readiness row opens
  one contextual view with live status, reason, an authentic repository
  screenshot plus live annotation, Back and Show/View action. Completed rows
  remain tappable; payout destinations are masked to type + final four;
  Kitchen warns about incomplete Menu/Payment without blocking; the existing
  live-control handoff uses `Return to guide` / `Done — continue guide`.
- Verification: focused 12/12, full 482 passed / 117 skipped, TypeScript,
  scoped ESLint, production build and diff hygiene. Headed local desktop and
  390×844 context QA passed with zero application console errors; evidence is
  under preserved `output/playwright/kds-readiness-stage2/`.
- Dedicated incomplete-state headed QA passed on 2026-09-05 with a disposable
  in-memory Vendor: all four contextual destinations, live Menu and Kitchen
  chip changes, masked payment, and the incomplete-menu Kitchen warning all
  passed. The warning did not block OPEN. At 390×844 and 1440×1000 there was no
  modal/document overflow, the chip intersected zero visible controls, and
  Playwright reported zero console errors/warnings. New evidence is preserved
  under `output/playwright/kds-readiness-stage2/`.
- No source fix was needed. The branch remains two commits ahead of origin and
  Stage 2 remains unpushed/undeployed. Next is owner review and an explicit
  release decision. Do not push or deploy without it. Do not start Question 11
  or touch the Marketing Lead Form. Preserve `.playwright-cli/` and `output/`.

### 2026-09-04 — Codex — `/restaurants` remote update images owner-tested green

- Separate scoped bug fix on `codex/candidate-29`: reproduced the exact
  `/restaurants` error boundary by saving Inka with an active update whose logo
  snapshot used an unconfigured absolute Vercel Blob hostname.
- `PublicCustomerImage` now renders root-relative and arbitrary approved,
  credential-free public HTTPS sources outside Next's optimizer. Unsupported or
  failed logos fall back to initials; failed update media keeps its aspect ratio
  and exposes an accessible `Image unavailable` fallback. The update ring,
  viewer and saved-restaurant card share this boundary. ADR-0084.
- The original headed browser fixture now renders without the Next loader
  exception. Its deliberately absent Blob object produces only expected network
  404s. Mobile 390×844 and desktop 1440×1000 pass with no horizontal overflow;
  evidence is under `output/playwright/customer-update-remote-images/`.
- Verification: focused 12/12; full 480 passed / 117 skipped; TypeScript;
  scoped ESLint; production build; diff check. The fix is local and uncommitted.
- Owner test feedback is green. This closes the local acceptance gate only;
  the fix remains unreleased.
- Preserve save-once commit `19e7bff`, existing documentation changes,
  `.playwright-cli/` and `output/`. Do not deploy, migrate, push, start Stage 2
  or Question 11, perform Ops → KDS import, or touch the Marketing Lead Form
  without explicit authorization.

### 2026-09-03 — Codex — save-once Stage 1 amendment implemented locally

- On branch `codex/candidate-29`, the owner-approved save-once Stage 1 amendment
  is implemented in the existing Setup drawer: amber current step → green
  completed state + `Next · … →` → next originally missing control → one final
  `Save profile & continue`.
- Draft text and staged branding URLs do not mutate the Vendor profile before
  the final action. The owner-authorized asset upload stores bytes and returns a
  draft URL only; normal non-guided branding behavior is preserved.
- Verification is green: focused 17/17, full 471 passed / 117 skipped,
  TypeScript, scoped ESLint, production build, and desktop plus 390×844 headed
  QA. Both browser paths proved no premature storefront publication and correct
  publication after final save. Repository-wide lint retains two unrelated,
  pre-existing briefing-file hook errors.
- Owner visual review is the next gate. Evidence is under
  `output/playwright/kds-readiness-stage1/`. Preserve `.playwright-cli/`,
  `output/`, and the existing issue-02 documentation change.
- Stage 2 and Question 11 remain unstarted. Do not deploy, migrate, push,
  perform Ops → KDS import, or touch the Marketing Lead Form without new
  authorization.

### 2026-09-03 — Codex — save-once Stage 1 amendment owner-approved

- The owner approved the save-once Stage 1 reference and interaction direction:
  amber current step → green completed state and `Next · … →` → next
  incomplete control → one final `Save profile & continue` after all missing
  details are ready.
- Reference:
  `C:\Users\G\.codex\generated_images\01a0633e-1b58-7aa1-8cf8-8a6697746584\exec-889dd54d-51c5-4939-80fa-47ed1f2f0e8c.png`.
- Implementation has not started and requires its own isolated task. Stage 2
  and Question 11 remain unstarted. Preserve `.playwright-cli/`, `output/`, and
  the existing documentation changes; do not deploy, migrate, push, perform
  Ops → KDS import, or touch the Marketing Lead Form without authorization.

### 2026-09-03 — Codex — save-once Stage 1 visual pending owner approval

- The owner reported an endless local KDS reconnect. A tight curl loop showed
  page `200` / SSE `404`; after a controlled single-server restart, the same
  endpoint returned `200` twice. This matches stale Next dev/HMR state after a
  server/branch restart. No SSE code changed; hard-refresh or reopen the old
  KDS tab against the now-healthy server.
- A new approval-only Stage 1 reference replaces `Start here` with: amber
  current step → green completed state and `Next · … →` → next incomplete
  control → one final `Save profile & continue` after all missing details are
  ready. Reference:
  `C:\Users\G\.codex\generated_images\01a0633e-1b58-7aa1-8cf8-8a6697746584\exec-889dd54d-51c5-4939-80fa-47ed1f2f0e8c.png`.
- Await owner approval. Do not implement this amendment, begin Stage 2 or
  Question 11, deploy, migrate, push, perform Ops → KDS import, or touch the
  Marketing Lead Form before explicit authorization. Preserve
  `.playwright-cli/` and `output/`.

### 2026-09-02 — Codex — actionable readiness Stage 1 owner-approved locally

- Corrected Candidate #29 Stage 1 passed owner review on
  `codex/candidate-29` at implementation commit `d09d039`.
- Fresh headed desktop and 390×844 inspection confirmed that the recommended
  incomplete row is a clear button with plain missing-state copy,
  `Show me where`, and a chevron; it opens/highlights the exact live KDS
  control. The return chip remains visible, saved state advances the target,
  and completion changes it to `Done — continue guide` before the ready screen.
- Stage 1 is approved locally. Stage 2 and Question 11 remain unstarted and
  require a separate authorized session. Do not deploy, migrate, push, perform
  Ops → KDS import, or touch the Marketing Lead Form without new authorization.
- Preserve `.playwright-cli/` and `output/`. Review evidence remains under
  `output/playwright/kds-readiness-stage1/`; this review added only normal
  Playwright CLI artifacts under the already-preserved `.playwright-cli/` path.

### 2026-09-02 — Codex — actionable readiness Stage 1 implemented; owner review next

- The owner explicitly authorized the accepted actionability preview. Corrected
  Stage 1 is implemented locally on `codex/candidate-29`: the recommended row is
  a keyboard-accessible direct action with plain missing-state copy,
  `Show me where`, and a directional affordance.
- The existing Setup drawer is reused exactly: guided mode shows `Setup` plus a
  live return chip, scrolls/highlights the exact missing control, and exposes a
  tappable/keyboard `Start here`. Branding uploads persist through the existing
  action; text stays save-gated. Saved live state advances the target/count and
  ends at `Done — continue guide`; returning opens the refreshed checklist.
- Menu, Payment, and Kitchen use their existing live destinations and the same
  minimum return loop. Stage 2 contextual screenshot views were not started.
- Verification passes: focused 9/9; full 469/117; TypeScript; scoped ESLint;
  production build; headed desktop and 390×844 QA; zero application console
  errors and no horizontal overflow. Evidence remains in
  `output/playwright/kds-readiness-stage1/`.
- Next gate is owner review of corrected Stage 1. Do not start Stage 2 or
  Question 11; do not deploy, migrate, push, perform Ops → KDS import, or touch
  the Marketing Lead Form. Preserve `.playwright-cli/` and `output/`.

### 2026-09-02 — Codex — actionable readiness visual accepted; implementation deferred

- The owner asked to see what follows the tappable `Start here` affordance
  before any implementation. Preview:
  `C:\Users\G\.codex\generated_images\01a060b7-f1d7-7fd2-a867-e3b9d6a768f1\exec-8c9b9a80-cb04-40e5-bec0-65362f3ceaff.png`.
- Proposed minimum flow: `Show me where` opens/scrolls the existing Setup
  drawer; `Start here` and the highlighted group invoke the same real control;
  branding uploads use the existing immediate persistence action; text uses the
  existing Save action; successfully saved live data re-derives readiness and
  advances the recommendation. No nested setup form or new editor modal.
- The owner likes and accepts this exact visual/logic direction. Formal
  implementation authorization is explicitly deferred to another session.
  Until then, do not implement, deploy, migrate, push, import Ops data, touch
  the Marketing Lead Form, start Stage 2, or begin Question 11. Preserve
  `.playwright-cli/` and `output/`.

### 2026-09-02 — Codex — Stage 1 owner review rejected static checklist

- The owner did not approve revised Candidate #29 Stage 1. The yellow
  incomplete row is a passive status display and gives a low-English,
  low-technical-knowledge Vendor no clear indication that it can be tapped,
  what is missing, or where to fix it.
- Correct Stage 1 before another review: make the recommended row an obvious
  accessible action, use short action-led copy and direction, explain the
  missing requirement, navigate directly to the exact live KDS destination,
  and retain a visible return path to readiness.
- Keep this correction narrow. Stage 2 is still unstarted and blocked until the
  owner explicitly approves the corrected Stage 1. Do not deploy, migrate,
  push, perform Ops → KDS import, touch the Marketing Lead Form, or begin
  Question 11. Preserve `.playwright-cli/` and `output/`.

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

### 2026-09-02 — Codex — revised readiness Stage 1 implemented; owner review next

- Revised Candidate #29 Stage 1 is complete locally on `codex/candidate-29`.
  The superseded `85e3091` order-progression viewer and three guide bitmaps are
  removed. Do not restore or deploy that tracer.
- The real accessible dark modal preserves the approved welcome → live
  Storefront/Menu/Payment/Kitchen checklist → ready hierarchy, primary wording
  and actions, Close icon, `OPEN · LIVE`, and permanent Kitchen-help replay.
- Live readiness and a versioned local per-Vendor/device preference implement
  already-ready suppression, both initial choices, and first-Close/second-Close
  semantics. The previous first-load Setup drawer is retired; readiness, Help,
  Setup, recovery, and coachmarks never stack.
- Verification passes: focused 6/6; full 466/117; TypeScript; scoped ESLint;
  production build; headed 390×844 and 1440×1000 QA with zero application
  console errors or horizontal overflow. QA evidence is preserved under
  `output/playwright/kds-readiness-stage1/` alongside the pre-existing
  `.playwright-cli/` and `output/` trees.
- Stage 2 is unstarted and must remain held until the owner reviews Stage 1.
  No deploy, migration, push, Ops → KDS import, Marketing Lead Form, or Question
  11 work occurred. Read the Stage 1 issue, Stage 2 issue, ADR-0083, and this
  entry before continuing.

### 2026-09-02 — Codex — readiness-guide interview closed; implementation deferred

- Owner review superseded the local `Move an order through the kitchen` tracer
  as the new-Vendor first-run subject. Commit `85e3091` remains local and must
  not deploy unchanged.
- The exact approved UI is welcome → four-row `Get ready to receive orders`
  checklist → ready state, using the generated reference at
  `C:\Users\G\.codex\generated_images\01a05eed-040b-77c3-96d8-7ca58625e0df\exec-eaf121ea-6bcb-4dea-b661-fea903b914a3.png`.
  Preserve its hierarchy, copy, dark styling, checklist order and actions.
- Stage 1 owns the first-run choice and live readiness overview. Stage 2 owns
  each row's short contextual view, `Show me` route/highlight, and compact
  `Return to guide` / `Done — continue guide` chip.
- The modal explains that Kitchen help can replay it at any time. `Guide me`
  and `I'll do it myself` stop future automatic openings; first Close is
  `not now`, second Close stops them; already-ready Vendors never see it.
- ADR-0083 and the two revised issue files are the implementation authority.
  The broader order/Stock/customer-update catalogue is deferred. No product
  code, deploy, migration, production write, Ops → KDS import, Marketing Lead
  Form or Question 11 work occurred. Preserve `.playwright-cli/` and `output/`.

### 2026-09-02 — Codex — superseded order-progression tracer (historical)

- This historical implementation was rejected as the first-run subject and was
  replaced by the revised readiness Stage 1 above. It must not be restored or
  deployed. At the time, Kitchen help launched the four-frame accessible `Move
  an order through the kitchen` Visual guide using authentic KDS
  screenshots, one warm-orange callout and short instruction per frame.
- Close/completion status is versioned per Vendor/device. Final `Show me Orders`
  closes the guide and returns focus to the live Orders surface without changing
  any order. The viewer is dynamically loaded only when opened.
- Verification passes: focused 3/3; full 463/117; scoped ESLint; TypeScript;
  production build; headed desktop and 390×844 Help → four frames → Orders.
  There were no application console errors or warnings.
- Stage 2 remains `ready-for-agent` but must wait for owner review of Stage 1.
  Question 11 remains unstarted. No deployment, production write, Ops → KDS
  import or Marketing Lead Form change occurred. Preserve `.playwright-cli/`
  and `output/`.

### 2026-09-02 — Codex — KDS visual education prepared as two stages

- The owner selected Candidate #29 Questions 9 and 10 and approved phased
  preparation. Two `ready-for-agent` local issues now define the work.
- Stage 1 proves the reusable accessible Visual guides viewer with the complete
  four-frame `Move an order through the kitchen` tracer, using the already
  approved reference composition and authentic KDS screenshots.
- Stage 2 depends on Stage 1 and adds the other four approved guides, Setup
  launchers, replay from Kitchen help, and deterministic state-driven prompts
  capped at one visible prompt. No full guide auto-opens.
- This is planning only. No product implementation, new screenshot asset,
  production mutation, Ops → KDS import, Marketing Lead Form change or Question
  11 work occurred. Preserve `.playwright-cli/` and `output/`.

### 2026-09-01 — Codex — Production private attachments visible; attribution pending

- Authenticated Production Ops now shows previously undocumented intake
  `MI-260830-A50450` with `3 private files`. All three listed JPEG attachment
  routes load successfully through the authenticated Ops boundary:
  `1001245003.jpg`, `1001245006.jpg`, and `1001245009.jpg` (0.1 MB each,
  589×1280).
- This proves the production private attachment storage/read seam. Do not yet
  close the owner-labelled release gate: the visible business label is only
  `Test`, so the owner must confirm that this intake is their newly labelled
  submission.
- No Ops state changed, no file was downloaded, no WhatsApp action or KDS import
  occurred, and no product code changed. Ops → KDS import remains separately
  action-gated. Preserve `.playwright-cli/` and `output/`; do not touch the
  Marketing Lead Form or Questions 1–14.

### 2026-09-01 — Codex — Menu Intake trash/options + Briefing PIN deployed

- On `codex/candidate-29`, Ops Menu Intake now renders submitted sizes/extras
  and supports delete → 30-day restore window → permanent purge of the database
  graph/private sources. Imported intakes are deliberately audit-protected.
- Briefing new/reset credentials are collision-checked four-digit PINs. The PIN
  field remains visible on expired/unavailable preview states, active PINs are
  no longer capped at two sessions, unlock attempts are rate-limited, and legacy
  secrets keep working until reset.
- Focused tests pass 10/10; full tests pass 460/117; scoped ESLint, TypeScript,
  Prisma validation and production build pass. Headed browser QA passed
  separate-browser PIN unlock and an authenticated size/extras submission → Ops
  delete → restore cycle with zero application console errors. No Ops → KDS
  import occurred.
- Owner approved release. Migration `20260901190000_menu_intake_ops_trash` is
  applied, all 22 migrations are current, and the `deletedAt` column is verified.
  Exact HEAD `5bd7d87` is pushed and READY as Vercel Production
  `dpl_5kvk1NEtjwtgK66oMBKmn3n5TFbv` on `zantap.app`.
- Briefing, Menu Intake, storefront and KDS return 200; Ops intake returns the
  expected 307 to login; live Briefing HTML contains “four-digit PIN” and
  “Private viewing”. Exact-deployment error/fatal/warning/HTTP-500 scans are
  empty. Preserve `.playwright-cli/` and `output/`; do not touch Marketing Lead
  Form or Questions 1–14.
- Owner-approved copy refinement: the Briefing access-gate footer now reads
  `Private viewing`; no other viewer copy or behavior changed.
- Local port 3000 now has the two required Operator variables in gitignored
  `.env.local`. Fresh-browser sign-in and `/ops` load pass with zero console
  errors; no production environment changed.

### 2026-08-30 — Codex — Candidate #29 retry recovery deployed and read-only smoked

- Connectivity returned and `codex/candidate-29` was pushed through exact HEAD
  `d63edf5` (product repair `9c4365a`). `.playwright-cli/` and `output/` remain
  preserved and untracked.
- Exact HEAD `d63edf5` deployed READY as Vercel Production
  `dpl_DTJE7Qjzr2ekxtqEc1rWTQZTP6gX`, aliased to `zantap.app`,
  `www.zantap.app` and `zantap-psi.vercel.app`.
- Read-only smoke passed: `/menu-intake`, storefront and KDS returned 200; Ops
  intake returned the expected 307 to `/ops/login`; exact-deployment error,
  fatal, warning and HTTP 500 queries were empty.
- Next gate: the owner submits a newly labelled production image/PDF, then its
  presence is verified in authenticated Ops. Do not perform Ops → KDS import
  without separate action-time approval. Marketing Lead Form and Questions
  1–14 remain untouched.

### 2026-08-30 — Codex — Candidate #29 release committed; external network blocked

- Retry recovery is verified and committed locally as exact commit `9c4365a`.
  After this documentation-only blocker record is committed, the branch is three
  commits ahead of `origin/codex/candidate-29` (implementation `6d87106`, repair
  `9c4365a`, then this handoff). `.playwright-cli/` and `output/` remain
  preserved and untracked.
- Push failed on a `github.com:443` connection timeout. Production deploy did
  not start: after resolving the exact saved ZanTap target (project
  `prj_6urcncBFXmv4EhDHlBlURppKSjvP`, team
  `team_7FxXW1LwyLckGLBvZdahce8E`), Vercel CLI could not load the OpenID
  configuration endpoint. No deployment or alias changed.
- When connectivity returns, run `git push origin codex/candidate-29`, then
  `npx vercel deploy --prod --yes --project prj_6urcncBFXmv4EhDHlBlURppKSjvP --scope team_7FxXW1LwyLckGLBvZdahce8E --logs` from the Candidate #29 worktree. Record the
  READY deployment, run read-only route/log smoke, and only then ask the owner
  for a newly labelled image/PDF submission.
- Production attachment persistence and Ops → KDS import remain open. Import
  still requires separate action-time approval. Marketing Lead Form and
  Questions 1–14 remain untouched.

### 2026-08-30 — Codex — Candidate #29 retry recovery repaired and release authorized

- Reviewed exact local commit `6d87106`. Focused Menu Intake tests pass 7/7;
  scoped ESLint, TypeScript and diff hygiene are clean. Full lint reaches only
  the three already-documented Candidate #28 Briefing errors.
- The retry-removal and refresh findings are repaired. Confirmed private
  attachments are deleted before their visible file/dish disappears; partial
  multi-photo cleanup retains completed progress for the next attempt. A safe
  local expected-file manifest (keys/attachment IDs only, no Blob paths or file
  contents) restores incomplete submissions to Review rather than Sent.
- TDD verification: focused 10/10 and full 455 passed / 117 expected skips;
  scoped ESLint, TypeScript, diff hygiene and production build pass. Real-browser
  recovery QA showed the explicit attention state after reload and blocked Send
  until the same pending file is selected. Only local Vercel telemetry scripts
  timed out; the application produced no browser error.
- Owner authorized the complete repair → verify → push → deploy sequence. No
  schema change or migration is needed. Production attachment persistence stays
  open until a newly labelled image/PDF is visible in authenticated Ops. Ops →
  KDS import remains separately action-gated. Preserve `.playwright-cli/` and
  `output/`; do not touch the Marketing Lead Form or Questions 1–14.

### 2026-08-30 — Codex — Candidate #29 approved form refinement implemented locally

- Owner approved the generated three-screen form target. `MenuIntakeWizard`
  now presents business → dishes → review as an explicit `1 of 3` sequence with
  the approved compact dark hierarchy, collapsed Sizes & extras, visible photos,
  review cards, exact fix guidance and gated Send.
- Menu Intake—not the Marketing Lead Form—gains the existing Rwanda-first
  international country selector. The browser composes one canonical digit-only
  phone for the unchanged Store schema and formats it readably on Review.
- Local image previews use cleanup-safe effect ownership. Send now reads the
  private status seam back and cannot show success unless every selected
  attachment ID is durable. Headed QA proved preview survival across collapse,
  Review and hot refresh; local submission `MI-260830-6E8057` reached Sent with
  one confirmed attachment.
- QA: 390×844 + 1440×1000, zero browser errors/warnings; focused 8/8; full
  452 passed / 117 expected skips; scoped ESLint, TypeScript and production
  build clean. Exact target image is
  `C:\Users\G\.codex\generated_images\01a04f16-a73c-7380-bf9a-0c14723d1c3c\exec-03ecb2ec-1f6a-4bd3-8c09-0ac0930ca444.png`.
- This work is local only pending release approval. Production attachment
  persistence remains open because the six previously reviewed live submissions
  still show `0 private files`; Ops → KDS import remains separately action-gated.
  Questions 1–14 remain untouched. Preserve `.playwright-cli/` and `output/`.

### 2026-08-30 — Codex — Candidate #29 owner production submission reviewed

- Authenticated production Ops shows six durable owner-labelled `Test`
  submissions after the Send-menu work. The newest, `MI-260830-B1DA8E`, is
  `SUBMITTED` with revision 1, one structured dish and one private question.
  The hotfix deployment has no 500/error/fatal logs.
- This is only a partial pass: all six visible records report `0 private files`,
  so the review does not yet prove image/PDF persistence. Keep the upload smoke
  open until a labelled attachment is visible in Ops after Send.
- No Ops state was changed, no KDS import or WhatsApp handoff occurred, and no
  product code was edited. International phone entry, intermittent local image
  previews and the generated three-screen form redesign remain behind explicit
  owner approval. Questions 1–14 remain untouched.

### 2026-08-30 — Codex — Candidate #29 Send-menu production hotfix deployed

- Production write attempts proved that valid forms were creating the staged
  intake and then failing every attachment Server Action with `Vercel Blob:
  Cannot use private access on a public store`. The existing
  `BLOB_READ_WRITE_TOKEN` belongs to the public storefront/menu-media store and
  must not receive private intake sources.
- Commits `d77822d` + `648f187` in the clean Candidate #29 worktree separate private
  sources behind `MENU_INTAKE_READ_WRITE_TOKEN`, refuses unsafe production
  fallback, returns a simple recoverable upload error, stores the new intake
  credential before uploading, reuses that intake on retry, skips files already
  uploaded during the same attempt, and prevents double-submit taps.
- Verification is focused 5/5, full 449/117, TypeScript, scoped lint and
  production build clean. Private store `zantap-menu-intake-private`
  (`store_x3m6SdnEz9CeALA6`) is connected only to Production under the
  `MENU_INTAKE_` prefix; existing public Blob variables remain untouched. Exact
  commit `648f187` deployed READY as `dpl_Enq332qdNsoH6ZTcC6zSe2AYrcJ2` on
  `zantap.app`; `/menu-intake` returns 200 and the release-window error log is
  empty. Visual/write browser smoke was skipped to conserve owner usage.
  International phone input and the generated professional form redesign remain
  separate pending work/approval.

### 2026-08-30 — Codex — Candidate #29 Priority #1 deployed; write smoke pending

- Owner-approved execution uses explicit Git Bash and clean linked worktree
  `C:\Users\G\Desktop\2025\Projects\zantap-candidate-29` on
  `codex/candidate-29` from `origin/main`; the original dirty checkout remains
  untouched.
- The shareable `/menu-intake` → `/ops/menu-intakes` → KDS menu workflow is
  implemented end to end behind the Store seam. See the Candidate #29 issue and
  ADR-0082 for security, media, matching, revision, and import decisions.
- Verification: 443 tests passed / 117 expected skips; TypeScript, scoped lint,
  and production build pass. Headed browser smoke imported `Igisafuria` at
  4,200 RWF into the in-memory Inka KDS and confirmed it Available. Full lint is
  blocked only by three pre-existing Candidate #28 Briefing errors on main.
- Migration `20260829170000_vendor_menu_intake` is applied; follow-up Prisma
  status reports all 21 repository migrations up to date. Exact commits
  `aaf19c7` and `680e4df` are pushed to `origin/codex/candidate-29`.
- Owner-approved intake UX refinement is implemented locally: removable image
  thumbnails and PDF cards, one-open dish accordions, five dishes per page, and
  `Visit zantap.app`. Verification is 12/12 focused, 445/117 full, TypeScript,
  scoped lint and production build clean. Owner visual review passed.
- A second owner-approved refinement is implemented locally: simpler English,
  reduced-motion-safe step transitions, default-hidden language choices with an
  Ops global switch, full pre-send dish CRUD, and an outlined `Tell ZanTap`
  handoff with only its WhatsApp icon in brand green, targeting `0784928786`
  and still requiring the Vendor to tap Send. Mobile browser QA
  passed the six-dish review/submission flow with zero errors. A targeted fresh
  reload additionally confirmed the neutral CTA/green-icon split with zero new
  warnings or errors. Final verification is 446/117 with scoped lint,
  TypeScript, Prisma validation and production build clean. Owner release review
  passed. A detached clean worktree deployed exact commit `680e4df` as Vercel
  Production `dpl_8SLHNCwgYpC2E6EhZF8qgs8LNLK4` (`READY`) on `zantap.app`.
- Read-only production smoke passes: Menu Intake, storefront and KDS return 200;
  Ops intake redirects to auth; the live start screen shows the new simple copy
  with language choices hidden; browser console and exact-deployment Vercel
  error/warning scans are clean. One labelled production submission → Ops → KDS
  import smoke awaits action-time owner confirmation because it creates real
  production rows. No WhatsApp message will be sent. Questions 1–14 remain
  unstarted.

### Reconciled repository and production state

- **Candidate #26 🚧 Issues 01–03 deployed + production-smoked
  (2026-08-22):** the
  unified ZanTap customer manifest now launches `/restaurants`; storefronts
  use a versioned IndexedDB/in-memory saved-Vendor repository, meaningful-
  engagement save triggers, a bounded public Store resolver and a private hub
  with recency, saved-only search, confirmed removal and unavailable recovery.
  The install invitation is engagement-gated and legacy storefront/KDS install
  paths remain compatible. Local evidence: 377 passed / 110 skipped, lint and
  production build clean, responsive browser smoke PASS. The owner then
  completed the local manual walkthrough and reported no failed checks, so
  Issue 01 remains closed. The next session takes exactly Issue 02. Its locked
  owner-access UX addition is a direct button that opens the recovery inputs
  without a Setup Guide detour, using short everyday language and no `owner
  token` wording (ADR-0065). Issues 03–04 remain untouched. No migration,
  deployment, push or production smoke is authorized.
  A same-day owner follow-up rejected the original hub presentation. ADR-0066
  replaces it locally with a mobile-first restaurant-passport layout, prominent
  saved-place cards and direct `Open menu`, while keeping all Issue 01 behavior
  unchanged. A bounded repository timeout prevents restricted IndexedDB from
  leaving the PWA on its loading skeleton forever. Focused accessibility and
  storage tests, TypeScript, lint, the full 378/110 suite and production build
  are clean. The owner approved the redesigned hub on 2026-08-21 with no
  requested refinements; commit `151f18b` is the accepted local baseline.
  Issue 02 is now complete locally: default-on Store-backed publication,
  20-minute rolling batches, three-day expiry, public snapshot consolidation,
  KDS global/per-save controls, preview/counters and ADR-0065 direct recovery
  across Updates/Menu/Inventory/History. Migration
  `20260821220000_vendor_update_batches` was authored and Prisma-validated;
  mobile local KDS verification passed, TypeScript/lint/build were clean, and
  Vitest was 388 passed / 113 skipped before release. Issues 03–04 remain untouched.
  Release authorization was received. Commit `c7dd0b0` was pushed, migration
  `20260821220000_vendor_update_batches` applied, and exact commit `c7dd0b0`
  deployed as `dpl_8ay4NowsrHf1HYR97CKJrFRhhrR3` on `zantap.app`. Production
  browser smoke passed 7/7 across Issues 01–02; the update toggle was restored
  ON and there were no browser errors or mobile overflow. The owner then
  explicitly requested Issue 03: its implementation is complete locally with a bounded
  Store feed, device-local per-revision seen/sent markers, one-ring tray,
  full-screen accessible viewer and aggregate-only analytics (ADR-0068).
  Issue 03 is now complete locally and browser-verified. The stale cached-owner
  blocker was fixed by validating access on KDS load, clearing only an invalid
  Vendor credential and opening direct recovery (ADR-0065 amendment); the
  Issue 03 empty-feed effect was also made lint-safe. Verification is 397 passed
  / 114 skipped with TypeScript, lint and production build clean. Mobile and
  desktop production-mode local walkthrough passed revision reactivation,
  displayed-seen, mark-all, unavailable labeling, current-slug menu routing,
  aggregate counters, keyboard/touch handling, overflow and console checks.
  Issue 03 was then pushed and deployed at exact commit `c587898` as
  `dpl_GbKD1CAFNyP37v9kqcP5hJFwcszA`; the owner production-smoked the flow.
  Local commits `d970cc2` and `3353851` established compact change badges and
  the KDS palette; `5672cdf` completed the owner's compact phone reference with
  a quiet saved count, dense update rows and a roughly 220px restaurant pass.
  Owner approval pushed and deployed exact commit `5672cdf` from a detached
  clean worktree as Production `dpl_5erYVZ7RYDhy5DyQVk2o9GdA1Qu4`, `READY` on
  `zantap.app`. Production `/restaurants` passed 390×844 and 1440×1000 smoke
  with HTTP 200, saved Vendor/menu action, no overflow, no failed responses or
  browser errors; the release window had no active Inka update batch. Exact-
  deployment error/fatal/warning/5xx scans were empty. Issue 04 remains deferred
  and requires a separate owner request.

- **Candidate #25 ✅ DONE · deployed · prod-smoked (2026-08-21):** Issues 01–03
  shipped at `fbafcee` through the single deployment
  `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi` on `zantap.app`; migration
  `20260820183000_real_vendor_inventory` was applied once and verified. The
  production harness now waits for `networkidle` before storefront actions and
  passed all 27 Inventory, KDS Orders/History and storefront pagination/cart/
  Back/search checks on its one authorized run, including mobile and desktop
  overflow checks with zero browser errors. Independent Postgres cleanup found
  zero `release-25-*` vendors, inventory items, adjustments, menu items, orders
  and payments. Exact-deployment 48-hour error, fatal and 5xx scans returned no
  entries. The prior storefront stop was conclusively a harness hydration race;
  no owner intervention, product fix, migration repeat or redeploy was needed.
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
| Candidate #25 real Inventory + 10-item pagination | ✅ DONE at `fbafcee`; ADRs 0061–0063; migration applied once; hydration-ready harness 27/27 | ✅ Deployed once as `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi` on `zantap.app` and prod-smoked 2026-08-21; zero fixtures and clean 48-hour error/fatal/5xx scans; no redeploy |

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

### 2026-08-20 — Codex — Inventory + pagination scope approved

- Owner clarified that the shipped Stock screen tracks finished dishes and is
  not sufficient. Approved a separate supply Inventory with CRUD-like lifecycle,
  manual Received/Used/Wasted/Correction adjustments, immutable history,
  archive/restore, units/categories, low/out in-app alerts, and ten-item paging.
- Inventory stays separate from Menu and Profit/Expenses, is owner-token guarded
  and online-only. No paid WhatsApp integration; future delivery is an opt-in
  combined alert no more than once per 30 minutes.
- Approved ten-per-page live Orders, History, Inventory and storefront dishes;
  URL-backed filters/pages; page-local KDS bulk selection; stable later pages
  with a new-order notice; cart-preserving storefront navigation.
- Work is isolated on `codex/inventory-pagination` from stable `df9d530`.
  Published three ready-for-agent issues under `.scratch/inventory-pagination/`.
  No implementation, migration or deployment has occurred yet.

### 2026-08-20 — Codex — Issue 01 Real vendor Inventory complete locally

- Implemented a supply Inventory separate from Menu dishes and Profit/Expenses:
  both Store adapters now support create/edit, Received/Used/Wasted/Correction,
  immutable old/new history, non-negative stock, archive/restore, category/search
  filters, out→low→alphabetical ordering, counts, clamping, and ten-item pages.
- Added owner-token-guarded async-only Server Actions and the dark KDS Inventory
  screen with URL-backed search/category/page/archive state, yellow low and red
  out alerts, reference-only unit costs, online-only mutation controls, and
  accessible create/edit/adjust/history flows. No WhatsApp or fee path was added.
- Setup Guide now includes `Add your first stock item`, navigates to Inventory,
  and completes from the first active supply item. The reachable legacy Stock tab
  is replaced; Menu dish availability mechanics and Profit calculations are
  unchanged.
- Created migration `20260820183000_real_vendor_inventory` but did not apply it.
  Production and Vercel were not touched.
- Verification: focused Store 5/5, focused actions/Setup 15/15, TypeScript and
  lint clean, full tests 354 passed / 109 expected skips, production build clean;
  local 390×844 + 1280×900 browser smoke passed create → Receive → history →
  negative guard → archive/restore → Setup completion with zero console errors
  and no horizontal overflow. Browser verification used webpack dev mode after
  Turbopack's generated dev cache produced a baseline Icon hydration failure on
  both Inventory and untouched Orders; the production Turbopack build is clean.
- Next isolated slice: Issue 02 KDS live Orders + Order History ten-item,
  URL-backed pagination. Do not deploy until all three issues and the release
  gate pass.

### 2026-08-20 — Codex — Issue 02 KDS Orders + History pagination complete locally

- Live Orders now filter/sort before ten-item paging with URL-backed
  `ordersStage`, `ordersSort` and `ordersPage`; invalid and realtime-empty pages
  clamp backward. Stage/sort changes return to page 1.
- Later live pages defer newly arriving order IDs and show a polite `new order —
  view page 1` notice instead of reshuffling. Opening the notice restores
  newest-first page 1. Selection and bulk mutations are limited to visible
  tickets and clear on page changes.
- History now requests ten rows, restores date/status/payment/search/page state
  from the URL, resets filters to page 1 and clamps empty pages through a safe
  follow-up read. Accessible result totals and Previous/Page/Next navigation
  ship on both surfaces.
- Verification: focused 10/10, TypeScript/lint clean, full tests 358 passed / 109
  expected skips, production build clean, and local 390×844 + 1280×900 browser
  smoke passed with zero console errors, overlays or horizontal overflow.
- ADR-0062 records the realtime paging boundary. Production, Vercel and migration
  `20260820183000_real_vendor_inventory` remain untouched. Next isolated slice:
  Issue 03 storefront menu pagination; do not deploy before the combined gate.

### 2026-08-20 — Codex — Issue 03 storefront menu pagination complete locally

- Added a pure storefront menu query/pagination module: unavailable dishes are
  removed before category/search filtering, safe clamping and ten-item slicing.
  `category`, `search` and `page` are shareable URL state with defaults omitted
  and unrelated parameters preserved.
- The Customer view now provides search plus Previous/Page/Next controls. Page
  and filter changes keep the mounted cart/customization module, Back/forward
  restores the view, and page changes return scroll/focus to the Menu heading.
  Empty and one-page states retain accessible controls.
- Verification: focused 4/4, TypeScript/lint clean, full tests 362 passed / 109
  expected skips, production build clean, and local 390×844 + 1280×900 browser
  smoke passed 32/32 with zero console errors, overlays or overflow. ADR-0063.
- Candidate #25 is feature-complete locally. Production, Vercel and migration
  `20260820183000_real_vendor_inventory` remain untouched. Next gate: review and
  apply that migration, deploy the three-issue release once, then prod-smoke.

### 2026-08-20 — Codex — Candidate #25 combined release deployed; interaction smoke pending

- Reviewed isolated commits `61c25fa`, `3ffc85e`, and `fbafcee`; migration is
  additive/backward-compatible. Combined gate passed: Prisma schema, TypeScript,
  lint, 362 passed / 109 skipped, and production build.
- Applied `20260820183000_real_vendor_inventory`; `prisma migrate status` reports
  all 16 current and direct `InventoryItem`/`InventoryAdjustment` reads pass.
- Deployed exactly once: `fbafcee` → `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi` →
  `zantap.app` (Ready). Root and all candidate routes return 200; deployment
  error/fatal/5xx scans are empty.
- Disposable browser smoke observed successful guarded Inventory create
  responses but exhausted its two retry cycles on a brittle immediate
  post-create pagination render assertion before Orders/History/storefront
  interactions. All `release-25-*` fixture vendors/items were removed after
  every attempt. No product exception or runtime 5xx was observed.
- Remaining gate: harden `.scratch/inventory-pagination/prod-smoke.mjs` to wait
  for refreshed pagination/search state, run it once, record pass evidence, and
  close candidate #25. Do not reapply the migration or redeploy.

### 2026-08-20 — Codex — Candidate #25 single interaction smoke stopped at refresh race

- Ran `.scratch/inventory-pagination/prod-smoke.mjs` exactly once against
  `zantap.app`; no migration or deployment command was run.
- The browser passed Inventory page sizing, create/search/out-state and submitted
  the Received adjustment. It then failed at `Inventory adjustment updated the
  visible quantity`: the component publishes `Stock quantity updated` before its
  awaited `loadInventory` refresh completes, while the harness used an immediate
  `isVisible()` after the toast. This is a harness synchronization failure; the
  run did not reach history/archive/restore, KDS Orders/History, or storefront.
- Patched only that harness boundary to `waitFor()` the refreshed `5 pieces` row.
  Per the one-run instruction, the harness was not rerun and candidate #25 stays
  pending rather than being marked prod-smoked.
- Independent direct-Postgres cleanup check: zero fixture vendors, inventory
  items, adjustments, menu items, orders and payments. Deployment
  `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi` remains Ready; 30-minute error, fatal and
  5xx scans each returned zero entries.
- Next gate: run the patched harness once. On a complete pass, mark Issues 01–03,
  candidate #25 and ADR-0061–0063 DONE/deployed/prod-smoked, update this handoff,
  and commit only candidate #25 release records plus the harness. Do not reapply
  migration `20260820183000_real_vendor_inventory` and do not redeploy.

### 2026-08-20 — Codex — Candidate #25 Inventory passed; KDS harness selector stopped closeout

- Ran `.scratch/inventory-pagination/prod-smoke.mjs` exactly once against
  `zantap.app`; no migration or deployment command was run.
- Inventory completed page sizing, create/search/out state, Received refresh,
  immutable history, archive/restore and direct Postgres verification.
- Live Orders reached URL-backed `Page 2 of 2`, then the harness failed its two-
  ticket assertion because it searched for `<article>` elements. `OrderTicket`
  renders the shared `Card`, whose root is a `<div>`. The harness now counts the
  direct ticket-card children before the Live Orders pagination nav and was not
  rerun. History page two/invalid-page and storefront page-two/cart/Back/search
  remain pending; candidate #25 is not marked prod-smoked.
- Direct Postgres cleanup reports zero `release-25-*` fixture vendors, inventory
  items, adjustments, menu items, orders and payments. Two-hour deployment-
  scoped error, fatal and 5xx scans returned zero entries.
- Next gate: run the newly patched harness once. On a complete pass, mark Issues
  01–03, candidate #25 and ADR-0061–0063 DONE/deployed/prod-smoked, update this
  handoff, and commit only candidate #25 release records plus the harness. Do not
  reapply migration `20260820183000_real_vendor_inventory` and do not redeploy.

### 2026-08-20 — Codex — Candidate #25 KDS passed; storefront Previous stopped closeout

- Ran `.scratch/inventory-pagination/prod-smoke.mjs` exactly once against
  `zantap.app`; no migration or deployment command was run.
- Inventory again completed the full production lifecycle and direct Postgres
  verification. The corrected Live Orders selector passed page two with two
  tickets and Previous to page one. History passed page two with two receipts
  and invalid `historyPage=999` clamping to page two.
- Storefront page two rendered its one remaining dish and the harness added it
  to the cart. The URL still contained a `page` parameter 30 seconds after
  clicking Previous, so the run stopped before page-one/cart, browser Back and search.
  The harness now waits for the page-one label and reports URL plus card count at
  this boundary; it was not rerun. Candidate #25 remains pending.
- Direct Postgres cleanup reports zero `release-25-*` fixture vendors, inventory
  items, adjustments, menu items, orders and payments. Two-hour deployment-
  scoped error, fatal and 5xx scans returned zero entries.
- Next gate: diagnose the production storefront Previous transition, then run
  the patched harness once. On a complete pass, mark Issues 01–03, candidate #25
  and ADR-0061–0063 DONE/deployed/prod-smoked, update this handoff, and commit
  only candidate #25 release records plus the harness. Do not reapply migration
  `20260820183000_real_vendor_inventory` and do not redeploy.

### 2026-08-20 — Codex — Candidate #25 storefront stop diagnosed as hydration race

- No owner intervention is required. The production deployment and product code
  are not implicated by the failed assertion.
- Root cause: `.scratch/inventory-pagination/prod-smoke.mjs` starts storefront
  interactions after `domcontentloaded`. Next.js has already painted the SSR
  buttons then, but React may not have attached `onClick`/`onChange` handlers.
  Playwright can successfully click a visible pre-hydration button while no URL
  state change occurs. The earlier local storefront smoke explicitly waited for
  `networkidle`, which is why the same behavior passed locally.
- Read-only production feedback loop on `/inka-steakhouse`: filling the URL-
  backed search immediately after `domcontentloaded` failed to update the URL in
  5/5 attempts; waiting for `networkidle` first passed in 5/5 attempts. No fixture
  or database write was made.
- Next gate: add an explicit hydration-ready wait before production storefront
  interactions, then run the full harness exactly once. If PASS, perform the
  existing cleanup/log checks, mark candidate #25 DONE/deployed/prod-smoked, and
  commit only its release records and harness. Do not migrate or redeploy.

### 2026-08-21 — Codex — Candidate #25 DONE · deployed · prod-smoked

- Added the explicit `networkidle` hydration boundary before storefront
  interactions in `.scratch/inventory-pagination/prod-smoke.mjs`, then ran the
  full production harness exactly once against `zantap.app`.
- The run passed all 27 checks: guarded Inventory create/adjust/history/archive/
  restore plus direct Postgres verification; Live Orders and History page-two,
  Previous and invalid-page behavior; storefront page navigation, default URL,
  cart persistence, browser Back and URL-backed search; mobile/desktop overflow;
  and zero browser console/framework errors.
- The harness cleaned `release-25-mt2fpxqf`. An independent Postgres audit then
  found zero `release-25-*` vendors, inventory items, adjustments, menu items,
  orders and payments. Exact deployment `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi`
  returned no error, fatal or 5xx logs in the 48-hour scan.
- Candidate #25 and Issues 01–03 are closed. Migration
  `20260820183000_real_vendor_inventory` was not reapplied and production was not
  redeployed; the only behavior change in this closeout is the harness wait.

### 2026-08-21 — Codex — Candidate #26 customer restaurant hub grilled

- Owner completed the product interview for a single ZanTap customer app that
  is installed once and retains multiple meaningfully interacted-with
  storefronts. Candidate #26 is grill-complete and ready for PRD; it is not
  implemented, migrated, deployed, or prod-smoked.
- The installed customer app opens its originating storefront immediately after
  install and `Your restaurants` on later icon launches. Saved vendors are
  device-local, keyed by stable vendor ID, carried over from pre-install browser
  activity, retained until manual removal, and searchable only within the
  private collection. Public discovery and customer accounts are deferred.
- The home uses a three-day WhatsApp-inspired update tray above the full saved
  list. Meaningful menu/profile changes auto-publish as immutable snapshots in
  20-minute rolling batches; one vendor ring opens batches newest to oldest.
  Viewed state is per displayed batch. Vendors get default-on, global-off and
  per-change suppression controls plus aggregate-only analytics.
- Push, identifiable viewer lists, and manual vendor posts are deferred. The
  hub is read-only offline; checkout remains online-only. ADR-0064 supersedes
  ADR-0059 only for the customer install identity and preserves the separate KDS
  PWA. Decisions: `.scratch/customer-restaurant-hub/grill-decisions.md`.
- Next gate is PRD + isolated issues. Candidate #25 prohibitions remain in
  force: do not rerun its production harness, reapply migration
  `20260820183000_real_vendor_inventory`, or redeploy that release.

### 2026-08-21 — Codex — Candidate #25 merged/live; Candidate #26 planning ready

- Candidate #25 `main` was fast-forwarded/pushed to `7028e5b`; Production
  `dpl_874DQNUcV2fG7eXsbtLeFTqdeJJd` is Ready on `zantap.app`. Root,
  storefront, KDS and Inventory checks returned 200 and the initial exact-
  deployment error scan was clean. Migration `20260820183000_real_vendor_inventory`
  was not reapplied and the Candidate #25 harness was not rerun. Release docs
  are commit `1c36437` on `codex/inventory-pagination`.
- Candidate #26 now has a complete PRD and four `ready-for-agent` tracer bullets:
  01 unified customer PWA + device-local saved-Vendor hub; 02 Store-backed
  rolling updates + Vendor controls; 03 bounded public tray/viewer + aggregate-
  only analytics; 04 offline hub + read-only cached menus. Issues 01/02 may
  begin independently; 03 depends on both; 04 follows the customer read models.
- New storefronts advertise the retained root ZanTap manifest identity launching
  the hub; legacy per-storefront manifests keep installed icons working; KDS is
  unchanged. Local state uses one versioned IndexedDB repository and persistent
  update/feed/counter work stays behind the Store seam. ADR-0064 is amended.
- No Candidate #26 feature code, migration, deployment or production smoke and
  no Candidate #25 harness/migration repeat occurred. Next session takes exactly
  one issue and keeps the remaining slices isolated.

### 2026-08-21 — Codex — Candidate #26 Issue 01 complete locally

- Implemented exactly Issue 01 on `codex/customer-restaurant-hub`: one root
  customer PWA launching `/restaurants`, one versioned browser repository keyed
  by stable Vendor ID, meaningful-engagement persistence, bounded public Store
  resolution, and the private saved-restaurant hub.
- New storefront visits remain passive. Explicit save, first cart addition,
  checkout start and Order placement update the collection; existing saved
  state carries into installation and unlocks the one-time customer invitation.
- Legacy per-storefront manifest endpoints and KDS install identity are
  preserved. The service worker/offline menu work and all update feed/vendor
  controls remain isolated in Issues 02–04.
- Verification: `npm test` 377 passed / 110 skipped; lint and production build
  clean; local browser save → hub → public refresh and responsive checks PASS
  with zero browser errors/overflow. No migration, deployment, production smoke
  or push occurred.

### 2026-08-21 — Codex — Candidate #26 Issue 01 owner walkthrough closeout

- The owner manually tested Issue 01 locally and reported no failed walkthrough
  checks. Issue 01 remains closed; no product code changed in this closeout.
- The next session is exactly Issue 02. The owner additionally requires every
  missing-access notice reached by the Vendor controls to offer a direct button
  that opens the recovery input dialog, rather than sending the Vendor through
  Setup Guide. Copy must be short, everyday English and avoid `owner token`.
  This is locked in Issue 02 and ADR-0065; the existing Menu, Inventory and
  History notices should reuse the same entry point while that surface is open.
- Issues 03–04 were not started. No migration, deployment, push or production
  smoke was performed or authorized. The unstaged Inventory PRD modification
  and all pre-existing untracked artifacts remain preserved.

### 2026-08-21 — Codex — Candidate #26 hub UI/UX redesign

- After the functional walkthrough passed, the owner rejected the `/restaurants`
  visual experience and requested a more creative mobile/PWA treatment.
- Reworked only `RestaurantHub`: asymmetrical editorial split on desktop,
  phone-first stacking, a high-contrast saved-restaurant destination card,
  direct `Open menu`, icon-only secondary removal, useful-only search, a guided
  empty state, safe-area padding, visible focus and reduced-motion behavior.
  The design direction is recorded in ADR-0066.
- No saved-data semantics, resolver, install manifest, engagement trigger or
  Store behavior changed. The resilient browser repository now falls back to
  memory after a bounded IndexedDB non-response instead of loading forever.
  Issues 02–04 remain untouched.
- Verification: focused accessibility/storage PASS; TypeScript clean; lint
  clean; full Vitest 378 passed / 110 skipped; production build clean; 390px and desktop
  layout bounds have no horizontal overflow. Owner visual approval is pending.
- No migration, deployment, push or production smoke. Preserve the unstaged
  Inventory PRD modification and every existing untracked artifact.

### 2026-08-21 — Codex — Candidate #26 Issue 02 complete locally

- The owner visually approved restaurant-passport hub commit `151f18b` with no
  refinements, clearing Issue 02. Issue 01/ADR-0066 now record that approval.
- Implemented exactly Issue 02: Store-backed default-on update settings,
  immutable public entries, rolling 20-minute batches, three-day expiry,
  repeated-entry consolidation, monotonic batch revisions and aggregate
  counters in both adapters. Qualifying owner-guarded menu/profile/branding
  saves publish; normalized no-ops and operational paths remain silent.
- KDS Menu now exposes on/off, `Don't announce my next qualifying change`,
  active-batch preview and aggregate totals without changing KDS PWA identity.
  ADR-0065 is implemented through one in-place recovery dialog used directly by
  Customer Updates, Menu, Inventory and History with plain Vendor language.
- Authored migration `20260821220000_vendor_update_batches`; `prisma format` and
  `prisma validate` pass. The migration was not run/applied. Remote `#prisma`
  contracts remain opt-in and skipped at this authorization gate.
- Verification: mobile local KDS at 390×844 PASS (HTTP 200, no overlay/overflow,
  on/off round-trip restored on, direct dialog + all notice entry points);
  TypeScript and lint clean; Vitest 388 passed / 113 skipped; production build
  clean. No deploy, production smoke or push occurred. Issues 03–04 remain
  untouched. The unstaged Inventory PRD edit and every pre-existing untracked
  artifact remain preserved.

### 2026-08-22 — Codex — Candidate #26 Issues 01–02 released

- Owner explicitly authorized push, migration, exact-commit production deploy
  and scoped production smoke. `codex/customer-restaurant-hub` was pushed at
  `c7dd0b0`; migration `20260821220000_vendor_update_batches` applied cleanly.
- A detached temporary worktree guaranteed Vercel received exact commit
  `c7dd0b0`, excluding the unstaged Inventory PRD edit and every pre-existing
  untracked artifact. Production `dpl_8ay4NowsrHf1HYR97CKJrFRhhrR3` is READY
  and aliased to `zantap.app`.
- `.scratch/customer-restaurant-hub/prod-smoke.mjs` passed 7/7 at 390×844:
  unified customer manifest, explicit saved-Vendor persistence, public resolver
  and hub, KDS update overview/preview, direct recovery, update toggle round-trip
  restored ON, zero browser console/page errors and zero horizontal overflow.
- Two early harness assertions were corrected (accessible menu-link name and
  KDS auto-closing the recovery dialog); both recovery calls succeeded and left
  valid audit events. Release-window logs also showed one concurrent out-of-
  scope `P2024` on `happy-eateries` KDS SSE; Candidate #26 smoke routes passed.
- Issues 03–04 were not started. The Inventory PRD modification and all prior
  untracked artifacts remain preserved.

### 2026-08-22 — Owner sequencing decision under Codex usage constraint

- The owner reported approximately 15% of the current Codex plan allowance
  remains and wants to preserve capacity for several other tasks.
- Candidate #26 Issue 03 is the next priority because it exposes the already-
  published Vendor batches to Customers as an unseen-update tray on
  `/restaurants`, completing the customer-visible value of Issues 01–02.
- Issue 04 is deferred. It would keep the saved-restaurants hub and previously
  viewed menus readable during weak/no connectivity, clearly mark cached data
  as potentially stale, and keep ordering/checkout disabled until online.
- Do not start Issue 03 or Issue 04 merely from this handoff. Begin Issue 03
  only when the owner explicitly requests it; keep its implementation and
  verification tightly scoped. Issue 04 requires a later, separate decision.

### 2026-08-22 — Codex — Candidate #26 Issue 03 implementation complete locally

- The owner explicitly requested Issue 03 under the usage constraint. Added a
  bounded/deduplicated public feed through the Store and both adapters; active
  non-expired batches expose only public snapshots plus live dish availability,
  while suspended Vendors expose no batches.
- Upgraded the existing customer repository to IndexedDB version 2 with local
  per-batch viewed/open-sent/menu-visit-sent revisions and a matching in-memory
  adapter. Confirmed Vendor removal clears those markers. No customer identity,
  saved list or individual event history is sent to or stored by the server.
- `/restaurants` now shows a separate unseen-update count and one ring per
  Vendor, preserving the persistent list's recency. The full-screen viewer
  starts at the newest unseen revision, marks only rendered content, supports
  buttons/keyboard/swipe, shows immutable snapshots with live availability,
  routes `View menu` through the current slug and offers explicit mark-all.
- Aggregate open/menu-visit POSTs are sent at most once locally per batch
  revision. ADR-0068 records the interface/privacy decisions. Verification:
  TypeScript and lint clean; Vitest 396 passed / 114 skipped; production build
  clean. A local mobile/desktop browser harness could not start because the
  repository does not install `playwright` (`ERR_MODULE_NOT_FOUND`), so the
  responsive interaction walkthrough remains a human gate. No migration,
  deployment, production smoke or push occurred.
- Preserve the unstaged Inventory PRD modification and every pre-existing
  untracked artifact. Do not push the earlier local handoff commit `14cb78c`
  or this Issue 03 commit without explicit authorization. Issue 04 remains
  deferred and must not begin without a separate owner request.

### 2026-08-22 — Codex — Candidate #26 Issue 03 browser gate attempted

- Reused the committed `82e2657` implementation without source changes and
  attempted the local KDS-to-hub walkthrough in the in-app browser.
- `next dev` reached the shared `Icon` runtime fault. The existing production
  build rendered the KDS, but a stale cached owner credential was rejected by
  the freshly seeded in-memory Store even though Setup labeled the device
  unlocked. Clearing browser storage was not authorized, so no qualifying
  update fixture was published and no Issue 03 acceptance checkbox was closed.
- Preserved the Inventory PRD modification and all untracked artifacts. No
  migration, deployment, production smoke, push, Issue 04 work or new ADR.

### 2026-08-22 — Codex — Candidate #26 Issue 03 browser gate closed locally

- Owner authorized clearing localhost ZanTap data, but browser security blocked
  direct clearing. Fixed the underlying product gap instead: new async
  `validateOwnerAccess` verifies cached access on KDS load; stale credentials
  are removed per Vendor and the shared recovery dialog opens automatically.
  ADR-0065 records the amendment and a focused action test locks the behavior.
- Fixed the Issue 03 empty-feed effect exposed by the full lint gate. Final
  verification: 397 passed / 114 skipped, TypeScript, lint and production build
  clean.
- Production-mode local browser walkthrough passed on mobile and desktop:
  revision unseen reactivation, displayed-only seen behavior, mark-all,
  snapshot prices plus live unavailable status, current-slug menu routing,
  aggregate opens/menu visits at 1/1, keyboard controls, touch swipe, no
  horizontal overflow and zero console errors. Multi-Vendor/multi-batch ordering
  remains deterministically covered by the unit/contract suite because the
  locked 20-minute local batching window cannot create separate batches during
  one walkthrough.
- Issue 03 is complete locally but uncommitted/unreleased. Preserve the Inventory
  PRD modification and every untracked artifact. No migration, deployment,
  production smoke, push or Issue 04 work occurred.

### 2026-08-22 — Codex — Candidate #26 Issue 03 released; hub polish local

- Owner authorization pushed `14cb78c`, `82e2657` and `c587898`. Production
  schema was already current, so no migration write occurred. Exact commit
  `c587898` deployed READY as `dpl_GbKD1CAFNyP37v9kqcP5hJFwcszA` and holds the
  `zantap.app` aliases.
- The tracked production harness needed its IndexedDB open version raised from
  1 to 2 after Issue 03's repository upgrade. The pre-existing Candidate #26
  flow then passed 7/7. Automated viewer smoke found no active Inka batch; the
  owner subsequently exercised the production flow and reported it works as
  expected.
- Owner-requested `/restaurants` polish is complete locally: numeric orange
  badges state total unseen changes in the section and per Vendor ring; the hub
  reuses the KDS charcoal/grain/warm-white/MoMo-orange theme; and labels are
  shorter plain English. ADR-0066 records the amendment.
- Verification is 397 passed / 114 skipped with TypeScript, lint and production
  build clean. A production-mode review at 390px and 1440px passed with no
  overflow or console errors. Screenshots and the local review harness remain
  untracked under `.scratch/customer-restaurant-hub/`.
- The polish is not pushed or deployed pending explicit owner visual/release
  approval. Preserve the unstaged Inventory PRD modification and all prior
  untracked artifacts. Issue 04 remains deferred and must not begin without a
  separate owner request.

### 2026-08-22 — Codex — Candidate #26 owner reference assessed

- The owner supplied the intended compact phone-first `/restaurants` reference.
  The KDS palette in local commit `3353851` is directionally correct, but the
  current render is materially taller and sparser than the reference: oversized
  intro/count, sparse update tray and oversized restaurant card.
- No product code, push, deployment, migration or Issue 04 work occurred. Release
  approval remains withheld; `3353851` must not ship. The next pass, if the owner
  authorizes it, is a local composition-only refinement followed by fresh visual
  approval and a new exact release commit.
- The Inventory PRD edit and every pre-existing untracked artifact remain
  preserved.

### 2026-08-22 — Codex — Candidate #26 reference composition completed locally

- Owner authorization implemented only the compact `/restaurants` composition:
  quiet eyebrow saved count, one-row update summaries with per-Vendor badges,
  and a roughly 220px restaurant pass with grouped date/menu/remove actions.
  The dark KDS palette, desktop split and every Issue 03 behavior remain.
- The screenshot hamburger was intentionally omitted because no real navigation
  drawer exists. Touch targets remain at least 44px; focus and reduced-motion
  behavior are preserved.
- Verification: 397 passed / 114 skipped, TypeScript, lint and production build
  clean. Production-mode 390px and 1440px review passes with no horizontal
  overflow or unexpected console errors. The untracked harness ignores only
  the expected localhost 404s for Vercel Analytics/Speed Insights.
- No push, deployment, migration, production data or Issue 04 work occurred.
  Await owner visual/release approval for the new exact local commit. The
  Inventory PRD edit and all untracked artifacts remain preserved.

### 2026-08-22 — Codex — Candidate #26 reference composition released

- Owner explicitly approved exact commit `5672cdf`. The feature branch was
  pushed, and a detached clean worktree ensured that Vercel received only that
  commit. Production deployment `dpl_5erYVZ7RYDhy5DyQVk2o9GdA1Qu4` is `READY`
  on `zantap.app`; no migration was needed or applied.
- Production `/restaurants` smoke passed at 390×844 and 1440×1000: HTTP 200,
  saved Inka identity and `Open menu`, exact viewport width, and zero failed
  responses, overlays, console errors or page errors. No Inka update batch was
  active during the release, so the live update row did not render; the approved
  production-mode fixture review and 397/114 test evidence cover that state.
- Exact-deployment error, fatal, warning and 5xx scans returned no entries. The
  Inventory PRD edit and every pre-existing untracked artifact remain preserved.
  Issue 04 was not started and remains separately gated.

### 2026-08-25 — Codex — Menu size pricing reference received

- Began the owner-requested optional menu-size pricing slice on the existing
  `codex/customer-restaurant-hub` branch while preserving all prior dirty and
  untracked work. Local, uncommitted work currently includes the issue record,
  S/M/L domain types/helpers/tests, validation, additive Prisma schema/migration,
  Store adapter pricing and order-size snapshot seams, and an incomplete first
  KDS form pass.
- Focused helper tests pass (5/5), the in-memory Store contract passes (112/112),
  and TypeScript was clean before the incomplete client-cart edits began.
  Standard `prisma generate` hit Windows `EPERM` on the locked query-engine DLL;
  `prisma generate --no-engine` succeeded without stopping the shared process.
- Owner then supplied the intended KDS UI reference. It requires a segmented
  Single price / By size editor with dynamic editable/reorderable rows,
  per-row enable/delete controls, reset, and Add custom size. That materially
  exceeds the initial fixed S/M/L assumption, so work paused for confirmation
  before locking the persistence model. No commit, push, deployment, production
  migration, or production data change occurred.

### 2026-08-25 — Codex — Dynamic menu size pricing implemented locally

- The owner confirmed every control in the reference must be functional. The
  slice now uses ordered dynamic size options (2–8) with stable IDs, editable
  labels/prices, drag and keyboard reordering, visibility, delete, reset, and
  custom-size creation. New lists default to Small/Medium/Large.
- Both Store adapters persist the list. `MenuItem.priceRwf` remains the derived
  starting price. Order creation resolves the current enabled option on the
  server and snapshots its ID, label, and price; cart lines are keyed by menu
  item plus size. Storefront, checkout, KDS, receipts, WhatsApp text, CSV/XLS
  exports all carry the selected snapshot. ADR-0069 records the model.
- Automated verification is clean: focused and full Vitest suites, TypeScript,
  lint, and production build. Final browser interaction/visual QA remains gated
  by the already-running stale local `next start` process; it must be manually
  restarted before the new build can be reviewed. No push, deploy, production
  migration, or production data change occurred. Preserve every unrelated dirty
  and untracked artifact.
- The feature code, migration, focused tests, and ADR were committed as exact
  local commit `7efdf92` (`feat(menu): add dynamic size pricing`) without
  staging the unrelated Inventory PRD, marketing assets, reference screenshots,
  or the pre-existing continuity edits in this file.

### 2026-08-25 — Codex — Dynamic menu size pricing browser gate executed

- Stopped stale local `next start` PID 28584, started the current tree with
  `npm run dev`, and completed headed Playwright verification at 390x844 and
  1440x1000. The dev server remains the sole listener on port 3000.
- Functional PASS: Single price → By size; rename/price edit; pointer drag and
  keyboard reorder; visibility; delete; reset; custom size; create/edit restore;
  storefront selection; distinct Small/Large cart lines; sandbox checkout with
  PIN `12345`; and paid KDS ticket snapshots. Local in-memory order `#7089`
  carried `Small · 4,500 RWF each` and `Large · 9,000 RWF each`. Hidden Medium
  was absent from storefront choices. Browser console errors: zero.
- Visual PASS: desktop create/edit and mobile edit. Visual FAIL: mobile create
  at 390px. `MenuItemModal`'s create-only Category/Photos grid expands the 293px
  body to 379px (341px scroll container / 403px scroll width), clipping Photos
  and producing a horizontal scrollbar. Evidence lives under
  `output/playwright/menu-item-sizes/`.
- Issue 01 therefore remains locally implemented but its browser checkbox stays
  open pending a scoped responsive-layout fix and recheck. No product code,
  migration, push, deployment, or production data was changed in this pass.
  Preserve the unrelated Inventory PRD edit and all pre-existing untracked
  artifacts.

### 2026-08-25 — Codex — Dynamic menu size pricing visual gate closed

- Implemented only the create-modal Category/Photos responsive fix in
  `MenuItemModal`: the fields stack below `sm`; the approved desktop pair uses
  zero-min tracks so intrinsic combobox width cannot expand the modal.
- Headed Playwright create/edit review passed at 390x844 and 1440x1000. Mobile
  create now measures 341px client width / 341px scroll width (previously
  341px / 403px); document and dialog widths also match exactly. Desktop keeps
  Category and Photos side by side. Browser console errors remained zero.
  Responsive evidence is under `output/playwright/menu-item-sizes/`.
- `npm run lint` and `npx tsc --noEmit` pass. The prior full functional browser
  QA, full tests and production build remain valid because the follow-up changed
  only responsive classes. Issue 01's final browser checkbox is now closed and
  ADR-0069 records the layout decision.
- The responsive source/docs changes are uncommitted. No migration, push,
  deployment or production data change occurred. Preserve the unrelated
  Inventory PRD edit and all pre-existing dirty/untracked artifacts.

### 2026-08-25 — Codex — Dynamic menu size pricing approved visual implemented

- The owner approved the generated compact KDS visual as the exact target and
  requested the same size choices to read beautifully on the storefront.
  Locally, the edit header now uses an expandable
  `N sizes · From X RWF` summary, the price-mode segment has one clean border,
  and the dynamic options use one-open-at-a-time accordion rows with consistent
  Lucide drag, Eye/EyeOff, ellipsis, chevron, reset, add, and delete controls.
  Standard labels remain complete at 390px.
- Storefront customization now exposes only enabled sizes in a polished
  single-column required selector at mobile and desktop widths. Selecting Large
  updated both the item headline and Add to order total to 9,000 RWF; hidden
  Medium remained absent while Small, Large, and Family rendered completely.
- Headed 390x844 and 1440x1000 KDS/storefront review passed with no horizontal
  overflow and zero console errors/warnings. Accordion exclusivity, overflow
  actions, visibility round-trip, keyboard reorder, temporary add/delete, and
  persisted four-row restoration passed. Evidence is under
  `output/playwright/menu-item-sizes/`.
- Final checks pass: 411 tests / 116 skipped, 22 focused tests, TypeScript,
  lint, and diff check. The local server was restarted with database URLs
  explicitly blank, so all QA fixtures stayed in memory.
- These KDS/storefront source and documentation changes remain uncommitted
  pending owner approval. No migration, push, deployment, or production data
  change occurred. Preserve the unrelated Inventory PRD edit, brand screenshot,
  marketing work, and every pre-existing dirty/untracked artifact.

### 2026-08-25 — Codex — Dynamic menu size pricing owner-approved closeout

- The owner completed the final local port-3000 review and approved the compact
  KDS accordion and storefront size selector. The responsive and approved
  visual follow-ups were committed locally as `7ae92f4` after base
  implementation `7efdf92`.
- Candidate status is now done locally and owner-approved. Release remains a
  separate gate: no migration, push, deployment, or production data change was
  authorized or performed.
- Preserve the unrelated Inventory PRD edit, brand/marketing work, and every
  pre-existing dirty or untracked artifact.

### 2026-08-25 — Codex — Dynamic menu size pricing released

- Owner explicitly authorized push and deploy. Pushed
  `codex/customer-restaurant-hub` from `5672cdf` through closeout `7c50ddf`.
- Read-only `npx prisma migrate status` confirmed production has not applied
  `20260825123000_menu_item_sizes`. It adds the `MenuItem.sizeOptions` and
  `OrderItem.sizeOptionId` / `sizeLabel` columns read by the new Prisma adapter.
- Owner then explicitly authorized the correct migration. `npm run db:deploy`
  applied only `20260825123000_menu_item_sizes`; follow-up status reported all
  18 repository migrations up to date.
- A detached clean worktree deployed exact commit `7c50ddf` as Vercel Production
  `dpl_DABHFN7qt7KrV7wsfvizvs25mMkR` (`READY`), now aliased to `zantap.app`,
  `www.zantap.app`, and `zantap-psi.vercel.app`.
- Production smoke passed: storefront `/inka-steakhouse`, KDS
  `/vendor/inka-steakhouse`, and `/onboard` returned HTTP 200 with no application
  error; downloaded client bundles contain the approved size-editor and selector
  markers. Exact-deployment error, fatal, warning, and 5xx scans were empty.
  No production fixture, menu item, order, or other business data was changed.
- Preserve the unrelated Inventory PRD edit, brand/marketing work, and every
  pre-existing dirty or untracked artifact.
