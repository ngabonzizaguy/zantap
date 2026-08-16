# ZanTap launch-readiness batch — vendor tools, funnel insights, locale CMS, canonical PWA host

Status: **approved by owner 2026-08-16 · implementation in progress**
Branch: `feat/ops-kds-marketing-batch`

## Goal

Close the owner-observed launch gaps without touching payment behavior:

1. Stock is an included vendor capability with menu-item stock CRUD, low-stock
   alerts, sold-out behavior, and paid-order decrement.
2. The Profit eye is always visible and opens complete vendor insight details.
3. Every actionable Setup Guide row opens its correct tab, modal, or editor.
4. Marketing and `#lead-form` render in English, Kinyarwanda, French, and
   Kiswahili, with word-for-word Ops CRUD.
5. ZanTap records privacy-minimal landing/form/click funnel events and exposes
   useful aggregate insight in Ops.
6. Requests to the legacy `zantap-psi.vercel.app` alias permanently redirect to
   `zantap.app` before PWA installation.

## Locked boundaries

- Payment verification and Paypack integration are deferred.
- Footer social-link behavior is unchanged without separate authorization.
- Analytics is first-party and anonymous: no raw IP address, phone, email,
  contact name, browser fingerprint, or lead-form field value is stored.
- Analytics may store a random browser session ID, event name, safe target key,
  locale, path, referrer host, UTM attribution, and timestamp.
- Stock is per-item opt-in: a null stock count means unlimited/untracked; a
  numeric count enables decrement and sold-out behavior for that item.
- Stock and Profit are included for every active vendor. Legacy feature-flag
  columns may remain for compatibility but must not hide or disable them.
- Localization remains marketing-only: storefront, KDS, onboarding, Ops, legal,
  receipts, slips, and PWA copy are outside this batch.
- All persistence stays behind the server-only Store interface and both adapters.

## Release gates

- Focused tests for every slice; full test suite, TypeScript, lint, and clean
  production build.
- Browser QA on mobile and desktop for KDS tabs/Profit/Setup, four marketing
  locales, lead-form analytics, Ops translation CRUD, Ops insights, and legacy
  host redirect.
- Review migrations before `db:deploy`; production smoke follows deployment.
- Preserve unrelated dirty/untracked evidence and implementation paths.
