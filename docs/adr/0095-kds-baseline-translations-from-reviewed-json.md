# ADR-0095 — KDS baseline translations loaded from the reviewed locale JSON

Date: 2026-09-22  
Status: Accepted  
Supersedes nothing. Extends ADR-0089 (KDS translation control) and ADR-0094 (Ops-controlled language availability).

## Context

The Ops KDS copy editor (`components/ops/SiteTranslationsEditor.tsx`, surface `kds`)
was mounted with `baselines={{}}`, so all three non-English tabs opened as
**684 untranslated** empty fields. Meanwhile the owner reviewed full rw/fr/sw
translations of the extracted English catalog as `locales/kds.{rw,fr,sw}.json`
(861 leaves each: 684 registered `KDS_COPY` strings nested under `kds.*`, plus
177 `notYetRegistered` leftovers that have no Ops key yet).

The two spellings do not convert mechanically. The JSON is nested camelCase
(`kds.setupDrawer.3040Min`); the registered catalog is flat kebab-case
(`kds.setup-drawer.30-40-min`). Round-tripping is lossy because the camelCase
extraction collapsed digit groups and de-duplicated suffixes (`item-2`,
`view-page-1-2`, `inka-steakhouse-2`).

## Decision

1. **Map by section + exact English value, in order** — not by string transform.
   Each JSON leaf is matched to the first unused `KDS_COPY` key in the same
   section whose English source is identical, which resolves duplicates
   ("Close", "Cancel", "Soon") deterministically and fails loudly on drift.
   Generator: `.scratch/kds-translation-baselines/generate-baselines.mjs`.
2. **Ship the result as in-repo baselines**, mirroring the marketing pattern:
   `lib/i18n/kds-translations/{rw,fr,sw}.ts` (generated, `satisfies KdsDictionary`
   so a bad key is a TypeScript error) aggregated by `lib/i18n/kds-baselines.ts`.
3. **Pre-fill the Ops editor.** `app/ops/(dashboard)/settings/page.tsx`
   passes `KDS_BASELINE_TRANSLATIONS` instead of `{}`. Effective value per field
   stays DB override → baseline → English, so the counter reads
   `0 overrides saved · 0 untranslated` and Save/Reset semantics are unchanged.
3a. **Serve the baselines to the kitchen too** (owner decision, same day, after
   the KDS language switch visibly did nothing). `getKdsTranslations()` now
   merges `KDS_BASELINE_TRANSLATIONS` under the DB overrides, so a locale
   resolves override → baseline → English. The merge stays in the server-only
   module — importing baselines into `lib/i18n/kds-localize.ts` would ship all
   three dictionaries into the KDS client bundle, since client components import
   `createKdsTranslator` from there. `pickKdsLocales()` then serializes only the
   locales Ops enables, so a disabled language costs no payload. On a store read
   failure the kitchen keeps the baselines instead of falling back to English.
4. **Do not import the 684 strings as database overrides.** Bulk-seeding would
   make every line look owner-authored and turn Reset into "erase to English".
5. **Do not register the 177 `notYetRegistered` leftovers.** They have no
   `KDS_COPY` key, and `upsertOperatorSiteTranslation` rejects unknown keys.
   They stay parked in the JSON for a later extraction pass.

## Consequences

- The owner reviews and edits real rw/fr/sw wording in Ops → Settings, and only
  the lines actually changed become DB overrides.
- **Switching the KDS language now visibly translates the kitchen** with zero
  overrides saved. Verified in a browser: Français → `OUVERT`, `Brut du jour`,
  `Commandes`, `Inventaire`, `il y a 19 min`; Kiswahili → `Maagizo`, `Stoo`.
  Vendor-entered content (dish names, customer details) stays as entered.
- **Ops language availability is a separate gate** (ADR-0094). A language marked
  "Soon" renders disabled in the selector and `resolveKdsLocale` pins the device
  to English regardless of baselines — so an untranslated-looking kitchen can be
  a flag, not a missing dictionary. Kinyarwanda was found flagged "Soon" during
  verification; the owner controls that in Ops → Settings → KDS languages.
- Existing behavior test names changed meaning: "restores English after reset"
  became "restores the baseline after reset", and a storage failure no longer
  yields `{}`.
- `vitest.config.ts` now excludes `.scratch/**`. The preserved snapshots under
  `.scratch/repository-continuity/preserved-*` import `@/…`, so they asserted a
  *previous* checkout's expectations against current product code (one of them
  failed on this change). The snapshots stay untouched as evidence; the suite
  drops from 96 to 92 files (22 duplicated tests).
- `locales/kds.{rw,fr,sw}.json` is the editing source of truth for the
  generated files; regenerate rather than hand-editing `lib/i18n/kds-translations/*`.
- Guardrails: `lib/i18n/__tests__/kds-baselines.test.ts` asserts 684-key
  coverage per locale, registered-key-only, and `{placeholder}` parity with the
  English source (the same rule the Ops save path enforces).
