# Architecture candidates — backlog index

Source: `/improve-codebase-architecture` review (recovered from session transcript
`5e22d701-4923-4f9b-80ba-5c1a99150bea`, which rendered the five candidates as an
HTML report). This file is the durable, session-independent record so the backlog
is never lost again.

> Note: `.scratch/` is local and gitignored (per `AGENTS.md` issue-tracker
> convention — local markdown, no GitHub round-trips). It persists on this machine
> across sessions, but does **not** sync via git to other clones/machines.

Last verified against the codebase: 2026-07-15.

## Product architecture audit (2026-08-05)

**✅ PHASE 1 + INTERVIEW + PRD/ISSUES COMPLETE · NEXT = IMPLEMENT ISSUE 01.**
PRD + 10 isolated issues now live in `.scratch/product-restructure/` (prd.md +
issue-01…10): T1 brand rollout / domain cutover (owner-blocked on buying
`zantap.app`) / marketing page at `/` (motion stack per ADR-0047: GSAP +
Three.js + Higgsfield + vendored scroll-world skill at
`.agents/skills/scroll-world/`; budget approval before paid rendering) /
lead capture / ops inbox; T2
operator-gated recovery / payment verification; T3 `DESIGN.md` rewrite; T4 PWA
+ offline stage queue + chime / vendor hours. One issue per session, PRD order.
⚠️ Parallel Codex agent works in worktree `zantap-codex-direction-a` (branch
`codex/direction-a-independent`, forked pre-ADR-0046, Direction-A-only) — owner
arbitrates any divergence; do not touch that worktree/branch.
The existing product, docs, design/brand assets, PWA readiness, security model,
payment flow, IA, and roadmap were audited without changing application code
(verification green: lint, tsc, build, 253 tests / 77 opt-in skipped). A
16-question owner interview on branch `product/restructure-audit` resolved every
launch-blocking ambiguity — recorded in ADR-0046 (supersedes ADR-0045's
provisional Direction A and open items). Final decisions: recruit Kigali
food-business partners in 90 days; free guided setup → commission long-term;
black-and-amber Z product-wide; landing = C structure + A cinematic hero; buy
`zantap.app`; operator-gated recovery; vendor payment-verification state; leads
→ Store/Postgres → ops inbox; rewrite `DESIGN.md` to codify the live system;
PWA = manifest + install + read-only shell + kitchen-stage-only offline queue
(server wins); vendor hours first; KDS chime for pilot; English-only i18n-ready;
ship order = brand+domain+funnel → trust hardening → PWA+hours → rest.
Tracking: `.scratch/product-architecture-audit/issue-01.md` and
`audit-2026-08-05.md`.

## Lead-generation funnel (prototype, 2026-07-30)

**✅ FINAL DIRECTION CHOSEN (C structure + A hero, ADR-0046) · NEXT = PRD.** A standalone,
throwaway HTML/CSS/JS prototype lives under
`.scratch/lead-funnel-prototype/`. It contains three structurally different
landing directions (`?variant=A|B|C`): cinematic restaurant film, editorial
product stage, and conversion-first founder offer. Revision 3 fully replaces
the previous structures. Real ZanTap screenshots are now art-directed only
inside realistic phone and kitchen-terminal hardware rather than screenshot
cards. Concept A uses a Higgsfield-generated Kigali still plus a five-second
subtle motion background; concept B adds restrained Three.js orbit detail; and
concept C keeps the free early-setup form prominent. Copy remains short,
Rwanda-first, and East-Africa-ready. Working in-memory lead capture feeds a
searchable dashboard with dynamic metrics and CSV export. Desktop and
sub-600px responsive compositions were visually inspected in the in-app
browser with no page overflow; form submission was re-verified end-to-end.
Screens exposing customer/driver phone numbers remain excluded. A detailed
copy/paste Higgsfield website-builder prompt is stored beside the prototype.
No production route, Store implementation, or database schema has been added.
ADR-0045 records the local-food-business audience; ADR-0046 finalizes the
direction (C conversion-first structure + A cinematic hero), offer (free guided
setup), CTA path (lead form → ops inbox), and canonical brand
(`public/brand/approved-z/` product-wide). Next: run the PRD/issues workflow,
then production implementation.
Tracking: `.scratch/lead-funnel-prototype/issue-01.md` and `NOTES.md`.

## Social account branding (operational, 2026-07-29)

**✅ AVATARS + BIOS + COVERS LIVE.** The approved circle-safe Logo-2 Z avatar and
the shared warm professional bio are live on Instagram `@zantapapp`, X `@ZanTapApp`, the ZanTap
Facebook Page, and TikTok `@zantapapp`. Option 3 Revision B (`Tap. Serve. Grow.` + 3D
order-to-kitchen signal path) is approved and live on Facebook and X. X uses `1500×500`; the final
Facebook `1500×556` file keeps that complete X artwork as one unchanged band and adds only narrow
top/bottom edge-row continuation to prevent Facebook's live horizontal crop. Both live profiles
were visually verified with no duplicate layer or omitted leaves. Tracking:
`.scratch/social-account-branding/issue-01.md` and
`.scratch/social-account-branding/issue-02.md`. This operational task does not change application
architecture and requires no ADR. **Open follow-up:** no dedicated ZanTap business email address is
documented as of 2026-07-31; create or confirm one before using email in the public lead funnel.

## Codebase hygiene refactor (2026-07-15)

**✅ DONE · merged · deployed · curl-smoked 2026-07-23** — `4f64b5f` on `main` →
`dpl_CSVEC8L2zu7nRqeQc4tN65PpHxCc` → alias `zantap-psi.vercel.app`.
Zero-behavior hygiene pass + README rewrite, ADR-0044:
- Dead code deleted: `GlassPanel` + `.glass-panel*`/`.glass-pill` CSS, `TabPlaceholder`,
  `advanceOrderStatus`, `addMenuImageByUrl`, `settings` icon, `resolveStorefrontOrigin`
  + `lib/vendor/storefront-url.ts` barrel (callers → `@/lib/base-url`).
- Tailwind: unused tokens removed (`display-mega/xl`, `nav-link`, `serif`, `on-dark`,
  `surface.dark*`, `4xl/5xl` radii, `section`/`xxs` spacing) + stale `pages/**` glob;
  `tsconfig` `allowJs:false`; `.env.example` `PROVISION_SECRET` note normalized.
- Dedup: `hydrateOrderHistoryFilters` (history-filters.ts), `formatKigaliDateTime` (format.ts).
- **`npm run lint` green again**: 22 react-hooks v6 errors fixed — "adjust state during
  render" for reset-on-open effects; targeted disables ONLY for client-only external
  state (localStorage/sessionStorage/URL/DOM measure/object-URL). 2 tsc errors in
  contract test fixed. Verified: lint 0/0, tsc clean, build clean, tests 253/77.
- Deferred (behavior risk): big-component splits, Select/Combobox merge, `formatRwf`
  in Metrics/Ops, `INGREDIENTS_UI_ENABLED` branch removal.
- README rewritten to match live architecture (Store seam, routes, MoMo, ops, env).
- Prod curl: `/inka-steakhouse` `/vendor/inka-steakhouse` `/onboard` → 200;
  `kds-dark` only on KDS + onboard.

## Recommended next (2026-07-10)

**Storefront immersive hero (#23)** — branch `feat/storefront-hero-editorial` (build green, not deployed).
Full-bleed cover hero replaces floating `Card`; glass logo/actions; vendor metadata on page surface.
ADR-0043. Next: deploy → visual prod smoke on `inka-steakhouse` (with/without cover).

## Recommended next (2026-07-07)

**Owner direction (2026-07-07):** new public domain TBD (not `zantap.ai`); customer
storefront #10 uses **ElevenLabs `DESIGN.md`** — no custom mockups (ADR-0041).
**#12 deferred** — ops/vendor auth unchanged (ADR-0040).

**Pick one (no code queued on `main`):**
- **Optional human smoke** — storefront customize sheet → add note → manual MoMo I've paid → KDS ticket (Playwright harness exists at `.scratch/candidate-21/prod-smoke.mjs` for reference)
- **Next backlog candidate** — all open items gated (#11 API blocked, #12/#13 deferred, #5 audited-deferred); await owner direction on new domain or live MoMo API

**Housekeeping ✅ done · deployed · curl-smoked 2026-07-07** — removed dead `zt` color block + unused `zt*` animations from `tailwind.config.ts` (ADR-0042, `8117fe5` → `dpl_6wacM85XfVdhDXYenhRmHyrYuLGg`); `zt-hidescroll` / confetti CSS utilities retained.

**Candidate #21 — Storefront customize slim-down + vendor profile edits + MoMo phone fix**
— ✅ **DONE · deployed · prod-smoked 2026-07-05** (`5ad7a92` → alias `zantap-psi.vercel.app`).
MoMo payout phone read-time + normalize-on-write (ADR-0034); customize modal images + notes only
(ADR-0035); notes cart → order → KDS (ADR-0036, migration `20260705140000_order_item_notes`);
KDS Setup business/payments/slug edit (ADR-0037). Hotfix `5ad7a92`: `canonicalizePhone` strips
double-zero national on Setup save. Playwright prod smoke **16/16 PASS**
(`.scratch/candidate-21/prod-smoke.mjs`): customize note → Pay → italic note on KDS ticket;
Setup business/payments save; USSD `*182*8*1*880001*`; slug rename + revert + collision block.
`npm test` 242/73; migration applied pre-deploy.

**Candidate #20 — Manual MTN MoMo USSD checkout** — ✅ **DONE · deployed · prod-smoked 2026-07-05**
(`712101d` → `dpl_8zVJC98E2oEs7Du8eHKx5sTta8C5` → alias `zantap-psi.vercel.app`).
Playwright smoke 9/9 PASS (`.scratch/manual-momo-ussd/prod-smoke.mjs`). Migration
`20260705120000_order_status_cancelled` applied; prod `inka-steakhouse` `momoCode` fixed
`INKA001` → `880001`. ADR-0033. `MOMO_MODE` unset in Production (= manual USSD).

**Mobile UX polish (owner screenshots) — ✅ DONE · deployed · prod-smoked 2026-07-05**
(`bac91e7` → included in `dpl_AwjU54mUH8ddzMTvgVPj7zeZ7R35` / alias `zantap-psi.vercel.app`).
Playwright mobile smoke **16/16 PASS** (`.scratch/mobile-ux-polish/prod-smoke.mjs`, 390×844):
TopBar `?from=kds` Back chip, Help modal scroll + collapsed accordions + not tucked under header (`y=42`),
menu edit description typing stable (owner-token recovery), edit modal stacking OK, Variation 3 list + Add item card.

Shipped items 1–10:
1. Storefront KDS preview back nav → integrated into `TopBar` (removed floating `BackToKdsChip`).
2. KDS `HelpModal` + all `Modal` panels → scrollable body, safe-area padding; help sections start collapsed.
3. `MenuItemModal` description focus jump → Modal autofocus only on open; form reset keyed on `item.id` not object reference.
4. Onboarding review → dish photo preview on Menu card (`useDishPhotoPreview`); Live step `?from=kds`; photo File persists menu → review → post-provision upload.
5. Localhost images → dev in-memory blob fallback (`lib/menu/local-blob-store.ts` + `/api/local-blob/[...path]`).
6. Modal primitive → golden touch-revealed drag handle, 90dvh cap, sticky `footer` prop, X close in title bar.
7. Menu tab → Variation 3 compact list + kebab (Edit/Duplicate/Toggle/Archive) + dashed "Add item" card.
8. Menu item edit modal → mockup redesign (preview card, N/60 counter, Status switch, collapsible Description, Soon rows).
9. Modal stacking fix → portals to `document.body` at `z-[70]` (escapes KDS `relative z-[1]` trap under sticky header).
10. Photos section → square thumb tiles + dashed "Add photo" tile; URL paste UI removed (action kept).

**Candidate #19 — KDS + Storefront polish batch** — ✅ **DONE · deployed · prod-smoked**
(`31c33c7` → `dpl_Aq8HQ3Hivdm3r1txwmKSLG2ygkUP` → alias `zantap-psi.vercel.app`).
Playwright smoke 15/15 PASS (`.scratch/kds-storefront-polish/prod-smoke.mjs`).
`NEXT_PUBLIC_BASE_URL=https://zantap.ai` set in Vercel Production.

**Candidate #9 — Vendor WhatsApp PAID notification** — ✅ **DONE · deployed · prod-smoked**
(`5f56269` → `dpl_EcGsGd4WNbRtgPKLUK9mcnaHMcK5` → `zantap-psi.vercel.app`). Playwright
smoke 8/8 PASS on prod (MoMo PIN `12345` → expand ticket → `wa.me/250788123456` + slip URL;
dispatch modal phoneless share unchanged).

All other open candidates are gated (#11/#12 grill, #13 probe, #5 deferred).

Housekeeping (non-blocking): delete merged branch `feat/onboarding-redesign` (local only —
no `origin/feat/onboarding-redesign`); rotate Supabase DB password per `AGENTS.md` Security
(human action → update `.env` + Vercel synced vars).

## Open production issues (read before touching the KDS)

- **Known issue 0001 — closed 2026-06-24.** Symptom B (reload crash) fixed via
  `reviveSnapshot` date revival in `useKdsLiveSnapshot.ts`; hard refresh `200` in
  candidate #6 prod smoke. Symptom A (wrong stream URL → "Vendor not found") is
  user error / generic 404 copy — **polished + deployed 2026-06-24** (`app/not-found.tsx` +
  `app/error.tsx` → DESIGN.md tokens; prod curl: wrong stream path → "Page not found").
  Full record: `docs/known-issues/0001-kds-page-couldnt-load-and-stream-url.md`.

## Session handoff protocol (agents: read this in EVERY candidate session)

Sessions are run one-at-a-time and kept token-light; a new session inherits only
what is on disk, never the previous chat. Therefore every session MUST end by:

1. **Persisting state to disk** (the source of truth across sessions):
   - tick the relevant issue file checkboxes and update its Status line;
   - update the status table in this file;
   - record any design decisions as an ADR under `docs/adr/` (git-tracked, so
     decisions survive across machines even though `.scratch/` does not).
2. **Printing the next session's prompt** — a single copy/paste-ready fenced
   code block that states: what was just completed, what comes next, and exactly
   which files the next agent should read. The user starts the next session by
   pasting it verbatim.

If a session ends without doing both, the handoff is incomplete.

## Status legend

- ✅ Done — shipped (committed/pushed/deployed)
- 📋 Queued — PRD + issues written, implementation not started
- ⏳ Backlog — identified, not started
- ◑ Partially superseded — some of its value already delivered by another candidate

## Overview

| # | Candidate | Review rating | Scope | Status | PRD |
|---|-----------|---------------|-------|--------|-----|
| 1 | Collapse the data layer behind a server-only seam | Strong | — | ✅ Done & deployed | `.scratch/data-layer-server-seam/PRD.md` |
| 2 | Deepen payments into a Payment module | Strong | server | ✅ Done | `.scratch/payment-module-idempotent-momo/PRD.md` |
| 3 | Extract a Checkout module from the Storefront UI | Worth exploring | in-process (client) | ✅ Done | `.scratch/checkout-module/PRD.md` |
| 4 | Give the KDS a real orders interface | Worth exploring | ports & adapters | ✅ Done | `.scratch/kds-live-push/PRD.md` |
| 5 | Make Prisma the type source; Zod at the seam | Speculative | — | ◑ Audited — deferred | `.scratch/prisma-type-source/PRD.md` |
| 6 | KDS Vendor Suite (menu, media, export, history, guides) | Strong | ports & adapters | ✅ Done & deployed · smoke complete | `.scratch/kds-vendor-suite/PRD.md` |
| 7 | KDS workflow optimization (kitchen stage, aging, bulk) | Strong | ports & adapters + KDS UI | ✅ Done & deployed · smoke complete | `.scratch/kds-workflow-optimization/PRD.md` |
| 8 | Storefront menu image carousel | Strong | customer UI only | ✅ Done · deployed · prod-smoked 2026-06-27 | `.scratch/storefront-image-carousel/PRD.md` |
| 9 | Vendor WhatsApp PAID notification | Worth exploring | KDS UI + lib/whatsapp | ✅ Done · deployed · prod-smoked 2026-07-02 | `.scratch/vendor-whatsapp-paid-notification/PRD.md` |
| 10 | Customer storefront → DESIGN.md | Strong | customer UI | ✅ Done · deployed · curl-smoked 2026-07-07 (`9473ccc` → `dpl_B9zuaxYf72mgJGPbJ4vXJ6LDAWZy` → alias `zantap-psi.vercel.app`) | `.scratch/customer-storefront-design/` |
| 11 | Live MTN MoMo integration | Strong | server + payments | ⏸ API blocked — interim **#20 manual USSD** ✅ deployed 2026-07-05 | — |
| 20 | Manual MTN MoMo USSD checkout (interim) | Strong | checkout + Store | ✅ Done · deployed · prod-smoked 2026-07-05 | `.scratch/manual-momo-ussd/issue-01-manual-ussd-checkout.md` |
| 12 | Vendor + operator authentication | Strong | server + KDS + `/ops` | ⏸ Grilled 2026-07-06 · **deferred** (ADR-0040) | `.scratch/vendor-authentication/grill-decisions.md` |
| 13 | Ops / security hardening | Worth exploring | docs + infra | ⏸ Probe — deferred | — |
| 14 | Storefront item customization modal (visual-only) | Owner request | customer UI only | ✅ Done · prod-smoked 2026-06-29 | `.scratch/storefront-customization-modal/PRD.md` |
| 15 | Vendor onboarding (~1 min go-live) | Strong | Store + KDS + provisioning | ✅ Done · deployed · prod-smoked 2026-06-30 | `.scratch/vendor-onboarding/PRD.md` |
| 16 | Onboarding redesign (dark, self-serve, owner token) | Owner request | Store + Prisma + onboarding + KDS Setup | ✅ DONE · deployed · prod-smoked 2026-07-02 (Playwright real-browser harness + human confirmation; `abc` vendor + profile fields verified in prod DB; organic vendor `lilys` self-served 2026-07-01; merged to `main` 2026-07-02) | `.scratch/onboarding-redesign/PRD.md` |
| 17 | ZanTap operator/admin panel (Control API + `/ops`) | Owner design | server + ops UI | ✅ Done · deployed · prod-smoked 2026-07-06 | `.scratch/operator-console/PRD.md` |
| 18 | Supabase pooler egress — KDS snapshot optimization | Strong | Store + KDS SSE | ✅ Done 2026-07-01 | `.scratch/pooler-egress-audit/issue-01-kds-snapshot-egress.md` |
| 19 | KDS + Storefront polish batch (recovery, dashboard, images, help, onboarding, storefront sync, domain) | Owner request | Store + KDS + onboarding + customer UI + config | ✅ Done · deployed · prod-smoked 2026-07-02 | `.scratch/kds-storefront-polish/PRD.md` |
| 21 | Storefront customize slim-down + vendor profile edits + MoMo phone fix | Owner request | customer modal + KDS Setup + MoMo USSD | ✅ Done · deployed · prod-smoked 2026-07-05 (`5ad7a92`) | `.scratch/candidate-21/PRD.md` |
| 22 | Storefront share + menu lightbox + KDS drivers | Owner request | customer UI + KDS drivers tab + Order.driverId | ✅ Done · deployed · prod-smoked 2026-07-06 | `.scratch/candidate-22/PRD.md` |

**#22 closed 2026-07-06** — code shipped `e734387` (live on `zantap-psi.vercel.app`
since #17 deploy); migration `20260705180000_order_driver_assignment` applied.
Playwright prod smoke **22/22 PASS** (`.scratch/candidate-22/prod-smoke.mjs`):
share URL, menu lightbox, Drivers CRUD, bulk assign (2 orders), single assign + Call
`tel:`, no WhatsApp in assign modal, setup drawer auto-open cap ≤2×. ADR-0038.

**#18 closed 2026-07-01** — revision-first SSE poll, scoped `listKdsOrders`, narrow includes, seed remote guard. ADR-0023.

**#19 in progress 2026-07-02** — owner punch-list, grilled via `/grill-with-docs`.
Decisions: `.scratch/kds-storefront-polish/grill-decisions.md`; PRD:
`.scratch/kds-storefront-polish/PRD.md`; 11 issues under
`.scratch/kds-storefront-polish/issues/`. **Issue 01 done:** `canonicalizePhone` +
`phonesMatchForRecovery` in `lib/format.ts`; `recoverOwnerToken` E.164 compare;
format-permutation tests; ADR-0029. **Issue 02 done:** `getYesterdayGross` Store verb;
Kigali-bounded `getTodayGross` fix; `yesterdayGross` on `KdsSnapshot`; `MetricsBanner`
Live/Off + real delta ("New" when yesterday = 0); ADR-0030. **Issue 03 done:**
storefront `Hero` renders `logoUrl`/`coverImageUrl`/`description` + `tel:` call button;
`DescriptionClamp` client component (2-line clamp, orange more/less, ≤300 chars).
**Issue 04 done:** `object-cover` `<img>` in fixed shells on storefront carousel +
KDS menu card; KDS wide banner → 72×72 square thumb (horizontal row, matches
storefront); gallery `object-center`; RSC refresh path unchanged (`getMenuItemGalleryUrls`).
**Issue 05 done:** `uploadBrandingImage` owner-token action → Vercel Blob `branding/`
folder → `updateVendor` logoUrl/coverImageUrl; SetupDrawer upload buttons + previews
(URL fallback kept); reuses `validateMenuImageFile` (JPEG/PNG/WebP, 5MB).
**Issue 06 done:** shared `Select` + `Combobox` primitives; History status/payment
filters; onboarding dial-code pickers; category type-or-pick in `QuickMenuStep` +
`MenuItemModal`; Orders Sort refactored to `Select variant="pill"`.
**Issue 07 done:** peek `?` FAB (`usePeekVisibility`, `bottom-24`); `HelpModal` with
6 accordion sections + WhatsApp ask-a-question to owner `250784928786`.
**Issue 08 done:** horizontal swipe date chips (`zt-hidescroll` + snap); non-custom
presets apply instantly via `onDatePresetApply` (custom range still draft→Apply);
receipt page wrapped in `.kds-dark` + `.kds-surface` with print white/ink override.
**Issue 10 done:** SetupDrawer "Preview storefront" → `/{slug}?from=kds` same tab;
`BackToKdsChip` on storefront when `from=kds` → `/vendor/{slug}?tab=setup`;
`SuccessReceipt` white-outline "Back to menu" below "Place another order" (both
`onReset`). `npm run build` + `npm test` 196/66 green.
**Issue 11 done:** `lib/base-url.ts` (`getBaseUrl`, `getDisplayHostPrefix`,
`getStorefrontUrl`, `formatStorefrontDisplayPath`); `storefront-url.ts` re-exports;
onboarding display copy + Help modal + OrderTicket WA notify routed through seam;
`.env.example` documents optional `NEXT_PUBLIC_BASE_URL`. ADR-0032.
`npm run build` + `npm test` 203/66 green.
**✅ DEPLOYED & prod-smoked 2026-07-02** — `31c33c7` → `dpl_Aq8HQ3Hivdm3r1txwmKSLG2ygkUP`
→ `zantap-psi.vercel.app` (redeploy with `NEXT_PUBLIC_BASE_URL=https://zantap.ai`).
Playwright smoke 15/15 PASS: E.164 recovery (`+250788123456` → inka), Live label +
real gross delta, help modal → `wa.me/250784928786` with `zantap.ai` storefront URL,
preview `?from=kds` + Back chip, success Back to menu, call button on Hero.
Harness: `.scratch/kds-storefront-polish/prod-smoke.mjs`.

**#14 closed 2026-06-29** — prod gesture smoke 11/11 PASS on `zantap-psi.vercel.app/inka-steakhouse` (375px).

Candidates **#1–#7** shipped. **#8** sliced 2026-06-24. **#9–#13** probed; gates noted.

## #15 · Vendor onboarding (~1 min go-live) — ✅ DONE · prod-smoked 2026-06-30

Rating: Strong · Scope: Store seam + `/onboard` wizard + KDS Setup extensions.

**Shipped 2026-06-30** — `7ca82ff` → `dpl_FzEoVe8J9KTcDqXfqp8KsWT4AR4q` → `zantap-psi.vercel.app`.
`PROVISION_SECRET` added to Vercel Production (Sensitive). **Prod acceptance** (`RUN_PROD_SMOKE=1`
`scripts/prod-onboard-acceptance.test.ts`): `/onboard` wizard enabled → `provisionVendor` +
first dish → storefront `200` → KDS `?tab=setup` → checklist `hasMenuItem` pre-checked → tagline
on `/{slug}` → MoMo sim PIN `12345` → PAID on KDS → export `403` without write secret.
157/157 unit tests green; `npm run build` before deploy.

**Inventory PRD 2026-06-30** — `.scratch/vendor-onboarding/PRD.md` (read-only product spec).
**Flow design 2026-06-30** — `.scratch/vendor-onboarding/FLOW.md`; ADR-0020.
**Issues sliced 2026-06-30** — four vertical cards:

| Issue | Status |
|-------|--------|
| `01-store-vendor-provision` | ✅ done 2026-06-30 |
| `02-provision-actions-and-guard` | ✅ done 2026-06-30 |
| `03-onboard-wizard-ui` | ✅ done 2026-06-30 |
| `04-kds-setup-profile-and-copy` | ✅ done 2026-06-30 |

**Provisioning seam:** `Store.createVendor` + `isSlugAvailable` + `updateVendor`; guarded
`provisionVendor` action with `PROVISION_SECRET` (mirrors write-secret until auth #12).
`updateVendorProfile` action (write-secret) for Layer B storefront profile in Setup.
**Two layers:** Layer A `/onboard` wizard (identity + first dish); Layer B existing KDS
checklist (photos, kitchen, order, dispatch) + storefront profile section.

- Flow: `.scratch/vendor-onboarding/FLOW.md`
- ADR: `docs/adr/0020-vendor-provisioning-store-create-vendor.md`, `docs/adr/0021-kds-setup-storefront-profile.md`
- Depends on: #1 Store ✅, #6 KDS Setup checklist ✅

---

## #16 · Onboarding redesign (dark, self-serve, owner token) — ✅ DONE · deployed · prod-smoked 2026-07-02

Rating: Owner request · Scope: Prisma + Store + onboarding UI + KDS Setup. Branch: `feat/onboarding-redesign`.

Replaces the candidate #15 UI with the redesigned **dark `.kds-dark`, mobile-first, self-serve**
onboarding from `design-assets/UI-screens/*` (7 surfaces: splash → business essentials → payments →
quick menu → review → go-live QR → optional checklist). Reuses #15's Store/provisioning seam.

**Grilled 2026-07-01** (`/grill-with-docs`) — 8 decisions in `.scratch/onboarding-redesign/grill-decisions.md`.
Key calls: new branch (not new repo); replace `/onboard` in place; **drop the provision gate → open
self-serve** (PROVISION_SECRET kept as optional kill-switch + rate limit); dark theme; `payoutMethod`
preference enum; first-dish photo uploaded post-provision; **retire shared write-secret → per-vendor
owner token** (supersedes ADR-0009). Launch "cap-off" features parked pending owner direction.

**Never-locked-out recovery (decision 9):** phone-based (`recoverOwnerToken(slug, phone)`) re-issues
the token immediately and non-halting; logs a **recovery event** for the future admin panel (#17). No
OTP. **No backfill (decision 10):** no public vendors exist — the migration resets the personal test vendor.

New Vendor fields: `businessCategory`, `payoutMethod`, `logoUrl`, `coverImageUrl`, `description`,
`ownerTokenHash` + a `VendorRecoveryEvent` log. Checklist wires into the existing KDS Setup drawer;
hours/delivery-zones/prep-time/social deferred.

- PRD: `.scratch/onboarding-redesign/PRD.md`
- Grill: `.scratch/onboarding-redesign/grill-decisions.md`
- ADR: `docs/adr/0022-self-serve-onboarding-and-owner-token.md`
- Depends on: #15 provisioning ✅, #6 KDS Setup ✅, #1 Store ✅; ADR-0017 dark theme ✅
- Feeds: #17 admin panel (recovery-event seam).

**Sliced into 4 issues 2026-07-01** (`.scratch/onboarding-redesign/issues/`): 01 schema+Store+owner
token, 02 server actions + owner-token guard swap + recovery, 03 wizard UI (dark, 7 surfaces),
04 post-launch checklist.

**Issue 1 done 2026-07-01** (data layer only): `Vendor` gains `businessCategory`, `payoutMethod`
(real enum `PayoutMethod`, default `MERCHANT_CODE`), `logoUrl`, `coverImageUrl`, `description`,
`ownerTokenHash` (server-only, off the domain type); new `VendorRecoveryEvent` table + Store verbs
(`getVendorOwnerTokenHash`, `setVendorOwnerToken`, `recordRecoveryEvent`, `listRecoveryEvents`);
owner-token helper (`lib/vendor/owner-token.ts` — mint/hash/verify). Migration
`20260701150531_onboarding_redesign_vendor_fields` applied; demo vendor re-seeded with a fresh
deterministic owner token (`DEMO_OWNER_TOKEN`). Both adapters + contract tests green; `npm run build`
clean. Remote `#prisma` suite opt-in and stalled on Supabase Free pooler (schema push OK) — parity
proven via the shared in-memory contract.

**Issue 2 done 2026-07-01** (server surface, no wizard redesign): `provisionVendor` is gate-free
(dropped the required secret; optional `PROVISION_KILL_SWITCH` env brake + 10/60s rate limit),
accepts `businessCategory`/`payoutMethod`, mints the owner token and returns the plaintext once.
New `recoverOwnerToken(slug, phone)` — non-halting phone recovery that re-issues the token + logs a
recovery event (5/60s per slug, generic miss). Owner-token guard (`lib/vendor/owner-token-guard.ts`,
slug-bound) replaces `assertWriteSecret` across `vendor-menu`, media upload, `updateVendorProfile`,
and the export route (`x-vendor-owner-token`). New `lib/vendor/{rate-limit,provision-gate,useOwnerToken}.ts`;
KDS components moved onto `useOwnerToken` (cache by slug, never prompt). Deleted `write-secret.ts`,
`provision-secret.ts`, `useWriteSecret.ts`, `WriteSecretPrompt.tsx` (+ their tests). `npm run build`
clean; `npm test` 174 passed / 64 skipped. ADR-0024.

**Issue 3 done 2026-07-01** (dark wizard UI, 7 surfaces): `/onboard` rebuilt as the `.kds-dark`,
mobile-first self-serve wizard (`OnboardWizard` step machine + `WizardProgress` + `components/onboard/steps/*`):
splash (role wheel) → business essentials (live slug availability, country picker, `businessCategory`) →
payments (`payoutMethod` radio) → quick menu (first dish + category + optional photo + live preview) →
review (editable cards) → You're Live (CSS confetti, storefront URL + copy, QR via `qrcode.react`,
Share/Copy, Open Kitchen Dashboard). **Page gate removed** — `app/onboard/page.tsx` renders the wizard
unconditionally; signup closable only via `PROVISION_KILL_SWITCH` (`PROVISION_SECRET` now has no code
path). Deleted `GateStep`, `OperatorContact`, `is-provision-enabled.ts`, `useProvisionSecret.ts`,
`FirstDishStep`, `SuccessStep`. On Go Live: `cacheOwnerToken`, then category + optional photo persisted
**post-provision** via existing `updateMenuItem`/`uploadMenuImage` (decision 7 — no server change).
**Recovery UI** — `RecoverAccessDialog` (slug + signup phone → `recoverOwnerToken`, auto-caches) from
the splash + deep link `/onboard?recover=1`; the interim manual owner-token paste field in `SetupDrawer`
is removed (lock chip + Recover link). `npm run build` clean; `npm test` 174 passed / 64 skipped.
ADR-0025.

**Issue 4 done 2026-07-01** (post-launch optional checklist — the mockup's "keep improving your
storefront" screen wired into the KDS Setup drawer): new pure module
`lib/vendor/optional-checklist.ts` (`OPTIONAL_CHECKLIST_ITEMS` 9 rows + `deriveOptionalChecklist` +
`countOptionalCompleted`); `SetupDrawer` gains the checklist section ("X of 4 completed" — actionable
rows only, the 5 deferred rows show a "Soon" badge) plus Logo URL / Cover image URL inputs + a
Business Description textarea in the profile editor; `updateVendorProfile` forwards
`logoUrl`/`coverImageUrl`/`description` (fields already in the schema since Issue 1); `KdsDashboard`
seeds those from the vendor + passes `menu` to `SetupDrawer`; owner-token guarded via
`useOwnerToken` (never prompts). Actionable = Logo, Cover, Menu Photos, Description; deferred
`comingSoon` (no schema/editor) = Business Hours, Ingredients, Delivery Zones, Estimated Prep Time,
Social Links. No new schema/migration, no Blob action, no wizard/server-signature change. 6 new unit
tests; `npm run build` clean; `npm test` **180 passed / 64 skipped**. ADR-0026. **Candidate #16 is now
feature-complete** — all 4 issues done on `feat/onboarding-redesign`; next step is the
build → deploy → prod smoke pass (prod cutover: remove `PROVISION_SECRET` from Vercel, leave
`PROVISION_KILL_SWITCH` unset, `VENDOR_WRITE_SECRET` already dead).

**Brand + KDS polish shipped 2026-07-01** (branch `feat/onboarding-redesign`, ADR-0027, two prod
deploys): (1) `09943b0` → `dpl_3LK5RHZdDKLdfU6wBe3YWf15v8Ga` — real ZanTap logo + illustrated role
icons on the splash, "You're Live" hero, and KDS `MetricsBanner`; round transparent favicon
(`app/favicon.ico`/`icon.png`/`apple-icon.png`); assets alpha-trimmed + downscaled into
`public/brand/` (source art was ~14–19% opaque → first render was tiny). (2) `aa9d1d1` →
`dpl_GBVsWAaQXukhbsVengzHFo9hbFF5` (current live alias) — `.kds-surface` = darker `#0b0b0d` + subtle
SVG `feTurbulence` film grain (scoped to KDS, not onboarding); SSE "Reconnecting…" reduced to a
compact centered chip with a spinning loader ring. Build + lint green; prod curl `200`; assets +
`kds-surface` confirmed live.

**✅ Prod smoke PASSED 2026-07-02 — #16 CLOSED.** Real-browser Playwright harness
(`.scratch/onboarding-redesign/prod-two-tab-smoke.mjs`, screenshots in `smoke-shots/`) on
`zantap-psi.vercel.app`: wizard → Go Live provisioned vendor `abc` on the PROD DB (row +
`businessCategory`/`payoutMethod`/owner-token hash verified via Supabase MCP), owner token
auto-cached (no secret typed), brand logo + 5 role icons + dark root paint, `.kds-surface` grain,
optional checklist "0 of 4" + 5 "Soon" badges, device-unlocked chip, profile save without prompt
(Logo/Cover/Description persisted — verified in DB). Human completed + confirmed the remaining
interactive steps (MoMo PIN `12345` → PAID on KDS; recovery re-issue). Bonus signal: organic
vendor `lilys` self-served through the live wizard 2026-07-01 with a real dispatched order.
Merged `feat/onboarding-redesign` → `main` (fast-forward) and pushed 2026-07-02; the push
auto-triggered a Vercel prod deploy of the identical code (`dpl_5dzRyX7KCz9GrmfKoW8P4fuEwPqX`),
which now holds alias `zantap-psi.vercel.app` — no behavior change; post-merge curl smoke 200.

---

## #17 · ZanTap operator console — ✅ DONE · deployed · prod-smoked 2026-07-06

Grilled 2026-07-06 — decisions in `.scratch/operator-console/grill-decisions.md`.
Control API at `/api/operator/v1/*`, Ops UI at `/ops` (ElevenLabs light, desktop + mobile).
Extractable client in `lib/operator-client/`. ADR-0039.

**Shipped:** Store operator verbs, halting (suspended storefront, blocked checkout),
vendor directory, recovery inbox, vendor detail tabs (profile/menu/orders/audit),
token revoke/reissue, operator audit log. Tests 253/330; `npm run build` clean.

**Deployed 2026-07-06** (`0c44d41` → `dpl_8R8L4Mq42qvT1rTVSXoTwv4oqhLm` → alias
`zantap-psi.vercel.app`): migration `20260706180000_operator_console` applied;
Production env `OPERATOR_API_KEY`, `OPERATOR_UI_SECRET`, `ZANTAP_OPERATOR_API_URL`
(same-origin alias — required because `NEXT_PUBLIC_BASE_URL=zantap.ai` is unmapped
and per-deployment `VERCEL_URL` is SSO-gated). Playwright prod smoke **4/4 PASS**
(`.scratch/operator-console/prod-smoke.mjs`, 1280×800 + 390×844): login → vendors →
recovery inbox. Halting curl smoke: suspend `inka-steakhouse` → suspended storefront +
KDS banner → reactivate → storefront restored.

- PRD: `.scratch/operator-console/PRD.md`
- ADR: `docs/adr/0039-operator-console-and-halting-controls.md`
- Extraction: `.scratch/operator-console/EXTRACTION.md`

---

## #1 · Collapse the data layer behind a server-only seam — ✅ DONE

The foundational slice. One server-only `Store` interface with two adapters
(in-memory + Prisma/Postgres), chosen by a factory on `DATABASE_URL`. Shipped
across three issues (Store seam, Prisma adapter+migration+seed, factory +
dual-adapter contract suite), verified 34/34 tests green against Supabase, and
deployed to production (`DATABASE_URL`/`DIRECT_URL` set in Vercel Production).

Everything below assumes this single-writer foundation.

---

## #2 · Deepen payments into a Payment module — ✅ DONE

Persist `Payment` rows and make MoMo confirmation an idempotent state machine
behind the Store, killing the module-scoped `pendingTransactions` Map in
`lib/momo/simulate.ts` (the same realm/serverless split-brain #1 fixed, but for
money). PRD + 3 issues written. **Grilled 2026-06-22** — decisions in
`docs/adr/0001-payment-module-idempotent-momo.md`. **Issue 01 shipped 2026-06-22**
(Store payment verbs + in-memory adapter + payment contract suite).
**Issue 02 shipped 2026-06-22** (Prisma adapter payment verbs + transactional
confirm + payment contract on disposable DB + cross-instance durability test).
**Issue 03 shipped 2026-06-22** (rewired `lib/momo/simulate.ts` through Store,
deleted `pendingTransactions` Map, added simulate integration tests — 53/53
tests green).

- PRD: `.scratch/payment-module-idempotent-momo/PRD.md`
- Issues: `01-payment-in-store-idempotent-transition`,
  `02-payment-prisma-adapter`, `03-wire-momo-through-store-remove-map`
- Recommended before any new payment-touching feature (live correctness bug).

---

## #3 · Extract a Checkout module from the Storefront UI — ✅ DONE

Rating: Worth exploring · Scope: in-process (client-side refactor).

**Issue 01 shipped 2026-06-22** — `lib/checkout/` pure domain (validation + totals +
14 unit tests); `canProceedToPay` removed from `CheckoutSheet`; `CONTEXT.md`
adds Checkout term. 67/67 tests green.

**Issue 02 shipped 2026-06-22** — stage machine (`stages.ts`), injectable MoMo client
(`momo-client.ts`), orchestration helpers (`orchestration.ts`), `useCheckout` hook;
17 new unit tests (stages + orchestration). 84/84 tests green.

**Issue 03 shipped 2026-06-22** — slimmed `CartContext` to cart-only (`cart`,
`addItem`, `removeItem`, `resetCart`); `StorefrontInner` wires UI through
`useCheckout(vendor, menu)`; deleted inline `handlePay` / `handleConfirmPin`;
`sectorOpen` is local UI state in Storefront. 84/84 tests green. Manual dev smoke
(menu → cart → MoMo → success → reset) recommended before commit.

- PRD: `.scratch/checkout-module/PRD.md`
- Issues: `01-checkout-pure-domain`, `02-checkout-orchestration-hook`,
  `03-wire-storefront-slim-cart`

---

## #4 · Give the KDS a real orders interface — ✅ DONE

Rating: Worth exploring · Scope: ports & adapters.

**Shipped 2026-06-22** — replaced client 5s polling with SSE live push. Server
reads through `fetchKdsSnapshot` (Store seam); fingerprint skips redundant
frames; `useKdsLiveSnapshot` hook in `KdsDashboard`. ADR-0002. 88/88 tests
green. Manual smoke: customer checkout in one tab → PAID order on KDS within ~1s.

**Production-hardened 2026-06-23** — the long-lived SSE route was killed at
Vercel's ~300s max duration, flooding logs with "Vercel Runtime Timeout Error:
Task timed out" (known-issue 0002 Symptom C). Fixed transport-only: the route
self-closes at `MAX_STREAM_MS = 250_000` via one idempotent `teardown()` with
`export const maxDuration = 300`, and `useKdsLiveSnapshot` now owns reconnect
with exponential backoff (1s→15s, reset on `onopen`). Deployed to prod
2026-06-23 (`dpl_CcKFimVQaQg87wc9rQmhSdkF48S1`). Verified: prod SSE returns the
correct PAID-gated snapshot; held connections self-close cleanly (curl exit 0,
no kill); CLI runtime logs show only `200`/`info` on `kds-stream`, zero "Task
timed out". ADR-0004. Candidate #4 is now closed out (feature + prod hardening).

- PRD: `.scratch/kds-live-push/PRD.md`
- Issues: `01-sse-stream-replace-polling`
- ADRs: `docs/adr/0002-kds-live-push-sse.md`, `docs/adr/0004-kds-sse-self-close-and-reconnect-backoff.md`
- Known issue: `docs/known-issues/0002` (Symptom C)

---

## #5 · Make Prisma the type source; Zod at the seam — ◑ AUDITED (deferred)

Rating: Speculative.

Replace the hand-written domain types in `lib/types.ts` with Prisma-generated
types, and validate data crossing the Store seam (and API boundaries) with Zod
DTOs. Removes the dual maintenance of `lib/types.ts` vs. `prisma/schema.prisma`.

**Audit 2026-06-22** — drift is real but latent (enums duplicated but in sync;
entity omissions like `kitchenOpen` / `updatedAt` are intentional domain shaping;
no production bugs). **Implementation deferred** until a PRD trigger fires.
ADR-0003. Issue 01 queued (enums + Zod on `CreateOrderInput`).

- Audit: `.scratch/prisma-type-source/AUDIT.md`
- PRD: `.scratch/prisma-type-source/PRD.md`
- Issues: `01-enum-source-zod-create-order` (blocked on trigger)
- ADR: `docs/adr/0003-prisma-type-source-audit.md`

---

## #6 · KDS Vendor Suite — ✅ DONE (Issue 05 shipped)

Rating: Strong · Scope: ports & adapters + vendor UI.

Five vendor-facing capabilities on the ElevenLabs editorial design system:
menu CRUD (soft-delete), Vercel Blob media gallery, order History filters,
CSV/XLSX + print receipt export, and data-derived onboarding guides. Foundation
first: Issue 0 wires `DESIGN.md` → Tailwind + primitive kit before features.

**Grilled 2026-06-23** — decisions in
`.scratch/kds-vendor-suite/grill-decisions.md`. **PRD written 2026-06-23**.
**Issues sliced 2026-06-23** — six vertically isolated cards (00–05) under
`.scratch/kds-vendor-suite/issues/`.

**Issue 00 shipped 2026-06-23** — `DESIGN.md` tokens in `tailwind.config.ts`
(canvas/ink/hairline/gradient/surface/semantic + type scale + spacing/radius);
Inter (`--font-body`) + Instrument Serif (`--font-display`) in `app/layout.tsx`;
primitive kit at `components/ui/primitives/` (Button, Input, Card, Modal, Badge,
GradientOrbs); four-tab KDS nav shell with History/Setup placeholders using
primitives; legacy `zt-*`/`zk-*` marked deprecated. `npm run build` + 88/88 tests
green.

**Issue 01 shipped 2026-06-23** — `archivedAt` migration + Store CRUD
(create/update/archive/restore/renameCategory, getArchivedMenu/getMenuItem);
guarded `lib/actions/vendor-menu.ts` + `VENDOR_WRITE_SECRET` / `useWriteSecret`;
Menu tab (`MenuSection`, `MenuItemModal`) replaces `InventoryGrid` with
primitive-kit UI (create/edit, archive/restore, category typeahead, availability
toggle unchanged). 102/102 tests green; `npm run build` passes. ADR-0006,
ADR-0009.

**Issue 02 shipped 2026-06-23** — `MenuImage` migration + data backfill from
`imageUrl`; Store image verbs (`addMenuImage`, `uploadMenuImageBlob`,
`reorderMenuImages`, `setPrimaryMenuImage`, `removeMenuImage`) on both adapters;
guarded upload/URL/reorder/primary/remove actions; `MenuImageGallery` in edit
modal; `getPrimaryImageUrl` on KDS Menu cards + storefront `MenuItemCard`;
`@vercel/blob` + `BLOB_READ_WRITE_TOKEN`. In-memory contract 32/32 green;
`npm run build` passes. ADR-0007, ADR-0008.

**Issue 04 shipped 2026-06-23** — printable branded receipt at
`/vendor/[slug]/receipt/[orderId]` (`PrintReceiptButton`, `@media print` CSS);
guarded `GET /api/vendor/[slug]/export` (CSV + XLSX via `exceljs`, reuses
`listOrdersFiltered` for all matching rows, `EXPORT_MAX_ROWS = 10_000`);
`lib/vendor/export-orders.ts` + 9 unit tests; History export buttons + per-row
Receipt link; `getPaymentForOrder` on Store for MoMo ref. `npm run build`
passes. ADR-0011.

**Issue 05 shipped 2026-06-23** — `SetupDrawer` with data-derived checklist
(`lib/vendor/onboarding.ts`, `loadOnboardingState` action); dismissible
`Coachmark` tooltips (`zantap:kds-coachmark-*` localStorage); persistent `?` FAB;
write-secret row in drawer; coachmark targets on kitchen toggle, Menu "+", dispatch
button. 5 onboarding unit tests; `npm run build` passes. ADR-0012. **Candidate #6
batch complete.**

**Prod smoke complete 2026-06-24** — human walkthrough on `zantap-psi.vercel.app`
(all steps 0–7 PASS). Latest deploy alias: `zantap-psi.vercel.app`.
- ✅ `VENDOR_WRITE_SECRET` + `BLOB_READ_WRITE_TOKEN` in Vercel Production (Sensitive).
- ✅ Export API `403` without secret → `200` with header (browser CSV confirmed).
- ✅ KDS shell, Setup checklist (4/5 — dispatch pending), coachmarks, menu CRUD + Blob image,
  History filters + CSV + receipt `200`, live PAID order on SSE, hard refresh `200` (known-issue 0001).
- ✅ **Receipt Back polish deployed 2026-06-24** (`8b34a2f` → `zantap-psi.vercel.app`):
  same-tab receipt links from History, `ReceiptBackButton` on receipt page,
  `?tab=history` deep link restores History tab. Prod curl smoke: KDS `?tab=history`
  `200` (History active), receipt `200` (Back button present), no `target="_blank"`.

- PRD: `.scratch/kds-vendor-suite/PRD.md`
- Grill: `.scratch/kds-vendor-suite/grill-decisions.md`
- Issues: `00-design-system-foundation` ✅ → `01-menu-crud-store-and-ui` ✅ → `02-menu-media-gallery` ✅ → `03-order-history-filters` ✅ → `04-order-export` ✅ → `05-vendor-onboarding-guides` ✅
- ADRs: `docs/adr/0006-menu-soft-delete-archived-at.md`, `docs/adr/0007-vercel-blob-menu-media.md`, `docs/adr/0008-menu-image-gallery-model.md`, `docs/adr/0009-deferred-auth-write-secret.md`, `docs/adr/0010-order-history-filter-semantics.md`, `docs/adr/0011-order-export-guard-and-row-cap.md`, `docs/adr/0012-onboarding-data-derived-checklist.md`
- Depends on: #1 Store seam ✅, #2 Payment ✅, ADR-0005 design system ✅

---

## #7 · KDS workflow optimization — ✅ DONE (prod smoke complete)

Rating: Strong · Scope: Store seam + KDS Orders tab UI (no visual redesign).

Kitchen operations upgrade: orthogonal `kitchenStage` + `paidAt`, human-readable
aging/urgency, workflow-first queue sort, bulk forward stage updates, expanded
ticket data, polished empty/degraded states. Preserves dark KDS aesthetic and SSE
live push.

**Grilled 2026-06-24** — decisions in
`.scratch/kds-workflow-optimization/grill-decisions.md`, ADR-0013.
**PRD + issues sliced 2026-06-24** — `.scratch/kds-workflow-optimization/`.
**Issue 01 shipped 2026-06-24** — schema/migration/backfill + Store adapters +
contract tests (`lib/kds/kitchen-stage.ts`, migration `20260624120000_order_kitchen_stage`).
**Issue 02 shipped 2026-06-24** — `advanceKitchenStage` / `bulkAdvanceKitchenStage`
in `lib/actions/vendor.ts`; `KitchenStageTransitionError`; ADR-0014; build green.
**Issue 03 shipped 2026-06-24** — KDS workflow UI: `formatRelativeTime` + urgency
tiers, `sortKdsQueueOrders`, kitchen stage badges, stage chips, bulk bar,
empty/degraded states, dispatch wired to `advanceKitchenStage(…, OUT_FOR_DELIVERY)`;
`npm run build` green.
**Prod smoke complete 2026-06-24** — automated walkthrough on `zantap-psi.vercel.app`
(`88fc62e` → `dpl_2xXFXgkvEfcT7umtg8YicR2NtHNp`):
- ✅ Deploy + migration already applied; KDS/SSE `200`, `kitchenStage` in stream payload.
- ✅ NEW badge dominant + PAID secondary; relative time (`Yesterday`, `2 days ago`, `3 hrs ago`).
- ✅ Stage chips: #0485 NEW → ACCEPTED → PREPARING → READY.
- ✅ Dispatch modal (Copy + WhatsApp share) → OUT FOR DELIVERY (SSE `DISPATCHED`).
- ✅ Mark completed → COMPLETED badge on #0485.
- ✅ Bulk select #0779 + #7636 → Mark Preparing (both PREPARING).
- ✅ Customer order placed (Smash Burger, MoMo PIN 12345) appeared as #5042 on KDS.

- PRD: `.scratch/kds-workflow-optimization/PRD.md`
- Grill: `.scratch/kds-workflow-optimization/grill-decisions.md`
- Issues: `01-schema-and-store` ✅ → `02-server-actions` ✅ → `03-kds-ui` ✅
- ADRs: `docs/adr/0013-kds-kitchen-stage-orthogonal-to-order-status.md`, `docs/adr/0014-kitchen-stage-server-actions.md`
- Depends on: #1 Store ✅, #2 Payment ✅, #4 KDS SSE ✅

---

## Post-backlog (2026-06-24)

| Slice | Status | Tracker |
|-------|--------|---------|
| KDS Orders tab → DESIGN.md | ✅ Done · committed `199048e` · deployed `dpl_G4kS89FBo71KhZLn43hvuSGZD4Wg` → `zantap-psi.vercel.app` 2026-06-24 | `.scratch/kds-orders-design-migration/issue-01-orders-tab-tokens.md` |
| Delivery slip page → DESIGN.md | ✅ Done · committed `b08a3ca` · deployed `dpl_2p7RSEAgq5WbQevuuaJokFpL6uDL` → `zantap-psi.vercel.app` 2026-06-24 | `.scratch/kds-orders-design-migration/issue-02-delivery-slip-tokens.md` |
| Remove dead `zk-*` Tailwind palette | ✅ Done · committed `4553388` · deployed `dpl_8Q52wTnGTXU57RB7yiEDLc9jX3BU` → `zantap-psi.vercel.app` 2026-06-24 | ADR-0016 consequences |
| Customer storefront redesign | ✅ Done · deployed · curl-smoked 2026-07-07 (`9473ccc` → `dpl_B9zuaxYf72mgJGPbJ4vXJ6LDAWZy`) | ElevenLabs `DESIGN.md`; all customer palette `zt-*` migrated; only `zt-hidescroll` utility remains (ADR-0041) |
| Remove dead `zt-*` Tailwind palette | ✅ Done · deployed · curl-smoked 2026-07-07 (`8117fe5` → `dpl_6wacM85XfVdhDXYenhRmHyrYuLGg`) | ADR-0042 — `zt` color block + `zt*` animations removed from `tailwind.config.ts` |
| `/to-prd` post-backlog probe | ✅ Done 2026-06-24 | Candidate #8 PRD + issue; #9–#13 probe table below |
| KDS dark operational theme restore | ✅ Done · committed `4440d2d` · deployed `dpl_6VfQnfy66KGdoJxYNbourWgvJBoD` → `zantap-psi.vercel.app` · prod-smoked 2026-06-27 | `.scratch/kds-dark-identity-restore/grill-decisions.md`, ADR-0017 |

---

## #8 · Storefront menu image carousel — ✅ DONE

Rating: Strong · Scope: customer UI only (no Store/schema).

Swipeable multi-image thumb on `MenuItemCard` when `images.length >= 2`.
Follow-up from vendor-suite Issue 02 / ADR-0008. **Keeps `zt-*` blush-glass** —
not the DESIGN.md customer migration.

- PRD: `.scratch/storefront-image-carousel/PRD.md`
- Issues: `01-menu-card-carousel` ✅
- ADR: `docs/adr/0018-storefront-menu-image-carousel.md`
- Depends on: MenuImage gallery ✅, Store hydrates `images` ✅
- Shipped 2026-06-27: `b243c81` → `dpl_fKu6ie9FfMy552GTYBCwkAYuJy7c` → `zantap-psi.vercel.app`. `getMenuItemGalleryUrls`, `MenuItemImageCarousel` (scroll-snap + dots), `MenuItemCard` wire-up, 5 unit tests; build green; prod curl PASS (bundle has carousel; prod DB has 0 multi-image items — swipe needs KDS upload).

---

## #14 · Storefront item customization modal (visual-only) — ✅ DONE · PROD-SMOKED

Rating: Owner request · Scope: customer UI only (no Store/schema/order pipeline).

Tap a `MenuItemCard` body → premium glassmorphic bottom sheet (hero carousel +
included/add-on customization + notes + live summary + sticky "Add to Order").
`+` stays pure quick-add. **Visual-only**: modifiers/notes are display-only and do
NOT reach cart/Order/KDS/receipt this slice — a future "real modifiers" epic
(separate `/grill-with-docs`) makes them persisted + server-priced. Keeps `zt-*`
blush-glass (not DESIGN.md migration). Optional `MenuItem.customization?` field is
the forward-compatible seam.

**Grilled 2026-06-27** (six decisions). PRD + issue written. **Issue 01 implemented
2026-06-27** — `npm test` 187/187 + `npm run build` green; storefront dev curl HTTP 200.
**Shipped 2026-06-28** — committed `9479cd7` (`feat(storefront): item customization
modal (visual-only)`), pushed to `main`, deployed to prod
`dpl_DRzpEfNQD8RpkkX3RoM7JEtZJR1k` → `zantap-psi.vercel.app`. **Mockup layout
refactor 2026-06-28** — committed `d328c8a` (square header image + Photos thumb
strip + notes retained), deployed `dpl_DJMPCwAAE8ecdwFYbCdkdva93uvS` →
`zantap-psi.vercel.app`. **Stepper polish 2026-06-28** — committed `764e916`
(compact qty pill repositioned right via `ml-auto`, top handle spacing), deployed
`dpl_2gR9gDbnH1oic5qzz5qqjTYzrPDx` → `zantap-psi.vercel.app`.

**Prod gesture smoke complete 2026-06-29** — automated Playwright harness at 375px
on `zantap-psi.vercel.app/inka-steakhouse` (11/11 PASS): card tap → sheet; `+`
quick-add without opening; compact stepper `ml-auto` aligned with Ingredients panel
(Δright 17px); add-on + qty live display total; notes; Photos strip on multi-image
item; drag-down dismiss; Add to Order adds N base items; sticky cart total = base
prices only (ADR-0019 known gap). Harness:
`.scratch/storefront-customization-modal/prod-gesture-smoke.mjs`.

What shipped (Issue 01):
- `lib/menu/customization.ts` (server-safe — no `"use client"`/React/DOM): persistence-
  shaped `IngredientOption` / `AddOnOption` / `ItemCustomization` /
  `CustomizationSelection` (stable string ids + integer RWF prices, `icon` = Icon-name
  string), `resolveCustomization` (item field or generic fallback), `emptySelection`,
  pure `computeCustomizeTotal((base + Σ addOn.priceRwf×qty) × qty)`, `CUSTOMIZATION_NOTES_MAX`.
- `lib/types.ts`: optional `MenuItem.customization?: ItemCustomization` (type-only import;
  no runtime cycle).
- `lib/menu/__tests__/customization.test.ts`: 10 tests (resolve/fallback, emptySelection,
  total with add-ons/qty/removals/unknown-id/fallback pricing).
- `MenuItemImageCarousel.tsx`: generalized to a size-agnostic core (`variant` thumb 72×72 /
  header 88×88 / hero full-width; slides `h-full w-full`); `indicator` `dots`|`count`;
  scroll-snap + `ResizeObserver` preserved; 0/1/≥2 handled.
- `MenuItemCustomizeSheet.tsx` (`"use client"`): glassmorphic bottom sheet (fixed inset-0
  z-[60], blur scrim, translate-y, tap-scrim/X close), header (name/desc/base price/`− qty +`
  from 1), hero carousel (count badge), Included remove-toggles, Add-on toggles updating live
  total, capped notes textarea, live summary card, sticky `Add to order • <total>`; native
  Pointer-Event drag-to-dismiss (threshold/flick → close, else CSS spring-back). Emits ONE
  `CustomizationSelection` to `onAddToOrder`.
- `MenuItemCard.tsx`: card-body tap → `onOpen(item)` (role/tabindex/Enter-Space a11y); `+`
  keeps quick-add via `e.stopPropagation()`. `GlassPanel` now forwards `HTMLAttributes`.
- `Storefront.tsx`: `activeItemId` state; one `MenuItemCustomizeSheet`; single
  `handleAddToOrder(selection)` adapter (`for … addItem(menuItemId)` then close) — the only
  cart chokepoint. Storefront stays mounted/dimmed behind the scrim.

Known gap (per ADR-0019): add-ons/removals/notes are display-only — they do NOT reach
the cart/Order/KDS/receipt. Checkout total = base prices × qty. Closed by a future
"real modifiers" epic (separate `/grill-with-docs`).

Deviation from mockup: header thumbnail + separate "Photos" strip consolidated into the
single full-width hero carousel the spec mandates (count badge) — avoids two redundant
carousels of the same images. Trivially splittable if the owner wants the exact layout.

- PRD: `.scratch/storefront-customization-modal/PRD.md`
- Issues: `01-customization-modal` ✅ closed (prod-smoked 2026-06-29)
- ADR: `docs/adr/0019-storefront-item-customization-modal.md`
- Depends on: #8 carousel ✅ (`getMenuItemGalleryUrls`, `MenuItemImageCarousel`),
  `CartContext.addItem` ✅

---

## #9 · Vendor WhatsApp PAID notification — ✅ DONE · deployed · prod-smoked 2026-07-02

Rating: Worth exploring · Scope: KDS UI + `lib/whatsapp` (no Store/schema).

Proactive vendor alert when MoMo payment completes. Stub `buildVendorOrderNotification`
exists but is unused; dispatch modal already shares a **driver delivery slip** via
phoneless `wa.me/?text=…` at dispatch time — different moment, different audience.

**Owner locked 2026-06-29 — Option A:** KDS staff tap **"Notify vendor on WhatsApp"**
on expanded PAID ticket (stages before `OUT_FOR_DELIVERY`). Opens
`wa.me/{Vendor.phoneNumber}?text=` with PAID notification + `/slip/{orderId}` URL.
Options B (server auto-send / WhatsApp Business API) and C (customer success copy) deferred.

- PRD: `.scratch/vendor-whatsapp-paid-notification/PRD.md`
- Issues: `01-kds-vendor-wa-me-notify` ✅ done 2026-07-02
- ADR: `docs/adr/0028-kds-vendor-whatsapp-paid-notify.md`
- Depends on: #2 Payment ✅, #4 KDS SSE ✅, `Vendor.phoneNumber` ✅, `/slip/[orderId]` ✅
- Deploy: `5f56269` → `dpl_EcGsGd4WNbRtgPKLUK9mcnaHMcK5` → `zantap-psi.vercel.app`
- Prod smoke: Playwright 8/8 PASS (`.scratch/vendor-whatsapp-paid-notification/prod-smoke.mjs`)

---

## Post-backlog probe notes (#9–#13) — 2026-06-24

| # | Candidate | Readiness | Gate / notes |
|---|-----------|-----------|--------------|
| 9 | Vendor WhatsApp PAID notification | ✅ Done · deployed · prod-smoked 2026-07-02 | wa.me deep-link on KDS ticket; ADR-0028; Playwright smoke 8/8 |
| 10 | Customer storefront → DESIGN.md | ✅ Done · deployed · curl-smoked 2026-07-07 | ADR-0041; palette cleanup ADR-0042 deployed (`8117fe5` → `dpl_6wacM85XfVdhDXYenhRmHyrYuLGg`) |
| 11 | Live MTN MoMo | High risk | Simulated STK in `lib/momo/simulate.ts` + `/api/momo/stk`. Payment module (#2) ✅. **Requires `/grill-with-docs` before PRD.** |
| 12 | Vendor authentication | Deferred per AGENTS.md | Write-secret interim (ADR-0009). Real auth = separate grill + PRD. |
| 13 | Ops / security | Mixed | `README.md` stale (still references `lib/data/*`, Phase 2 deferrals). Write-secret rotation playbook. Export/upload already guarded; rate limits not audited. |
| 5 | Prisma/Zod type source | Audited | Triggers in ADR-0003 still not fired — **do not lift defer without owner OK.** |

---

- The candidates are a prioritized backlog from one review, **not** a gate. New
  features/fixes can be interleaved freely.
- Only hard recommendation: don't ship new **payment-touching** features before
  #2 (live money-correctness bug in production today).
- #1 (the foundation everything else assumed) is done, so new work is safe as
  long as it goes **through the Store seam** (no competing data paths; no ad-hoc
  Supabase SDK wiring — see `AGENTS.md`).
