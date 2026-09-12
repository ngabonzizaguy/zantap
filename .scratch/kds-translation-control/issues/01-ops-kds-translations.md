# KDS translation control in Ops

Status: ready-for-human — implemented and verified on repaired Candidate 29 baseline; not deployed

Owner request (2026-09-10): "on a separate branch; work on kds translation control in ops".

Source branch: dirty `codex/kds-translation-control` at `6510df6`. Integrated branch: `codex/kds-translation-control-c29`, created from repaired `main` at `3037217`. The original dirty working tree remains preserved. No deployment or database mutation was performed.

## Progress

- [x] Create a separate branch.
- [x] Read project UI and data boundaries and inspect current translation implementation.
- [x] Identify reusable Ops editor, authenticated API and Store persistence.
- [x] Resolve scope: proceed here with shared wording editing and a KDS language selector, per the stated implementation assumption following the owner's "Do it here".
- [x] Define copy coverage and implement the chosen behavior.
- [x] Verify save/reset, fallback, authorization and KDS rendering; run build for server-action edits.

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

## Read next

This issue, `docs/adr/0089-kds-translation-control-discovery.md`, `.cursorrules`, `DESIGN.md`, and the source files listed above.
