# Issue 01 — First-create photos, forgiving size drafts, and add-ons design

Status: FIXES RELEASED · ADD-ONS RELEASED · PROD-SMOKED

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
- [x] Owner approved all five add-ons proposal decisions on 2026-08-26.
- [x] Item-specific groups persist through both Store adapters with the approved
      limits/rules and owner-token-guarded Vendor writes.
- [x] Checkout sends choice IDs only; the Store validates current availability,
      prices selections, and snapshots labels/prices onto each Order line.
- [x] Storefront required-choice blocking, live totals, distinct cart identity,
      KDS tickets, receipts, WhatsApp text, and CSV/XLSX summaries are wired.
- [x] Focused tests, targeted lint, full tests, and production build pass.
- [x] After restarting the sole port-3000 dev server, finish the post-save
      storefront/order browser walkthrough at 390px and desktop.
- [x] The add-ons subview exposes an explicit save action, reports validation
      or server errors in place, and persists through the guarded menu-item
      update without requiring the Vendor to discover the parent form save.

## Boundaries

- Do not reapply `20260825123000_menu_item_sizes` or redeploy the released size
  feature.
- Preserve the unrelated Inventory PRD, brand/marketing files, architecture and
  shared-handoff edits, and every pre-existing dirty/untracked artifact.
- Keep the Store as the single server-only data seam if add-ons are later
  approved for implementation.

## Add-ons local implementation

- ADR-0071 records the approved catalog, validation, cart identity, pricing and
  immutable snapshot decisions.
- Additive migration `20260826100000_menu_item_add_ons` is applied to the
  production Supabase project; Prisma reports all 19 migrations current.
- Fresh-server Playwright QA passed the full Vendor → storefront → simulated
  MoMo → KDS → receipt story. The editor round-tripped Required/Single sauces
  (`Chilli +300`, `Mayo +0`) and Optional/Multiple extras (`Avocado +1,000`,
  `Cheese +500`, max 2). The storefront blocked its CTA until a required sauce
  was selected, showed 7,800 RWF per unit and 15,600 RWF for quantity two, and
  kept the Mayo-only 6,500 RWF choice as a distinct cart line.
- Simulated MoMo PIN `12345` created paid local order `#4450` / Store ID
  `ord_1_1787790754450` for 22,100 RWF. KDS and receipt both rendered the two
  immutable snapshots (`Chilli, Avocado` and `Mayo`) with authoritative unit
  prices. The 390×844 storefront and 1280×900 KDS had no horizontal overflow;
  the 2026-08-27 browser logs contained zero errors or warnings. Screenshots:
  `output/playwright/menu-add-ons/kds-order-4450.png` and
  `output/playwright/menu-add-ons/receipt-4450.png`.
- Verification: focused 152 tests, in-memory contract 116 tests, full suite 420
  passed / 117 skipped, targeted ESLint clean, and production build clean.
- Follow-up commit `83f27f0` adds explicit checkout-payload, WhatsApp/delivery
  text, and CSV/XLSX summary assertions for immutable add-on snapshots (27/27).
- No production fixture, menu-item, order, or other business data was changed
  while releasing add-ons.
- The earlier stale-server blocker cleared on 2026-08-27: port 3000 was free,
  one fresh `npm run dev` process was started, and the final browser gate passed.
- A post-approval UX correction replaced the add-ons subview's lone Back action
  with Back plus a primary `Save add-ons` action. At 390×844, Playwright saved
  `Sauces QA` / `Garlic mayo` / `250 RWF`, closed the editor, reopened Smash
  Burger, and restored the exact persisted values with zero browser errors.

## Release

- Commit `22b1315` was pushed to `origin/codex/customer-restaurant-hub`.
- A clean detached worktree deployed exact commit `22b1315` to Vercel
  Production as `dpl_5PST7zjP8wFpmxRsYc3NJcNGWnWP` (`READY`), aliased to
  `zantap.app`, `www.zantap.app`, and `zantap-psi.vercel.app`.
- Production smoke returned HTTP 200 for `/inka-steakhouse`,
  `/vendor/inka-steakhouse`, and `/onboard`. Exact-deployment error, fatal,
  warning, and 5xx scans were empty.
- No migration ran and no production fixture, menu-item, order, or other
  business data changed.
- Owner authorization pushed implementation `9eac518`, downstream contract
  evidence `83f27f0`, and explicit-save correction `53c5d24` to
  `origin/codex/customer-restaurant-hub`.
- Production migration audit found only
  `20260826100000_menu_item_add_ons` pending. `npm run db:deploy` applied that
  migration, and follow-up `prisma migrate status` reported all 19 migrations
  up to date. The released menu-size migration was not reapplied.
- A clean detached worktree deployed exact commit `53c5d24` as Vercel
  Production `dpl_GKFXigG2VbJFFumNEiGLBerkHGCE` (`READY`), aliased to
  `zantap.app`, `www.zantap.app`, and `zantap-psi.vercel.app`.
- Exact-deployment and alias smoke returned HTTP 200 for storefront, KDS, and
  onboarding. The production KDS client bundle contains `Save add-ons`, and
  exact-deployment error, fatal, warning, and 5xx scans were empty.
