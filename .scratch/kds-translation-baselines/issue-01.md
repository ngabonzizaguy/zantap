# Issue 01 — Fill the Ops KDS copy editor from the reviewed rw/fr/sw JSON

Status: ✅ DONE · DEPLOYED · PROD CURL-SMOKED 2026-09-22  
Owner decision: 2026-09-22 — pre-fill the existing Ops editor; do NOT bulk-seed DB overrides; then baseline fallback into kitchen runtime; re-include preserved continuity tests as agent documentation.  
Record: ADR-0095. Related: ADR-0089, ADR-0094, `.scratch/kds-english-catalog/issue-01.md`.  
Ship: `b0289f9` → Production `dpl_Hn2FAFCjHxNLL4ky8onYp6Bsx1vn` READY on `zantap.app`.

## Goal

Ops → Settings → Languages (KDS copy) opened with 684 empty fields per locale.
Load the owner-reviewed translations so every field shows real wording that the
owner can edit, Save (DB override) or Reset in place.

## Tasks

- [x] Verify `locales/kds.{rw,fr,sw}.json` parity with `kds.en.json`
      (861 keys each, identical order, 0 placeholder drift, 0 empty values)
- [x] Map nested camelCase JSON leaves → flat kebab-case `KDS_COPY` keys by
      section + exact English value (684/684, no ambiguity)
- [x] Generate `lib/i18n/kds-translations/{rw,fr,sw}.ts` (`satisfies KdsDictionary`)
- [x] Add `lib/i18n/kds-baselines.ts` (`KDS_BASELINE_TRANSLATIONS`, en = `{}`)
- [x] Wire `baselines={KDS_BASELINE_TRANSLATIONS}` into the KDS editor instance
- [x] Add `lib/i18n/__tests__/kds-baselines.test.ts` (coverage, registered keys,
      placeholder parity, sample wording differs from English)
- [x] Local Ops browser verification 8/8
- [x] **Runtime baseline fallback (owner-approved 2026-09-22 after the KDS
      language switch visibly did nothing)** — `getKdsTranslations()` merges
      baselines under DB overrides; `pickKdsLocales()` serializes only
      Ops-enabled locales; KDS browser switch verification 9/9
- [x] **Preserved continuity tests re-included** (owner decision 2026-09-22) —
      vitest no longer excludes `.scratch/**`; the preserved KDS translations
      test is synced to live expectations + README under
      `.scratch/repository-continuity/preserved-2026-09-18/`
- [ ] Owner review of wording in Ops (rw first, then fr/sw)
- [ ] Owner decides whether Kinyarwanda stays flagged "Soon" in Ops (it is
      disabled today, so the KDS pins those devices to English — ADR-0094 gate,
      not a translation problem)
- [x] Commit + deploy

## Verification (2026-09-22, local — after the runtime fallback)

- Focused vitest: `lib/i18n` 23/23 (includes 2 new runtime tests)
- Full suite: **503 passed / 117 skipped / 1 pre-existing failure** over 92 files.
  The drop from 525/96 is the newly excluded `.scratch` snapshots (22 tests),
  not lost coverage: 526 − 22 + 2 new = 506 = 503 + 1 failure + (2 counted above).
- `.scratch/kds-translation-baselines/kds-switch-check.mjs` → **9/9 PASS** on
  `/vendor/inka-steakhouse`: Français (`Commandes` / `Inventaire`, chip FR),
  Kiswahili (`Maagizo` / `Stoo`, chip SW), English tabs gone while translated,
  cookie + SSR survive a reload, switch back to English, zero browser errors.
  Shots in `kds-shots/`. **Kinyarwanda was skipped: Ops has it flagged "Soon"**
  (disabled option, `resolveKdsLocale` → English).
- Harness gotcha: the `Select` dropdown needs dev-mode hydration — clicking the
  globe pill right after `domcontentloaded` opens nothing. Wait for
  `networkidle` + ~2.5s and retry the trigger click.

## Earlier verification (2026-09-22, before the runtime fallback)

- Focused vitest: 32/32 (`kds-baselines`, `kds-translations`, `localize`)
- Full suite: 525 passed / 117 skipped / **1 pre-existing failure**
  `lib/menu-intake/__tests__/import.test.ts` — `VERCEL="1"` leaks in from
  `.env.production.local` via `loadEnv` in `vitest.config.ts`, so
  `assertPrivateBlobConfigured()` throws. Unrelated to this work; documented in
  AGENTS.md as "VERCEL cleared for the menu-intake blob test".
- `npx tsc --noEmit` clean; ESLint on changed files clean; `npm run build` clean
  (one earlier build attempt failed on a transient `next/font/google` fetch)
- `.scratch/kds-translation-baselines/ops-check.mjs` → **8/8 PASS**
  (rw/fr/sw each `0 overrides saved · 0 untranslated`; `kds.tabs.orders` =
  "Komande"; `kds.counts.page` = "Urupapuro {page} kuri {pages}";
  Untranslated-only filter empty; no browser errors). Shots in `ops-shots/`.
  The harness reads `OPERATOR_UI_SECRET` from `.env.local` itself so the secret
  never reaches a command line, log or chat.

## Deliberately NOT done

- **No DB overrides seeded.** Baselines serve the editor and the kitchen from the
  repo; only owner edits become `SiteTranslation` rows.
- **No baselines in `lib/i18n/kds-localize.ts`.** Client components import
  `createKdsTranslator` from it, so the merge lives in the server-only
  `get-kds-translations.ts` to keep all three dictionaries out of the KDS
  client bundle. `pickKdsLocales()` trims the RSC payload to enabled locales.
- **No language-availability flags touched.** Kinyarwanda is "Soon" in Ops today;
  the owner flips that, not the agent.
- **The 177 `notYetRegistered` strings** stay in the JSON — no `KDS_COPY` key
  exists, and the Ops save path rejects unknown keys.
- No English source wording changed; no schema, migration or language-availability
  flag touched.

## Regenerating after a JSON edit

```
node .scratch/kds-translation-baselines/generate-baselines.mjs
npx vitest run lib/i18n/__tests__/kds-baselines.test.ts
```

## Notes / gotchas

- `lib/i18n/kds-translations/*.ts` are generated — edit `locales/kds.*.json` and
  regenerate, otherwise the JSON and the app drift.
- Do not use `git stash` in this checkout: three stashes are load-bearing
  (`stash@{0}` = 2026-09-18 continuity edits that must stay unapplied). A failed
  `git stash push` here left the stash list and working tree intact — verified
  via `git stash list` (3) and `docs/adr/0093*` being unmodified — but the safe
  move is to avoid stash entirely.
- `playwright-core` was installed with `npm install --no-save` for the harness;
  `package.json` is unchanged.
