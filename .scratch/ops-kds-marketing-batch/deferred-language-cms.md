# Deferred: Language CRUD in Ops (→ full ZanTap CMS)

Status: DEFERRED — owner-requested 2026-08-14, explicitly "maybe later when this
is all done, and what I have codex doing currently".

## What the owner wants

- Every English word/phrase on ZanTap surfaces has an editable translation in
  **Kinyarwanda / French / Kiswahili**, with a language switch.
- Translations are CRUD-able from ZanTap Ops: the agent can machine-translate
  first, but the owner can later go into Ops and change any word-for-word if
  they have a better translation than the generation.
- Longer term, this grows into a **real complete CMS for ZanTap** (marketing
  copy, storefront/KDS strings, legal pages).

## Design notes for the future session

- Likely shape: a `TranslationEntry` model (namespace + key + en + rw + fr + sw)
  behind the Store seam, an Ops editor tab (searchable table, inline edit,
  missing-translation filter), and an i18n dictionary loader that overlays DB
  rows onto compiled defaults (`lib/marketing/copy.ts` etc. become the `en`
  fallback).
- Needs its own `/grill-with-docs` + PRD before build (locale routing vs.
  client switch, cache/ISR strategy, which surfaces are in scope first).
- Do NOT wire an ad-hoc i18n library before that grill.

## Already built (2026-08-14)

- The masthead switcher UI ships now: `components/marketing/LanguageSwitcher.tsx`
  (globe pill, dropdown en/rw/fr/sw, localStorage key `zantap.lang`, sets
  `<html lang>`). Locales are gated by a per-locale `ready` flag — flip it to
  `true` as each dictionary lands. The future i18n session wires content to the
  selected locale; the control itself needs no rework.

## Trigger

Start after the current `feat/ops-kds-marketing-batch` branch (Cursor) and the
parallel Codex workstream land and are verified.
