# KDS English language extraction

Date: 2026-09-18  
Catalog: `locales/kds.en.json`  
Scope: extract only. No translations, no i18n wiring, no application behavior change.

ZanTap already ships an Ops-editable KDS catalog (`lib/i18n/kds-copy.ts`, 684 keys) and a kitchen language selector. This JSON is a **reviewable English source** of those registered strings plus leftover hardcoded copy kitchens can still see.

## Extraction summary

| Measure | Count |
|---|---|
| Translation keys (leaf strings) | **861** |
| Nested under `kds.*` from live `KDS_COPY` | **684** |
| Unique English values inside `KDS_COPY` | **613** (71 exact duplicates, mostly Cancel / Close / Save / Soon / Unlock editing / RWF) |
| Nested under `notYetRegistered` (hardcoded leftovers) | **177** |

### Main KDS areas inspected

- Kitchen dashboard shell, tabs, header metrics, kitchen OPEN/CLOSED, help FAB
- Live orders queue: tickets, stage chips, sort, pagination, bulk actions, reconnect chip
- Dispatch modal, assign-driver modal, drivers CRUD (from Setup)
- Menu tab: list, item modal, photos, sizes, add-ons, archive
- Inventory tab + leftover Stock panel (feature-gated)
- History filters, export, receipts (`/vendor/[slug]/receipt/[orderId]`)
- Profit overlay, customer-updates panel
- Setup drawer, optional checklist, owner-token recovery dialog
- Readiness guide / welcome / contextual screenshots
- Kitchen help accordion + WhatsApp ask
- PWA install hint + KDS web manifest
- Language selector (globe pill)
- Delivery slip page (`/slip/[orderId]`) and WhatsApp slip / vendor-notify templates used from KDS

### Files / directories inspected

- `app/vendor/[slug]/` (page, layout, receipt, KDS PWA manifest)
- `app/slip/[orderId]/page.tsx`
- `components/vendor/*`
- `components/pwa/InstallHintBanner.tsx` (KDS surface)
- `components/onboard/RecoverAccessDialog.tsx` (opened from KDS Setup)
- `components/ui/primitives/Modal.tsx` (Close / Close dialog when used by KDS)
- `lib/i18n/kds-copy.ts`, `kds-labels.ts`, `kds-time.ts`, `kds-localize.ts`, `config.ts`
- `lib/kds/visual-guides.ts`, `stage-styles.ts`
- `lib/vendor/onboarding.ts`, `optional-checklist.ts`, `onboard-options.ts`
- `lib/inventory/types.ts`, `lib/inventory/validation.ts`
- `lib/whatsapp.ts` (delivery slip + vendor paid-order notify)
- `lib/actions/vendor-profile.ts`, `vendor-menu.ts` (errors shown in KDS forms)
- Shared `app/error.tsx` and `app/not-found.tsx` (kitchens can hit these)

### Shared components included

- `Modal` close labels
- `Select` used for language, sort, history chips, inventory filters
- `RecoverAccessDialog` (also used on `/onboard`)
- `InstallHintBanner` (also used on the customer storefront — KDS copy only is in the JSON; storefront variants are listed under Needs Manual Review)
- Country / business / menu category lists shared with onboarding

## How to read `kds.en.json`

- **`kds`**: nested camelCase of the live registered catalog. Values are the current English source of truth in Ops. Placeholders such as `{count}`, `{value1}`, `{order}`, `{page}` are preserved from `KDS_COPY`.
- **`notYetRegistered`**: user-facing English that still lives as hardcoded literals (or shared-shell copy). These will need new keys during a later integration pass.

Internal enums (`NEW`, `PREPARING`, `READY`, …) were **not** extracted as identifiers. Display labels for those enums are under `kds.status` and `kds.labels`.

## Intentionally excluded

- Vendor names, dish names, driver names, order IDs, phone numbers, landmarks, prices as data
- CSS class names, route segments, cookie names, feature-flag ids
- Test fixtures and `.scratch` / preserved worktrees
- Marketing site, storefront checkout, Ops console (except KDS language settings listed for review)
- Storefront-only install-hint sentences (see Needs Manual Review)

## Ambiguous / dynamic strings that need manual review

- **Stage chips vs status badges.** Filters use title-case (`New`) until a status override exists; badges use uppercase (`NEW`). Both are in `kds.labels` and `kds.status`.
- **`Ready`** is both a kitchen stage and a readiness-guide state (`You're ready for orders` / `Complete`).
- **`Soon`** is used for language availability, optional checklist, menu coming-soon rows, and unused driver-status filters.
- **`RWF`** is shown next to amounts (`kds.metricsBanner.rwf`, size editor). Currency code vs translatable word.
- **Receipt `Order status: {status}`** prints the raw order enum (`PAID`, `COMPLETED`) rather than the kitchen-stage labels.
- **Quantity `x`** (`kds.orderTicket.x` = `"x"`) is a separator, not a word.
- **Language selector `aria-label`** is already multilingual by design (`KDS language / Ururimi / Langue / Lugha`).
- **Placeholder examples** (`Jean Claude`, `Inka Steakhouse`, `inka-steakhouse`, `Premium grills`, `30–40 min`) are sample values, not product copy.
- **Help copy mentions PIN `12345`** (simulator). Keep as-is until product decides whether that sentence is production-safe.
- **Vendor WhatsApp notify** starts with a burger emoji (`🍔 NEW PAID ORDER ({orderId})`).
- **Inventory `{label} must be zero or more`** interpolates a field name that itself may be translated later.

## Hardcoded strings that need special handling in later integration

- `VendorUpdatesPanel` compares `error === "Unlock editing to change update settings."` — that English string is a **control-flow identity**, not only display copy.
- `translateKdsLabel` maps exact English literals to `kds.labels.*`. Changing English in the catalog without updating that map (or removing the map) will silently skip translation.
- Size editor interpolates `"Hide"` / `"Show"` into `{value1} {value2} on the storefront`.
- Readiness missing-details line lowercases and strips `"Add your "` / `"Add a "` from English before joining (`Missing: logo, cover photo`). That derivation is English-shaped.
- Kitchen warning joins item ids with `" and "` then substitutes into `finish your {items}` (`menu` / `payment` words).
- History export may show `payload.error` or HTTP status interpolation.
- Inventory / menu / driver / stock panels often display `err.message` from the server.

## Needs Manual Review

Strings that a kitchen might see, but that also belong to another product surface (or are operator-only):

| String | Where | Why it may / may not belong |
|---|---|---|
| "Save restaurants and updates: tap Share, then Add to Home Screen." | `InstallHintBanner` `surface="customer"` | Storefront / restaurant hub, not KDS |
| "Keep saved restaurants and menu updates in one place." | same | Storefront only |
| "KDS languages", "Show the language selector", Soon helper copy | `components/ops/KdsLanguageSettingsForm.tsx` | Operator Settings, not the kitchen UI |
| "Save failed" | Ops KDS language form | Operator error |
| Country names (Rwanda, Kenya, …) | `lib/vendor/onboard-options.ts` via Setup + `/onboard` | Shared; listed under `notYetRegistered.setup.countries` |
| Business categories (Grill / Steakhouse, …) | same, Setup + onboard | Shared |
| Menu categories (Main Course, …) | Setup/menu modal + onboard | Shared; `General` is also a registered placeholder |
| Recover-access dialog copy | Setup + `/onboard?recover=1` | Shared owner-token flow |
| "View demo storefront" | `app/not-found.tsx` | Global 404; kitchens hitting a bad URL see this |
| "We hit a snag loading this page. Please try again." / "Try again" | `app/error.tsx` | Global error boundary |
| "An add-on cannot be selected more than once" and related add-on errors | `lib/menu/add-ons.ts` | Primarily storefront checkout; KDS may see them if save validation reuses the module |
| "Choose a size for this menu item" / "This size is unavailable" | `lib/menu/sizes.ts` | Primarily storefront; "At least one size must be available" **is** a KDS save error and is catalogued |
| `"Coming soon"` / `"All status"` driver filters | Drivers + assign modals | Registered in `KDS_COPY`; UI may be unused / gated |
| Coachmark titles | `KdsDashboard` | Registered, but `KDS_COACHMARKS_ENABLED` is currently `false` |
| Stock panel copy | `StockPanel.tsx` | Registered; tab is remapped to Inventory unless the stock feature flag is on |

## Second-pass check

Re-scanned `components/vendor`, `app/vendor`, `lib/kds`, `lib/i18n/kds-*.ts`, receipt/slip, PWA hint, recover dialog, inventory validation, and KDS-triggered server errors. Remaining English in those files is either already in `kds.*`, listed in `notYetRegistered`, vendor-entered data, or called out above.

No `locales/` directory existed before this pass (runtime copy lives in `lib/i18n/`). Files were added beside the app without changing components.
