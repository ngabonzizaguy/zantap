# Issue 01 — Real vendor Inventory

Status: ✅ DONE · deployed 2026-08-20 · prod-smoked 2026-08-21

## What to build

Deliver a separate, owner-token-protected Inventory for supplies rather than
finished dishes. A vendor can create an item, view it, edit its descriptive
fields, record safe quantity adjustments, inspect history, and archive/restore
it. The KDS surfaces clear low/out summaries, search, category filters, and ten
items per page, while Setup Guide opens Inventory and completes after the first
active item. Inventory is online-only and remains financially separate from the
Profit/Expenses screen.

## Acceptance criteria

- [x] Both Store adapters support inventory item lifecycle, immutable adjustment
      history, archive/restore, filtering, status ordering and pagination.
- [x] Supported units/categories and validation match the approved PRD;
      quantities support decimals where appropriate and never go below zero.
- [x] KDS Inventory supports add, edit, Receive, Use, Waste, Correction,
      history and archive/restore with simple vendor-facing language.
- [x] Low items are yellow, out items red, low/out counts are visible, and no
      external/paid WhatsApp call is introduced.
- [x] Ten-item paging applies after search/category filtering and status order.
- [x] Menu dish availability remains in Menu and is not presented as supply
      inventory; Profit and Expenses calculations remain unchanged.
- [x] Setup Guide `Add your first stock item` opens Inventory and tracks real
      completion.
- [x] Contract, validation, action, interaction, accessibility and responsive
      tests pass; migration is created but not deployed before the release gate.

## Blocked by

None — can start immediately.

## Verification

- Focused Inventory Store contract: 5 passed (100 unrelated skipped).
- Focused actions + Setup Guide: 15 passed.
- TypeScript: clean.
- ESLint: clean.
- Full Vitest: 354 passed / 109 expected skips.
- Production build: clean.
- Local browser smoke: 390×844 and 1280×900, zero console errors and no
  horizontal overflow. Create, low alert, Receive, history, negative-stock
  rejection, archive/restore, URL state, and Setup completion passed.
- Migration `20260820183000_real_vendor_inventory` exists on disk and was not
  applied. Production was not touched.
- Combined release gate 2026-08-20: migration applied successfully; Prisma
  reports all 16 migrations current and direct reads of both new tables pass.
  Production deployment `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi` is Ready at
  `zantap.app`; Inventory route is HTTP 200 and release-window error/fatal/5xx
  scans are empty. Final guarded browser lifecycle smoke remains pending because
  the disposable-fixture harness exhausted its retry budget on a render-timing
  assertion after successful create responses. Every fixture was cleaned up.
- Final-smoke attempt 2026-08-20: the one authorized run passed Inventory
  create and submitted the Received adjustment, then stopped because the
  harness observed the success toast before the awaited list refresh exposed
  `5 pieces`. The assertion now waits for the refreshed quantity; it was not
  rerun in this session. Direct Postgres cleanup verification reports zero
  fixture vendors, inventory items, adjustments, menu items, orders and
  payments. Deployment error/fatal/5xx scans remain empty.
- Follow-up single run 2026-08-20 passed the complete Inventory production
  lifecycle through history, archive, restore and direct Postgres quantity plus
  immutable-history verification. The run then stopped in KDS Orders on a
  harness-only ticket selector. Cleanup again reports zero fixture vendors,
  inventory items, adjustments, menu items, orders and payments; deployment
  error/fatal/5xx scans are empty. Candidate closeout remains pending.
- Ticket-selector follow-up 2026-08-20 again passed the complete Inventory
  lifecycle and direct Postgres verification before reaching KDS and storefront.
  Final cleanup is zero across fixture vendors, inventory items, adjustments,
  menu items, orders and payments; the exact deployment's two-hour error/fatal/
  5xx scans are empty. Candidate closeout remains gated by storefront behavior.
- Final combined production smoke 2026-08-21: the single authorized harness run
  passed the complete guarded Inventory lifecycle and direct Postgres quantity/
  immutable-history checks as part of the 27-check candidate gate. Independent
  cleanup verified zero `release-25-*` vendors, inventory items, adjustments,
  menu items, orders and payments. Deployment `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi`
  returned zero error, fatal and 5xx logs over the 48-hour scan. No migration was
  reapplied and no redeploy occurred.
- Main integration 2026-08-21: `7028e5b` was fast-forwarded to `main` and
  deployed as `dpl_874DQNUcV2fG7eXsbtLeFTqdeJJd` at `zantap.app`. Inventory
  and core routes return HTTP 200 and the initial exact-deployment error scan is
  empty. The migration and 27-check production harness were not repeated.
