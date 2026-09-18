# KDS translation control in Ops

Status: DONE · MERGED TO MAIN `f6c3932` · Production `dpl_SPtBgijdcTpfb63jGKZ3L1ePT1Nd` (`zantap-gjreeypto`) READY on `zantap.app` · 2026-09-18

Owner request (2026-09-10): "on a separate branch; work on kds translation control in ops".

Source: `zantap-kds-translation-c29` (`be28a09` + language-availability working tree). Ported onto `feat/kds-translation-on-main`, fast-forwarded to `main` at `f6c3932`. Migration `20260916120000_kds_language_availability` applied to Production before deploy. Leftover KDS from this folder's 2026-09-18 stash was not mixed. Owner has not been asked to toggle languages live.

## Progress

- [x] Create a separate branch.
- [x] Read project UI and data boundaries and inspect current translation implementation.
- [x] Identify reusable Ops editor, authenticated API and Store persistence.
- [x] Resolve scope: proceed here with shared wording editing and a KDS language selector, per the stated implementation assumption following the owner's "Do it here".
- [x] Define copy coverage and implement the chosen behavior.
- [x] Verify save/reset, fallback, authorization and KDS rendering; run build for server-action edits.
- [x] Apply the owner-approved expense-token fix and complete all reviewed coverage gaps.

## Findings

- `components/ops/SiteTranslationsEditor.tsx` currently edits marketing strings only, with English/rw/fr/sw support and per-string save/reset.
- `app/ops/(dashboard)/settings/page.tsx` supplies the marketing source, built-in baselines and persisted overrides.
- `lib/operator-control/site-translations.ts` validates keys against MARKETING_COPY, writes through Store and audits changes. KDS keys must be explicitly registered if this seam is extended.
- `lib/ops-actions/site-translation-actions.ts` revalidates Ops Settings and the root; KDS invalidation needs consideration.
- `lib/store/types.ts`, `in-memory.ts` and `prisma.ts` already provide SiteTranslation persistence. Shared KDS wording can use namespaced keys without a schema change.
- KDS has hard-coded English, including `components/vendor/Tabs.tsx`, `MetricsBanner.tsx`, `OrderTicket.tsx` and other panels. No KDS localization provider or language preference is wired in `app/vendor/[slug]/page.tsx`.
- Do not translate vendor names, menu content, identifiers, order data or machine status values as interface copy.
- This checkout differs from the newer Candidate 29 worktree; preserve that distinction and verify the intended integration base before release.

## Implementation scope

Extend existing authenticated translation CRUD with a namespaced KDS catalog. Add separate marketing/KDS editors with search and untranslated filtering. Wire KDS interface labels through a provider, with a device language cookie independent of marketing. Translate registered interface copy only; missing entries fall back to English. Preserve vendor-entered content, machine identifiers and order state. Save applies to KDS after refresh; language switching in the loaded KDS must preserve working state. No deployment requested.

## Integration + verification — 2026-09-12

- Candidate 29 behavior was retained in all overlaps. `HelpModal`, `KdsDashboard`, and `SetupDrawer` combine readiness-guide behavior with the translation provider.
- Ops save/reset remains authenticated and Store-backed; no schema or alternate data path was added.
- Focused translation/Ops tests: 6/6 passed.
- Full suite: 486 passed / 117 expected skips.
- TypeScript, changed-file ESLint, production build, and `git diff --check`: passed.
- Repository-wide ESLint still reports only the two pre-existing Candidate 29 briefing hook errors in `BriefingInterest.tsx` and `BriefingNotice.tsx`; those files are outside this session.

## Review — 2026-09-12 (commit `6079447`, no push/deploy)

Reviewed against ADR-0089 and this issue. Architecture matches the accepted design: namespaced `kds.*` catalog, Store-backed Ops editors, device cookie, English fallback, no schema change, no DPO/Terms/payment runtime edits.

### Block before deploy — resolved locally 2026-09-12

1. **Expense category persistence** in `components/vendor/ProfitPanel.tsx`: the `<option value>` uses `translateKdsLabel(...)`, so a non-English UI can save a translated category string into expense records. Keep `value={c}` (English machine token) and translate only the visible label.

### Coverage gaps — owner chose full coverage; resolved locally 2026-09-12

2. `components/vendor/ReadinessGuideModal.tsx` — Candidate 29 readiness UI is still fully hard-coded English (no `useKdsTranslation`).
3. `components/vendor/HelpModal.tsx` — accordion bodies are wired; the readiness CTA card ("Readiness guide" / "Become ready…" / "Open readiness guide") is still English.
4. `components/vendor/SetupDrawer.tsx` — checklist rows use `translateKdsLabel`; `GUIDED_STOREFRONT_COPY` action/complete/review strings and several status/error strings remain English.
5. `components/vendor/VendorUpdatesPanel.tsx` — metric titles (`Batches` / `Changes` / `Opens` / `Menu visits`) remain English literals.

### Non-blocking notes

- Tab English baseline remains **Inventory** (matches Candidate 29 parent `3037217`; not a Stock rename regression).
- Cookie `zantap_kds_lang` path `/vendor` is correct for `/vendor/[slug]`.
- Ops auth, known-key allowlist, placeholder checks, marketing/KDS editor split, and KDS revalidation look sound.
- Owner decision: all reviewed wording must be editable/replaceable in Ops, so the expense fix and all four coverage gaps were included.

## Owner-approved follow-up — 2026-09-12

- Expense category options now retain stable English machine values while only their visible labels are translated. A regression test proves a translated `Ingrédients` label still yields the persisted `Ingredients` value.
- `ReadinessGuideModal` now translates static, dynamic, accessibility, status, warning, and action copy through registered Ops keys.
- The Help readiness CTA, Setup guided flow/status/error strings, and Vendor Updates metrics are registered and wired to the KDS translator.
- DPO, Terms, and payment runtime were not touched. No schema, database, push, or deployment action occurred.
- Verification: focused translation/Ops tests 8/8; full suite 488 passed / 117 expected skips; TypeScript, changed-file ESLint, production build, and `git diff --check` passed.
- Next gate: owner approval is required before pushing or deploying this follow-up.

## Owner local QA follow-up — 2026-09-16

- Owner reported that Kinyarwanda still showed English stage-filter chips (`All`, `New`, `Preparing`, `Ready`, `Completed`) and requested a smaller language selector control.
- Stage-filter chips now resolve through a dedicated translation path: prefer `kds.status.*` overrides for `new/preparing/ready/completed`, then fall back to `kds.labels.*`, with `all` from `kds.labels.all`.
- KDS language selector is now compact (small globe + short locale codes `EN/KN/FR/SW`) to preserve header space.
- Regression coverage added for the stage-filter translation path in `lib/i18n/__tests__/kds-translations.test.ts`.
- Verification rerun on this follow-up: focused translation/Ops tests 9/9, changed-file ESLint pass, production build pass.
- Repository-wide `npm run lint` still shows the two pre-existing Candidate 29 briefing hook errors only (`BriefingInterest.tsx`, `BriefingNotice.tsx`), unchanged by this work.

## Selector rebuild + live local verification — 2026-09-16

- The first compact selector kept a native `<select>`, so its open list was drawn by the operating system and appeared as a light menu on the dark KDS. It is now the shared `Select` primitive (`variant="pill"`, `align="end"`, globe prefix), identical in construction to the Orders "Sort" control, so the panel, hover, and selected-check styling come from `.kds-dark` tokens.
- `Select` gained one optional `triggerLabel` prop so the trigger can read `EN/KN/FR/SW` while the listbox shows `English / Kinyarwanda / Français / Kiswahili`. No existing caller changes behavior.
- Trigger background bug: `bg-surface-card/85` rendered light because `.kds-dark` in `app/globals.css` remaps only the enumerated `/80`, `/90`, `/95` alpha variants. The trigger now uses the default pill styling with no custom background.
- Live local check in a real browser (`/vendor/inka-steakhouse`, in-memory store, owner-entered `rw` overrides): stage chips rendered `inshya (2)` and `birigutegurwa (1)` and the ticket badges matched, confirming the status-first chip fallback works against saved Ops wording.
- The dev overlay hydration warning seen during that check was caused by the automation tool's own injected `data-cursor-ref` attribute, not by product code.
- Owner's earlier "no change" report was a locale/refresh issue, not a code defect: overrides are per locale and the dictionary is delivered at server render, so the KDS tab must be reloaded after saving and switched to KN.
- Verification: TypeScript clean, changed-file ESLint clean, focused `kds-translations` suite 7/7, production build clean.

## Ops-controlled language availability — 2026-09-16

Owner gate before release approval: Operators must be able to switch the KDS language selector on/off and mark individual languages as "Soon". Owner chose a global (not per-Vendor) setting, with the selector hidden entirely when switched off, built on this branch so the whole thing releases together. ADR-0094.

- Four booleans on the `MarketingSiteSettings` singleton (`showKdsLanguageSelector`, `kdsLanguageRw`, `kdsLanguageFr`, `kdsLanguageSw`) + migration `20260916120000_kds_language_availability`. **All default to true, so applying the migration changes nothing until an Operator toggles.** Not applied to any database yet.
- English deliberately has no switch — it is the fallback for untranslated keys.
- New Ops → Settings card `KdsLanguageSettingsForm`, saving through the existing authenticated `patchMarketingSiteSettingsAction`; that action now also revalidates `/vendor/[slug]`.
- `lib/i18n/kds-language-availability.ts` is the pure seam: `resolveKdsLanguageAvailability` splits enabled vs coming-soon, `resolveKdsLocale` re-checks the device cookie so a kitchen on a switched-off language falls back to English.
- `Select` gained optional per-option `disabled` + `note` (badge) and skips unchoosable options during keyboard navigation; existing callers pass neither and are unaffected.
- `KdsLanguageSelector` now owns its header row so a hidden selector leaves no gap in `MetricsBanner`, and renders the "Soon" badge from the registered `kds.language.soon` key.
- Verification: TypeScript clean, changed-file ESLint clean, focused translation/Ops tests 11/11, full suite 491 passed / 117 expected skips, production build clean. No push, no deploy, no database or Production configuration change.

### Owner re-test steps (local, dev server running on port 3000)

1. Ops → Settings → **KDS languages**: switch Français and Kiswahili off, Save.
2. Reload `/vendor/inka-steakhouse`, open the globe pill: Français/Kiswahili are greyed with a "Soon" badge and cannot be picked; English and Kinyarwanda still switch (KN shows `inshya`/`birigutegurwa`).
3. Switch **Show the language selector** off, Save, reload the KDS: no selector, header has no leftover gap, interface is English even if the device was on KN.
4. Switch it back on to confirm the previous language choice returns.

## Owner self-serve — 2026-09-18

Owner will toggle live Soon / selector flags from Ops (no agent write). Path: `/ops/settings` → **KDS languages** → Save languages. Kitchens see the change after a dashboard reload. English has no switch. Do not toggle Production flags from an agent session unless the owner asks.

## Read next

This issue, `docs/adr/0089-kds-translation-control-discovery.md`, `.cursorrules`, `DESIGN.md`, and the source files listed above.
