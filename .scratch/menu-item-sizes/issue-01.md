# Issue 01 — Dynamic menu item size prices

Status: DONE LOCALLY · OWNER APPROVED · RELEASE GATED — visual browser gate PASSED

## 2026-08-25 reference update

The owner supplied `codex-clipboard-0a570a35-c7d7-4ad7-986b-dfa5eafbbbad.png`
as the intended KDS add/edit UI and confirmed every visible control must work.
It supersedes the initial fixed-field layout. The implemented editor therefore
uses an ordered list of dynamic size options rather than fixed database columns.

## User outcome

Vendors can keep a normal single-price menu item or price it with ordered,
editable size options. New size pricing starts with Small, Medium, and Large;
vendors can rename, reorder, hide, delete, reset, or add custom sizes. Customers
select an enabled size before adding the item, and the selected snapshot appears
unchanged on checkout, KDS tickets, receipts, notifications, and exports.

## Decisions

- [x] Size pricing is optional per menu item; legacy single-price items remain valid.
- [x] Size pricing is an ordered list of 2–8 editable options; defaults are S/M/L.
- [x] Every option has a stable ID, label, positive whole-number RWF price, and storefront visibility state.
- [x] At least one option must remain visible, and duplicate IDs/labels are rejected.
- [x] `MenuItem.priceRwf` remains the canonical starting price and mirrors the cheapest visible size.
- [x] The server resolves the submitted size to the current persisted price; it never trusts a client price.
- [x] `OrderItem` snapshots the selected size and resolved unit price for historical accuracy.

## Acceptance criteria

- [x] KDS create/edit menu modal supports single price and fully functional dynamic size pricing.
- [x] Both Store adapters persist and return ordered size options.
- [x] Validation rejects invalid option sets and unknown/disabled order sizes.
- [x] Existing menu items and single-price order flows continue to work unchanged.
- [x] Storefront cards show a starting price for sized items and quick-add opens size selection.
- [x] Customize sheet shows accessible enabled-size choices and calculates the selected-size total.
- [x] Cart/checkout can hold separate size lines for one menu item.
- [x] Order creation re-prices the selected size at the server boundary.
- [x] KDS ticket, vendor receipt, WhatsApp text, and exports show the selected-size snapshot.
- [x] Focused tests, full tests, lint, TypeScript, and production build pass.
- [x] ADR, architecture status, and shared handoff are updated.
- [x] Implementation is committed without including unrelated working-tree changes (`7efdf92`).
- [x] Restart the local server and complete final visual/browser interaction QA.

## 2026-08-25 visual browser verification

- Stopped the stale `next start` listener on port 3000 and started the current
  code with `npm run dev`.
- Functional browser pass succeeded at 390x844 and 1440x1000: Single price → By
  size, rename and price edits, pointer-drag and keyboard reorder, hide/show,
  delete down to the two-row minimum, reset, and custom-size creation all worked.
- Created local in-memory item `Visual QA Pizza` with Small 4,500 RWF, hidden
  Medium 6,500 RWF, Large 9,000 RWF, and Family 12,000 RWF. Edit mode restored
  the ordered list and visibility state correctly.
- Storefront showed `From 4,500 RWF`, omitted hidden Medium, and offered Small,
  Large, and Family. Small and Large remained separate cart lines (13,500 RWF
  total); sandbox PIN `12345` completed local paid order `#7089`; its KDS ticket
  showed separate `Small · 4,500 RWF each` and `Large · 9,000 RWF each` snapshots.
- Desktop create/edit and mobile edit were visually sound. Mobile **create** at
  390px failed the visual gate: the Category/Photos grid expands the 293px modal
  body to 379px, clips Photos, and introduces a horizontal scrollbar. Developer
  measurement: the scroll container is 341px client width / 403px scroll width.
- Zero browser console errors. Evidence is under
  `output/playwright/menu-item-sizes/`.
- No product code was changed in this verification pass. No migration, push,
  deployment, or production data change occurred.

## 2026-08-25 responsive visual fix

- Changed only the create-mode Category/Photos wrapper in
  `components/vendor/MenuItemModal.tsx`: the controls stack below the `sm`
  breakpoint and retain the approved two-column composition at `sm` and above.
  Desktop tracks use `minmax(0, …)` so intrinsic combobox content cannot force
  the modal wider.
- Headed Playwright recheck passed for create and edit at 390x844 and
  1440x1000. At 390px, the modal scroll region is now 341px client width / 341px
  scroll width (previously 341px / 403px); the document is 390px / 390px and
  the dialog is 357px / 357px. At 1440px, Category and Photos remain side by
  side in 207px and 176px tracks with no overflow.
- Fresh evidence is `mobile-create-responsive-single.png`,
  `mobile-create-responsive-by-size.png`, `mobile-edit-responsive-by-size.png`,
  `desktop-create-responsive-single.png`, and
  `desktop-edit-responsive-by-size.png` under
  `output/playwright/menu-item-sizes/`. Browser console errors remained zero.
- Proportionate static checks pass: `npm run lint` and `npx tsc --noEmit`.
  Existing full functional browser QA, full tests, and production build remain
  valid because this follow-up changed only responsive layout classes.
- No migration, commit, push, deployment, or production data change occurred in
  this follow-up.

## 2026-08-25 approved compact editor and storefront polish

- The owner approved the generated compact editor visual as the exact
  implementation target. The KDS edit header now summarizes sized items as
  `N sizes · From X RWF` with an optional full-width disclosure instead of
  enumerating every size beside the thumbnail.
- The pricing mode uses one clean segmented border. Size options use compact
  accordion rows with consistent Lucide drag, Eye/EyeOff, ellipsis, chevron,
  reset, add, and delete icons. Only one row expands at a time; the expansion
  contains the name, price, storefront visibility switch, and delete action.
  Narrow rows preserve ordinary labels such as Small, Medium, Large, and Family
  rather than truncating them.
- The storefront reflects only enabled options in a polished required,
  single-column radio/check selector. The selection price updates the item
  headline and Add to order total. Keeping one column at desktop widths avoids
  compressing Family and other longer size labels.
- Headed Playwright PASS at 390x844 and 1440x1000 for KDS create/edit and the
  storefront. Mobile KDS document/dialog measurements are 390/390 and 357/357;
  desktop KDS is 1440/1440 and 447/447. The storefront omitted hidden Medium,
  showed Small/Large/Family, and selecting Large changed the CTA to 9,000 RWF.
  Accordion exclusivity, visibility round-trip, ellipsis actions, keyboard
  reorder, add/delete, and four-row restoration also passed. Browser console:
  zero errors or warnings.
- Fresh evidence:
  `mobile-create-approved-accordion.png`,
  `mobile-edit-approved-summary.png`,
  `desktop-edit-approved-summary.png`,
  `mobile-storefront-approved-size-selector.png`, and
  `desktop-storefront-approved-size-selector.png` under
  `output/playwright/menu-item-sizes/`.
- Final verification passes: 411 tests passed / 116 skipped, 22 focused tests,
  `npx tsc --noEmit`, `npm run lint`, and `git diff --check`.
- The owner completed the final port-3000 review and approved the responsive
  KDS/storefront result on 2026-08-25. The local closeout consists of commits
  `7efdf92` and `7ae92f4`; release remains separately gated.
- No migration, push, deployment, or production data change occurred. The local
  dev server was restarted with database URLs explicitly blank, so all browser
  fixtures and writes remained in memory.

## Files in scope

- `prisma/schema.prisma` + one additive migration
- `lib/types.ts`, `lib/menu/sizes.ts`, `lib/menu/validation.ts`
- `lib/store/in-memory.ts`, `lib/store/prisma.ts`
- `lib/actions/vendor-menu.ts`
- `components/vendor/MenuItemModal.tsx`, `components/vendor/MenuSection.tsx`
- `components/customer/CartContext.tsx`, `MenuItemCard.tsx`,
  `MenuItemCustomizeSheet.tsx`, `Storefront.tsx`, `CheckoutSheet.tsx`
- `lib/checkout/*`, KDS ticket, receipt, and focused tests

## Out of scope

- Per-size stock or cost-of-goods tracking.
- Add-on/modifier persistence.
- Production migration/deployment/smoke without explicit release authorization.
