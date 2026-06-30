# ZanTap Platform — Product Feature Inventory & Functional Specification

**Status:** ready-for-agent  
**Triage:** ready-for-agent  
**Last audited:** 2026-06-30  
**Purpose:** Baseline inventory of the ZanTap platform as it exists today — foundation for designing a fast, low-friction vendor onboarding flow. No recommendations or redesigns; documentation only.

---

## Problem Statement

Before redesigning or implementing vendor onboarding, the team needs a single, authoritative picture of what ZanTap already ships: every customer-facing capability, every KDS capability, every configurable entity, the data model, the order lifecycle, and which vendor inputs are truly required to accept paid orders.

## Solution

A structured product specification derived from full codebase inspection (routes, Store seam, Prisma schema, Server Actions, and UI components). This document is the source of truth for onboarding scope decisions.

---

## User Stories

1. As a product owner, I want a complete customer storefront inventory, so that onboarding does not duplicate or miss existing capabilities.
2. As a product owner, I want a complete KDS inventory, so that the vendor dashboard scope is understood.
3. As a product owner, I want a list of everything a vendor can configure today, so that onboarding only asks for what has no UI elsewhere.
4. As a product owner, I want the data model and entity relationships documented, so that onboarding forms align with persistence.
5. As a product owner, I want the end-to-end order lifecycle described against real code paths, so that onboarding milestones match operational reality.
6. As a product owner, I want vendor inputs classified as required-now vs deferrable, so that a ~1-minute go-live path is feasible.
7. As a platform engineer, I want to know which features are complete vs partial vs placeholder, so that onboarding promises match production behavior.
8. As a vendor, I want my storefront at `/[slug]` to show my menu and accept MoMo payment (when configured).
9. As a vendor, I want the KDS at `/vendor/[slug]` to surface paid orders and kitchen workflow.
10. As a vendor, I want to manage menu items, availability, and images from the KDS.
11. As a vendor, I want order history, filtering, export, and printable receipts.
12. As a vendor, I want a setup checklist and coachmarks for first-time orientation.
13. As a customer, I want to browse a restaurant menu, add items to a cart, and pay via MoMo.
14. As a customer, I want to enter delivery sector and landmark at checkout.
15. As a customer, I want confirmation after successful payment with order reference and delivery summary.
16. As a moto driver, I want a delivery slip with items, address, and customer phone (via KDS dispatch or `/slip/[orderId]`).
17. As an operator, I want today's gross revenue and active-order counts on the KDS header.
18. As an operator, I want live order updates without manual refresh (SSE stream).
19. As an operator, I want bulk kitchen-stage advances for multiple tickets.
20. As an operator, I want to dispatch orders to drivers via WhatsApp-shareable slips.
21. As a developer, I want all persistence through the server-only Store seam, so onboarding does not introduce competing data paths.
22. As a security reviewer, I want to know that vendor writes are guarded by a shared write-secret (not real auth), so onboarding security expectations are accurate.
23. As a product owner, I want explicit out-of-scope items listed (no vendor signup UI, no real MoMo, no customer order tracking), so onboarding does not imply missing features.

---

# Part 1 — Customer Storefront (`/[vendor-slug]`)

Public customer view. Styled with legacy `zt-*` blush-glass tokens (DESIGN.md migration for customer view is backlog candidate #10). Data loaded server-side via Store; checkout is client-side (`lib/checkout/`).

## 1.1 Discovery & routing

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Vendor slug routing | Each vendor has a unique URL `/{slug}` | **Complete** | Vendor record with unique `slug` | Unknown slug → `not-found` |
| Home redirect | Root `/` redirects to demo vendor | **Complete** | Seed vendor `inka-steakhouse` | Not a marketplace landing page |
| Vendor not-found | Editorial 404 when slug missing | **Complete** | `app/not-found.tsx` | DESIGN.md tokens |

## 1.2 Restaurant profile & hero

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Restaurant name | Primary identity on hero | **Complete** | `Vendor.name` | |
| Tagline | Subtitle above name | **Complete** | `Vendor.tagline` | Defaults to "Premium grills" if unset |
| Location chip (top bar) | Shows service area | **Complete** | `Vendor.location` | Defaults to "Kigali, Rwanda" |
| Delivery time estimate | Sets expectation | **Complete** | `Vendor.deliveryTime` | Defaults to "30–40 min" |
| Star rating display | Social proof | **Partial** | `Vendor.rating` | Static number only; no review system. Defaults to 4.8 in UI if unset |
| "Free delivery" badge | Marketing copy on hero | **Placeholder** | None | Hardcoded in Hero; not configurable |
| Brand icon | Decorative logo placeholder | **Complete** | Static SVG | Not vendor-uploaded logo |
| Share storefront button | Share link to customers | **Placeholder** | None | Button renders; no `onClick` / Web Share API |
| Top bar menu button | Navigation / menu | **Placeholder** | None | Renders; no handler |

## 1.3 Menu browsing

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Menu list | Show orderable dishes | **Complete** | `getAvailableMenu` | Excludes archived and `isAvailable: false` items |
| Category chips | Filter menu by category | **Complete** | `getCategories` | "All" + vendor categories; categories derived from menu items |
| Dish count | Shows filtered item count | **Complete** | Client filter | |
| Menu item card | Name, description, price, thumb | **Complete** | MenuItem fields | Tap opens customize sheet; + adds one unit |
| Cart quantity badge on card | Shows how many in cart | **Complete** | `CartContext` | Per menu item id |
| Generated gradient thumbnails | Fallback when no image | **Complete** | `thumbFrom` / `thumbTo` | Auto-assigned on create in some paths |
| Image gallery carousel | Swipeable multi-image thumb | **Complete** | `MenuImage` gallery, ≥2 images | Scroll-snap; single image = static thumb |
| Empty category state | No items in filter | **Complete** | Client | Shows empty list (0 dishes) |

## 1.4 Product customization modal

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Customize sheet (bottom sheet) | Item detail + options UI | **Complete** | `MenuItemCustomizeSheet` | Drag-to-dismiss gesture |
| Photo strip / carousel in modal | Larger item imagery | **Complete** | Gallery URLs | |
| Included ingredients (removable) | Show what can be removed | **Partial** | `ItemCustomization` or generic fallback | **Display-only** — not persisted to cart/order (ADR-0019) |
| Paid add-ons | Upsell extras | **Partial** | Generic fallback catalog | **Display-only** — modal total includes add-ons but cart does not |
| Quantity stepper | Pick how many | **Complete** | Client state | Only qty flows to cart |
| Special instructions (notes) | Customer free text | **Partial** | 200 char max | **Not persisted** to order |
| Customize total display | Running price in modal | **Complete** | `computeCustomizeTotal` | Client-only; not order total |
| Add to order | Commit selection to cart | **Partial** | Cart chokepoint in Storefront | Adds `qty` base items only; discards modifiers/notes |

## 1.5 Cart

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Client cart state | Track item quantities | **Complete** | `CartContext` | `Record<menuItemId, number>` — no line-item metadata |
| Quick add (+) from card | Increment without opening modal | **Complete** | `addItem` | |
| Sticky cart bar | Persistent cart summary | **Complete** | Checkout totals | Hidden when count = 0 |
| Line items in checkout | Review cart contents | **Complete** | `computeLines` | Name, qty, line subtotal |
| Increment/decrement in checkout | Adjust quantities | **Complete** | `addItem` / `removeItem` | |

## 1.6 Checkout & delivery

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Checkout bottom sheet | Review order + delivery fields | **Complete** | Checkout stage machine | Stages: menu → cart → loading → ussd → success |
| Customer phone | MoMo STK target + contact | **Complete** | Normalized via `normalizePhone` | Min 10 digits to enable Pay |
| Delivery sector picker | Kigali sector selection | **Complete** | `KIGALI_SECTORS` constant | 8 fixed sectors |
| Landmark / address detail | Delivery instructions | **Complete** | Free text | Required to pay |
| Pay validation gate | Block incomplete checkout | **Complete** | `canProceedToPay` | count > 0, phone, sector, landmark |
| Loading state ("Contacting MoMo…") | Payment initiation feedback | **Complete** | `checkout.stage === "loading"` | ~2s simulated STK delay |

## 1.7 Payment (MoMo)

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Order creation on Pay | Persist PENDING order | **Complete** | `placeOrder` → Store | Before STK push |
| STK push simulation | Initiate mobile money prompt | **Complete** | `lib/momo/simulate` | Not production MTN API |
| USSD / PIN modal | Customer enters MoMo PIN | **Complete** | `UssdModal` | Sandbox PIN `12345` |
| PIN confirmation | Mark payment SUCCESS + order PAID | **Complete** | `confirmPayment` → Store | Sets `kitchenStage: NEW`, `paidAt` |
| Wrong PIN retry | User can re-enter | **Complete** | Returns retry, stays on ussd stage | |
| Payment failure handling | Failed STK returns to cart | **Complete** | `executePay` failed branch | |
| Airtel Money | Alternative provider | **Placeholder** | `PaymentProvider` enum | Only `MTN_MOMO` used in checkout |

## 1.8 Post-payment & order tracking

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Success receipt screen | Confirm payment to customer | **Complete** | `SuccessReceipt` | Order id, amount, delivery summary |
| Kitchen transmission message | Set expectation | **Complete** | Copy only | No live tracking |
| Place another order | Reset checkout + cart | **Complete** | `handleReset` | |
| Customer order status page | Track prep/delivery | **Not implemented** | — | No `/order/[id]` customer view |
| SMS / push notifications to customer | Delivery updates | **Not implemented** | — | |
| Email receipts | Post-order email | **Not implemented** | — | |

## 1.9 Store status & availability

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Hide sold-out items | Don't show unavailable dishes | **Complete** | `isAvailable` filter | |
| Kitchen open/closed gate | Block orders when kitchen closed | **Not implemented** on storefront | `Vendor.kitchenOpen` | KDS coachmark claims customers cannot order when closed; **customer UI does not check** |
| Vendor inactive gate | Block inactive vendors | **Partial** | `Vendor.isActive` | Used in `isKitchenOpen` read; storefront does not 404 inactive vendors |

## 1.10 UX, responsive & states

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Mobile-first layout | Phone-optimized storefront | **Complete** | `max-w-customer` | |
| Atmospheric gradient orbs | Brand background | **Complete** | `Orbs` component | |
| Glassmorphic panels | Card aesthetic | **Complete** | `GlassPanel`, `zt-*` | |
| Error boundary page | Recoverable errors | **Complete** | `app/error.tsx` | DESIGN.md tokens |
| Scrollbar hiding | Cleaner mobile scroll | **Complete** | `zt-hidescroll` | |

## 1.11 Not present on storefront

- Customer accounts / login
- Reviews submission or listing
- Promotions / coupons
- Delivery fee calculation (total = sum of menu prices only)
- Pickup vs delivery mode
- Scheduled / future orders
- Multi-vendor marketplace browse
- Language selection

---

# Part 2 — Vendor Kitchen Dashboard (KDS) (`/vendor/[vendor-slug]`)

Vendor-facing kitchen display. Dark operational theme (`.kds-dark`, ADR-0017). Four tabs: Orders, Menu, History, Setup.

## 2.1 Shell & navigation

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| KDS routing | Vendor kitchen URL | **Complete** | Vendor slug | `?tab=orders\|menu\|history\|setup` deep link |
| Tab navigation | Switch major areas | **Complete** | `Tabs` component | |
| Metrics banner (sticky header) | Operational snapshot | **Complete** | SSE snapshot | |
| Setup floating ? button | Reopen setup drawer | **Complete** | Fixed position | |
| Live SSE indicator | Real-time updates | **Complete** | `useKdsLiveSnapshot` | Reconnect backoff; self-close at ~250s |
| SSE reconnecting state | User feedback on disconnect | **Complete** | Orders list banner | |

## 2.2 Dashboard metrics

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Today's gross (RWF) | Revenue today | **Complete** | `getTodayGross` | Counts PAID + DISPATCHED + COMPLETED created today |
| Gross trend % vs yesterday | Performance indicator | **Placeholder** | Hardcoded "+12.5%" | Not backed by data |
| Sparkline chart | Visual trend | **Placeholder** | Static SVG points | |
| Active orders count | In-flight paid orders | **Complete** | PAID + DISPATCHED count | |
| Queue breakdown (New / Prep / Ready) | Stage counts | **Complete** | Kitchen stage grouping | |
| Kitchen OPEN / CLOSED toggle | Accept orders signal | **Complete** | `setKitchen` | **Does not block customer checkout** |
| Vendor name in header | Identity | **Complete** | `Vendor.name` | Labelled "ZanTap Kitchen" |

## 2.3 Orders tab — queue & workflow

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Paid-order queue | Show kitchen work | **Complete** | `fetchKdsSnapshot` | Only PAID, DISPATCHED, COMPLETED; **PENDING hidden** |
| Stage filter chips | Filter by kitchen stage group | **Complete** | new / preparing / ready / completed / all | |
| Sort direction | Oldest vs newest within stage | **Complete** | `sortKdsQueueOrders` | By `paidAt` |
| Order ticket (collapsed) | Summary row | **Complete** | Order id, stage badge, item count, phone, total | |
| Order expansion | Line items + actions | **Complete** | Tap ticket | |
| Kitchen stage badges | Visual stage | **Complete** | NEW → ACCEPTED → PREPARING → READY → OUT FOR DELIVERY → COMPLETED | |
| Stage advance buttons | Forward-only workflow | **Complete** | `advanceKitchenStage` | Monotonic; server-validated |
| Paid age / urgency rings | Highlight waiting orders | **Complete** | `formatRelativeTime`, `getPaidAgeUrgency` | warning/critical rings |
| MoMo paid badge | Payment confirmation | **Complete** | Order `status` gated | Only when actually PAID+ |
| Dispatch moto driver | Hand off to delivery | **Complete** | Opens `DispatchModal` | From READY stage path |
| Mark completed | Close order | **Complete** | From OUT FOR DELIVERY | Sets COMPLETED |
| Bulk select mode | Multi-ticket selection | **Complete** | Checkbox on tickets | Excludes out-for-delivery/completed |
| Bulk action bar | Mass stage advance | **Complete** | Mark Preparing / Ready / Completed | |
| Empty queue states | No orders messaging | **Complete** | Different copy when kitchen closed | |
| Kitchen closed banner on orders | Operational notice | **Complete** | When `kitchenOpen === false` | Informational only |

## 2.4 Dispatch workflow

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Dispatch modal | Driver handoff UI | **Complete** | Order + drivers | |
| Customer phone (tap-to-call) | Contact customer | **Complete** | `tel:` link | |
| Driver list (tap-to-call) | Contact moto drivers | **Complete** | `Driver` seed data | Read-only; no driver CRUD UI |
| Delivery slip preview | Text slip for driver | **Complete** | `buildDeliverySlip` | |
| Copy slip | Clipboard | **Complete** | | |
| Share to WhatsApp | Open wa.me with slip | **Complete** | Advances to OUT FOR DELIVERY on share | |
| Public slip page | `/slip/[orderId]` | **Partial** | Store `getOrder` | **Hardcodes demo vendor name** for slip header |

## 2.5 Menu tab (inventory / availability)

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Menu item grid | All active items | **Complete** | KDS snapshot menu | Includes sold-out items |
| Sold-out toggle per item | Quick 86 | **Complete** | `toggleItem` | Optimistic UI |
| Mark all available | Reset sold-outs | **Complete** | `resetMenu` | |
| Add menu item | Create dish | **Complete** | `createMenuItem` + write-secret | |
| Edit menu item | Update fields | **Complete** | `updateMenuItem` | |
| Archive (soft delete) | Remove from storefront | **Complete** | `archiveMenuItem` | Retained for history |
| Archived items view | Restore deleted items | **Complete** | `loadArchivedMenu` / `restoreMenuItem` | Filter tab |
| Image gallery management | Upload, URL, reorder, primary | **Complete** | Vercel Blob + `MenuImage` | Write-secret guarded |
| Write-secret prompt | Gate destructive writes | **Complete** | `VENDOR_WRITE_SECRET` env | Client-stored per device |
| Category on item form | Assign category string | **Complete** | Free-text + suggestions | No standalone category manager UI |
| Coachmark: add first dish | Onboarding tip | **Complete** | `Coachmark` | Once per browser |

## 2.6 History tab

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Paginated order history | Past orders | **Complete** | `loadOrderHistory` | Default last 30 days |
| Date presets | today / yesterday / last7 / last30 / custom | **Complete** | `OrderHistoryFilters` | Africa/Kigali timezone |
| Status filter | Order status | **Complete** | PENDING through COMPLETED | |
| Payment status filter | Payment state | **Complete** | PENDING / SUCCESS / FAILED | |
| Search | Phone or order id | **Complete** | Partial match | |
| Receipt link per row | Printable receipt | **Complete** | `/vendor/[slug]/receipt/[orderId]` | |
| CSV export | Download orders | **Complete** | `/api/vendor/[slug]/export?format=csv` | Write-secret required |
| XLSX export | Excel download | **Complete** | Same API, format=xlsx | Row cap enforced |
| Pagination controls | Navigate pages | **Complete** | Page size constant | |

## 2.7 Setup tab & onboarding guides

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Setup drawer | Checklist + settings | **Complete** | `SetupDrawer` | Opens from tab or ? button |
| Onboarding checklist (5 steps) | Progress tracking | **Complete** | `deriveOnboardingState` | Menu item, photo, kitchen open, first paid order, first dispatch |
| Progress bar | Visual completion | **Complete** | | |
| Write secret entry | Enable menu/export writes | **Complete** | localStorage via `useWriteSecret` | |
| Show tips again | Reset coachmarks | **Complete** | `resetCoachmarks` | |
| Coachmark: kitchen toggle | First-use hint | **Complete** | | |
| Coachmark: dispatch | First-use hint | **Complete** | Orders tab when expanded | |

## 2.8 Receipts & printing

| Feature | Purpose | Status | Dependencies | Notes |
|---------|---------|--------|--------------|-------|
| Vendor receipt page | Branded order receipt | **Complete** | RSC + Store | Items, total, payment ref, delivery |
| Print button | Browser print | **Complete** | `PrintReceiptButton` | Print CSS |
| Back to history | Navigation | **Complete** | `ReceiptBackButton` | `?tab=history` deep link |

## 2.9 Not present on KDS

- Vendor profile / branding editor
- Driver CRUD
- Opening hours schedule
- Analytics beyond today's gross
- Staff accounts / roles
- Push notifications (browser or native)
- Inventory quantity tracking (only sold-out boolean)
- Ingredient / modifier management (storefront customization not wired)
- Tax configuration
- Payment settings UI (momo code is DB-only)
- Multi-location / branches
- Real authentication (login)

---

# Part 3 — Business Configuration

What a vendor can configure today, and how.

## 3.1 Configurable via database / seed (no KDS UI)

| Entity / field | How set today | Notes |
|----------------|---------------|-------|
| Vendor `name` | Seed / manual DB | Required |
| Vendor `slug` | Seed / manual DB | Unique URL key; required |
| Vendor `phoneNumber` | Seed / manual DB | Required |
| Vendor `momoCode` | Seed / manual DB | Required in schema; not shown in checkout UI |
| Vendor `isActive` | Seed / manual DB | Default true |
| Vendor `tagline` | Seed / manual DB | Optional |
| Vendor `location` | Seed / manual DB | Optional; shown on storefront |
| Vendor `deliveryTime` | Seed / manual DB | Optional |
| Vendor `rating` | Seed / manual DB | Optional static number |
| Drivers (name, phone, initials, hue) | Seed / manual DB | Read-only in KDS dispatch |

## 3.2 Configurable via KDS (vendor self-service)

| Entity / action | UI location | Guard |
|-----------------|-------------|-------|
| Kitchen open/closed | Metrics banner toggle | None |
| Menu item create | Menu tab → Add item | Write-secret |
| Menu item edit (name, price, description, category) | Menu tab → tap item | Write-secret |
| Menu item archive / restore | Menu tab | Write-secret |
| Item availability (sold out) | Menu tab toggle | None |
| Mark all items available | Menu tab | None |
| Menu images (upload, URL, reorder, primary, remove) | Item edit modal gallery | Write-secret + Blob token |
| Write secret (device) | Setup drawer | Matches env `VENDOR_WRITE_SECRET` |
| Order history filters | History tab | None |
| Order export CSV/XLSX | History tab | Write-secret |
| Kitchen stage advances | Orders tab | None |
| Bulk stage advances | Orders tab | None |

## 3.3 Platform / operator configuration (environment)

| Config | Purpose |
|--------|---------|
| `DATABASE_URL` / `DIRECT_URL` | Persistence (Prisma adapter) |
| `VENDOR_WRITE_SECRET` | Guards menu mutations, archive, export |
| `BLOB_READ_WRITE_TOKEN` | Menu image uploads to Vercel Blob |
| MoMo simulation | No prod API keys; sandbox PIN `12345` |

## 3.4 Not configurable anywhere in product UI

- Opening hours
- Delivery zones / fees / radius
- Brand logo upload
- Payment provider selection (Airtel vs MTN)
- Taxes
- Staff / team members
- Notifications preferences
- Languages / locales
- Ingredient catalogs / real modifiers
- Category rename (Store supports `renameCategory`; **no KDS UI**)
- Vendor creation / signup
- Customer review collection

---

# Part 4 — Data Model

## 4.1 Entity summary

```
Vendor 1──* MenuItem 1──* MenuImage
  │              │
  │              └──* OrderItem *──1 Order 1──0..1 Payment
  ├──* Order
  └──* Driver
```

### Vendor

Restaurant business. Fields: `id`, `name`, `slug` (unique), `phoneNumber`, `momoCode`, `isActive`, `kitchenOpen`, optional `tagline`, `location`, `deliveryTime`, `rating`, timestamps.

### MenuItem

Sellable dish. Belongs to one Vendor. Fields: `name`, `description`, `priceRwf` (integer), `category` (string, default "General"), `isAvailable`, optional legacy `imageUrl`, gradient `thumbFrom`/`thumbTo`, `archivedAt` (soft delete). Optional in-memory-only `customization` catalog (not in Prisma).

### MenuImage

Gallery photo for a MenuItem. Fields: `url`, optional `blobPath`, `sortOrder`, `isPrimary`. First image becomes primary; dual-writes legacy `imageUrl`.

### Order

Customer commitment. Fields: `customerPhone`, `deliverySector`, `landmark`, `totalAmount`, `status` (PENDING | PAID | DISPATCHED | COMPLETED), optional `kitchenStage`, optional `paidAt`, timestamps. Contains `OrderItem` lines.

### OrderItem

Line on an order: `menuItemId`, `quantity`, `unitPriceRwf` (snapshot at order time). No modifier/note fields.

### Payment

MoMo payment record. One per order. Fields: `amount`, `provider` (MTN_MOMO | AIRTEL_MONEY), `transactionRef` (unique STK token), `status` (PENDING | SUCCESS | FAILED).

### Driver

Delivery rider for dispatch UI. Fields: `name`, `phone`, `initials`, `hue` (avatar color). Seed-only; no CRUD.

## 4.2 Lifecycle enums

**Order.status** (payment/dispatch lifecycle):  
`PENDING` → `PAID` → `DISPATCHED` → `COMPLETED`

**Order.kitchenStage** (kitchen progress, set at payment):  
`NEW` → `ACCEPTED` → `PREPARING` → `READY` → `OUT_FOR_DELIVERY` → `COMPLETED`

Stage advances are forward-only. `OUT_FOR_DELIVERY` sets status `DISPATCHED`; `COMPLETED` stage sets status `COMPLETED`.

**Payment.status**:  
`PENDING` → `SUCCESS` (valid PIN) or remains `PENDING` (wrong PIN); `FAILED` is terminal abandonment only.

## 4.3 Key relationships & rules

- Orders reference MenuItems at line level; archived items remain on historical orders.
- KDS visibility: only orders with status PAID, DISPATCHED, or COMPLETED.
- Today's gross includes orders in PAID, DISPATCHED, COMPLETED created since local midnight.
- Cart is client-only quantities until `placeOrder` persists Order + OrderItems.
- All reads/writes go through the **Store** interface (in-memory or Prisma adapter).

---

# Part 5 — User Journey (Order Lifecycle)

Current implementation path from discovery to completion.

## 5.1 Customer discovers restaurant

1. Customer opens `https://{host}/{vendor-slug}` (or `/` → demo redirect).
2. Server loads Vendor via `getVendorBySlug`; 404 if missing.
3. Server loads `getAvailableMenu` + `getCategories`.
4. Storefront renders hero, categories, menu cards.

## 5.2 Customer browses menu

1. Customer scrolls menu; optional category chip filter (client-side).
2. Sold-out items already excluded server-side.
3. Tap card → customize sheet opens (or + for quick add).

## 5.3 Customer customizes meal

1. Customize sheet shows images, generic or item-specific customization UI.
2. Customer adjusts qty, optional removals/add-ons/notes (UI only).
3. "Add to order" → `handleAddToOrder` adds `qty` units of base item to cart (modifiers discarded).

## 5.4 Customer builds cart & opens checkout

1. Sticky cart bar appears when count > 0.
2. "Review order" → checkout sheet (`stage = cart`).
3. Customer adjusts quantities, enters phone, picks Kigali sector, enters landmark.

## 5.5 Customer places order & pays

1. Tap Pay → `stage = loading`.
2. `placeOrder` Server Action → Store `createOrder` → Order `PENDING`, lines with unit prices, total computed server-side.
3. `initiateStkPush` → Store `createPayment` → Payment `PENDING`, returns STK token.
4. `stage = ussd` → customer enters PIN in modal.
5. `confirmStkPin` → Store `confirmPayment`:
   - Valid PIN (`12345` in sandbox): Payment `SUCCESS`, Order `PAID`, `kitchenStage = NEW`, `paidAt = now`.
   - Invalid PIN: message shown; customer can retry.
6. `stage = success` → SuccessReceipt with order id, delivery info.

## 5.6 Kitchen receives order

1. KDS initial load via `fetchKdsSnapshot` (paid orders only).
2. SSE `/api/vendor/{slug}/kds-stream` pushes snapshot updates on fingerprint change.
3. New PAID order appears in queue as stage NEW.
4. Metrics: active count + today's gross update.

## 5.7 Preparation

1. Vendor expands ticket; sees line items, customer phone, delivery sector/landmark, MoMo paid badge.
2. Vendor advances stages: ACCEPTED → PREPARING → READY (forward-only buttons or bulk bar).
3. Urgency rings escalate with wait time since `paidAt`.

## 5.8 Dispatch

1. From READY, vendor taps "Dispatch moto driver".
2. Dispatch modal: call customer, call seeded drivers, copy/share delivery slip.
3. "Copy & Share to WhatsApp" → order advances to OUT FOR DELIVERY (`DISPATCHED`), modal closes.

## 5.9 Completion

1. Vendor marks OUT FOR DELIVERY → COMPLETED (or bulk "Mark Completed").
2. Order leaves active queue; remains in History with filters/export/receipt.
3. Customer has no further in-app tracking; success screen is terminal.

## 5.10 Parallel / optional paths

- **Abandoned payment:** Order stays PENDING; never appears on KDS.
- **Vendor receipt:** History → receipt page → print.
- **Driver slip URL:** `/slip/{orderId}` (public, no auth).
- **Vendor toggles kitchen closed:** KDS shows closed state; customers can still order today.

---

# Part 6 — Required Vendor Inputs

Classification for onboarding form design (accept paid orders on platform).

## 6.1 Required before going live

| Input | Why required | Current setup path |
|-------|--------------|-------------------|
| **Business name** (`Vendor.name`) | Storefront hero, receipts, slips | DB/seed only |
| **URL slug** (`Vendor.slug`) | Storefront + KDS routes | DB/seed only |
| **Vendor phone** (`Vendor.phoneNumber`) | Operational contact (not yet used in automated notifications) | DB/seed only |
| **MoMo merchant code** (`Vendor.momoCode`) | Schema requirement; future real MoMo | DB/seed only |
| **At least one menu item** with name + price | Nothing to order otherwise | KDS Menu tab |
| **Item availability** | At least one `isAvailable: true` item | Default true on create |
| **Platform write secret alignment** | Menu CRUD, images, export | Operator sets `VENDOR_WRITE_SECRET`; vendor enters in Setup drawer |
| **Database connectivity** | Production persistence | Operator env |
| **`isActive: true`** | Vendor operational flag | Default true |

**Minimum viable go-live (code-enforced):** Vendor record + slug + ≥1 available menu item with price. Payment works via simulated MoMo without extra vendor config.

## 6.2 Can be completed later (from dashboard)

| Input | Default / fallback | Where to complete |
|-------|-------------------|-------------------|
| Tagline | "Premium grills" | DB today; no UI |
| Location | "Kigali, Rwanda" | DB today; no UI |
| Delivery time | "30–40 min" | DB today; no UI |
| Rating | 4.8 in UI | DB today; no UI |
| Menu photos | Gradient thumbnails | KDS image gallery |
| Descriptions | Hidden/empty | KDS item edit |
| Categories | "General" | KDS item form |
| Kitchen open toggle | Default open | KDS header |
| Drivers | Empty list in dispatch | DB/seed today |
| Onboarding checklist steps | Self-serve | Setup drawer |
| Order history / export | Available when orders exist | History tab |
| Archived item management | When needed | Menu tab |

## 6.3 Optional (no impact on core order flow)

| Input | Notes |
|-------|-------|
| Per-item customization catalog | Not persisted; generic fallback works |
| Multi-image galleries | Single gradient works |
| Bulk kitchen workflows | Operational efficiency only |
| Coachmarks / tips reset | UX polish |
| Receipt printing | Post-order admin |
| Export formats | Reporting |
| `BLOB_READ_WRITE_TOKEN` | Only if uploading images (URL images work without Blob) |

## 6.4 Operator-only (not vendor self-service today)

- Vendor record creation
- `slug` assignment / collision check
- `VENDOR_WRITE_SECRET` rotation
- `BLOB_READ_WRITE_TOKEN`
- Driver records
- `isActive` suspension

---

# Part 7 — Structured Product Specification Summary

## Platform surfaces

| Surface | Route | Audience |
|---------|-------|----------|
| Customer storefront | `/{slug}` | Customers |
| Vendor KDS | `/vendor/{slug}` | Kitchen staff |
| Delivery slip | `/slip/{orderId}` | Drivers (public) |
| Vendor receipt | `/vendor/{slug}/receipt/{orderId}` | Vendor / customer service |
| Order export API | `/api/vendor/{slug}/export` | Vendor (write-secret) |
| KDS SSE stream | `/api/vendor/{slug}/kds-stream` | KDS client |
| MoMo STK API | `/api/momo/stk` | Checkout (simulated) |

## Architectural seams (for future onboarding work)

| Seam | Role |
|------|------|
| **Store** (`lib/store/`) | Single server-only persistence interface |
| **Server Actions** (`lib/actions/`) | Browser → Store mutations |
| **Checkout module** (`lib/checkout/`) | Customer cart, validation, stage machine, pay orchestration |
| **MoMo simulate** (`lib/momo/`) | STK + PIN; swaps for real MTN later |
| **KDS snapshot + SSE** | Live kitchen feed |
| **Write-secret** | Interim vendor write guard until real auth (candidate #12) |

## Maturity snapshot

| Area | Maturity |
|------|----------|
| Core order + MoMo sim + KDS queue | Production-shipped |
| Menu CRUD + images + archive | Production-shipped |
| History + export + receipts | Production-shipped |
| Kitchen workflow + bulk + dispatch | Production-shipped |
| Storefront customization modal | UI complete; **not persisted** |
| Vendor self-registration / profile edit | **Not built** |
| Real MTN MoMo | **Not built** (candidate #11) |
| Customer order tracking | **Not built** |
| Kitchen-closed order blocking | **Not enforced** on storefront |
| Authentication | **Not built** (write-secret only) |

---

## Implementation Decisions

- Inventory produced by static analysis of routes, Prisma schema, Store interface, Server Actions, and React components — no code changes.
- Domain vocabulary follows `CONTEXT.md` (Vendor, Customer view, KDS, Order, Kitchen stage, MoMo, Store, Payment, Checkout, Menu image, Customization, Archived item, Write-secret, Adapter).
- ADRs referenced where behavior is decision-backed: ADR-0013 (kitchen stage), ADR-0017 (KDS dark theme), ADR-0018 (carousel), ADR-0019 (customization display-only).
- **No new code seams proposed** — this document is read-only reconnaissance for onboarding PRD follow-up.
- Vendor creation is operator/seed path only; onboarding design must add a creation seam or external provisioning step.

## Testing Decisions

- This inventory is not test code; verification is manual cross-check against codebase on 2026-06-30.
- For future onboarding features, prefer contract tests on Store (pattern: `lib/store/__tests__/contract.ts`) and orchestration tests on checkout (`lib/checkout/__tests__/`).
- Good tests assert external behavior (order appears on KDS after PAID, menu item on storefront after create) not implementation details.

## Out of Scope

- Onboarding flow design or UI mockups
- Recommendations, prioritization, or gap remediation
- Live MTN MoMo integration spec
- Vendor authentication spec
- Customer DESIGN.md migration
- Marketplace / multi-vendor discovery

## Further Notes

- **Demo vendor:** `inka-steakhouse` is the seeded reference tenant (`lib/store/seed-data.ts`).
- **Write-secret vs auth:** Single global env secret shared across vendors in current deployment model — onboarding must clarify per-vendor secrets when auth lands.
- **Coachmark copy vs code:** Setup says customers cannot order when kitchen is closed; storefront does not enforce — document as known product gap for onboarding UX copy.
- **Slip page vendor name:** `/slip/[orderId]` uses `DEMO_VENDOR_SLUG` for vendor name lookup, not order's vendor — bug/limitation for multi-vendor slips.
- **Flow design:** `.scratch/vendor-onboarding/FLOW.md` (provisioning seam, field classification, wizard steps).
- **ADR:** `docs/adr/0020-vendor-provisioning-store-create-vendor.md`.
- **Issues:** `01-store-vendor-provision` → `02-provision-actions-and-guard` → `03-onboard-wizard-ui`; `04-kds-setup-profile-and-copy` (parallel after 01).
