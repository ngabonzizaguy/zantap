# Issue 01 — First-create photos, forgiving size drafts, and add-ons design

Status: FIXES COMMITTED LOCALLY · ADD-ONS UI AWAITING OWNER APPROVAL · NOT DEPLOYED

## User outcomes

- A Vendor can stage and preview up to six photos while creating a menu item,
  rather than creating the item first and reopening it to build the gallery.
- Clearing a size price does not end in a discouraging global validation error;
  the draft recovers to the minimum valid positive RWF amount before save.
- The owner receives an approval-ready add-ons flow that fits the existing KDS
  item editor and storefront customization sheet. Add-ons persistence and order
  behavior are explicitly gated on that approval.

## Acceptance criteria

- [x] Create mode accepts one or more JPEG/PNG/WebP files and caps the staged
      gallery at the existing six-photo domain limit.
- [x] Create mode previews every staged photo, supports removing any staged
      photo, and uploads the remaining files in their visible order after the
      item is created.
- [x] Invalid/oversized staged files produce clear local feedback before save.
- [x] Existing edit-mode gallery behavior and the single-photo onboarding flow
      remain unchanged.
- [x] Empty/zero size-price drafts normalize to `1 RWF` in the client editor;
      the server continues rejecting non-positive persisted prices.
- [x] Focused tests cover pending-photo selection and size-price normalization.
- [x] TypeScript, lint, focused tests, full tests, and production build pass.
- [x] Mobile and desktop browser QA cover create-mode multi-photo staging and
      the empty-size-price save path without horizontal overflow or console
      errors.
- [x] An add-ons UI/UX proposal shows both Vendor setup and Customer selection,
      including groups, required/optional rules, single/multiple choice,
      per-choice price, availability, and live totals.
- [x] No add-ons schema, Store, checkout, order, KDS ticket, receipt, migration,
      deployment, or production-data work occurs before owner approval.

## Boundaries

- Do not reapply `20260825123000_menu_item_sizes` or redeploy the released size
  feature.
- Preserve the unrelated Inventory PRD, brand/marketing files, architecture and
  shared-handoff edits, and every pre-existing dirty/untracked artifact.
- Keep the Store as the single server-only data seam if add-ons are later
  approved for implementation.
