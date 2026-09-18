# ADR 0094 — Ops controls which KDS languages are available

Date: 2026-09-16
Status: Accepted · merged to `main` `f6c3932` · Production `dpl_SPtBgijdcTpfb63jGKZ3L1ePT1Nd` · migration applied 2026-09-18

Numbered 0094 because ADR-0093 is already the Q11 canonical-folder isolate (`docs/adr/0093-canonical-folder-on-main-q11-isolated.md`). The c29 draft used 0093 before that ADR existed.

ADR-0089 shipped Ops-editable KDS wording with a selector that always offered all four locales. The owner requires release-gated availability instead: a kitchen must not be able to pick a language whose translation work is unfinished, and the whole selector must be removable.

## Decision

Language availability is a platform switch, not a per-Vendor setting. Four booleans live on the existing `MarketingSiteSettings` singleton (`showKdsLanguageSelector`, `kdsLanguageRw`, `kdsLanguageFr`, `kdsLanguageSw`), edited from a dedicated Ops → Settings card through the existing authenticated marketing-settings path.

English has no switch: it is the fallback for every untranslated key, so removing it would leave the kitchen with nothing to render.

With the selector off, the KDS header shows no control and every kitchen renders English. With the selector on, a switched-off language stays listed but is not choosable and carries a "Soon" badge, so kitchens can see the language is coming rather than wonder why it vanished. `Select` gained optional per-option `disabled` and `note` fields, and its keyboard navigation skips unchoosable options.

The device cookie is a preference, not an authority: `resolveKdsLocale` re-checks it against current availability on every server render, so a kitchen sitting on a language Ops later switches off falls back to English instead of showing half-translated copy.

## Consequences

Migration `20260916120000_kds_language_availability` must be applied before deploy. Every flag defaults to **true**, so applying it changes nothing until an Operator switches something off; shipping the "Soon" state for French and Kiswahili is a deliberate Ops action, not a side effect of the release.

Availability is resolved server-side in `app/vendor/[slug]/page.tsx`, so kitchens see a change after reloading the dashboard — the same refresh rule the wording overrides already follow. Adding a fifth locale now needs a schema column as well as a `SUPPORTED_LOCALES` entry.

Tracking: `.scratch/kds-translation-control/issues/01-ops-kds-translations.md`.
