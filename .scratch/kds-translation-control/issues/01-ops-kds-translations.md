# KDS translation control in Ops

Status: ready-for-human — owner-approved blocker/coverage fix complete locally; push/deploy approval pending

Owner request (2026-09-10): "on a separate branch; work on kds translation control in ops".

Source branch: dirty `codex/kds-translation-control` at `6510df6`. Integrated branch: `codex/kds-translation-control-c29`, created from repaired `main` at `3037217`. The original dirty working tree remains preserved. No deployment or database mutation was performed.

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

## Read next

This issue, `docs/adr/0089-kds-translation-control-discovery.md`, `.cursorrules`, `DESIGN.md`, and the source files listed above.
