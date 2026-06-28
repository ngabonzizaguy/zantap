# ZanTap

A Rwanda-based food-ordering and mobile-money payment app. Customers order from a vendor's glassmorphic storefront and pay via MTN MoMo; vendors run a dark, high-contrast Kitchen Display System (KDS) to accept and dispatch orders.

## Language

**Vendor**:
A restaurant or food business with a storefront, menu, drivers, and a MoMo code. Identified in URLs by a `slug`.
_Avoid_: merchant, seller, restaurant

**Customer view**:
The public storefront at `/[slug]` where a Customer browses the menu and checks out. Styled per the brand design system in `DESIGN.md` (ElevenLabs editorial: off-white canvas, near-black ink, pastel gradient orbs). See ADR-0005.
_Avoid_: customer page, frontend, shop

**KDS** (Kitchen Display System):
The vendor-facing screen at `/vendor/[slug]` for accepting, preparing, and dispatching Orders. Styled per the brand design system in `DESIGN.md` (same ElevenLabs editorial language as the Customer view), keeping large touch targets and high legibility for kitchen use. See ADR-0005.
_Avoid_: dashboard, admin, backend UI

**Order**:
A Customer's basket committed for a Vendor. **Payment/dispatch lifecycle** moves through `PENDING → PAID → DISPATCHED → COMPLETED`. **Kitchen progress** (`kitchenStage`) is tracked separately once paid: `NEW → ACCEPTED → PREPARING → READY → OUT FOR DELIVERY → COMPLETED`. See ADR-0013.
_Avoid_: cart, basket, purchase

**Kitchen stage**:
Where an Order sits in the vendor's prep-and-handoff workflow on the KDS, independent of whether MoMo payment succeeded. The KDS surfaces kitchen stage as the primary status; payment remains visible but secondary.
_Avoid_: order status (when you mean kitchen progress), workflow step

**MoMo** (MTN Mobile Money):
The mobile-money payment rail. Checkout simulates an STK push and PIN confirmation; a real callback integration is future work.
_Avoid_: mobile money, payment provider (when you specifically mean MTN MoMo)

**STK push**:
The prompt sent to a Customer's phone to authorize a MoMo payment, confirmed with a PIN.
_Avoid_: push notification, payment prompt

**Store**:
The server-only data module that owns all persistent reads and mutations (Vendors, Menu, Orders, Payments, Drivers, kitchen state) behind a single interface. The browser never imports it; it is reached through Server Actions or RSC.
_Avoid_: data layer, repository, db, service

**Payment**:
A durable record of money moving for an Order, keyed by a stable `transactionRef` (the STK token in sandbox mode). Moves through `PENDING → SUCCESS` on valid PIN confirm (which also marks the Order `PAID`), or stays `PENDING` on a wrong PIN. `FAILED` is terminal abandonment only — not a typoed PIN.
_Avoid_: transaction, charge, txn

**Checkout**:
The client-side module (`lib/checkout/`) that owns checkout validation, cart line/total computation, the stage machine, and place-order / MoMo orchestration for the Customer view. Distinct from an Order (which is the server-side commitment) and from the menu **cart** (item quantities only).
_Avoid_: basket, payment flow (when you mean the whole checkout module)

**Menu image**:
A photo attached to a MenuItem. An item has a gallery of images with exactly one **primary** image (shown on the storefront card and KDS); the rest are secondary. Uploaded (primary path) or linked by URL (secondary path). When an item has no images, a generated gradient (`thumbFrom`/`thumbTo`) is the fallback thumbnail.
_Avoid_: photo, picture, asset

**Customization** (presentation-only, as of ADR-0019):
The Customer-facing selection surface on a MenuItem's storefront modal — *included
ingredients* (removable) and paid *add-ons*. Today it is **display-only**: choices
and notes affect the modal's shown total but are NOT carried into the cart, Order,
KDS, or receipt (the cart remains item quantities only). A future "real modifiers"
epic would make it a persisted, server-priced part of an Order.
_Avoid_: options, extras, modifiers (when you mean the persisted future model)

**Archived item**:
A MenuItem soft-deleted via `archivedAt`. It disappears from the storefront and the Menu list but is retained for order history and exports; it can be restored. "Deleting" a menu item means archiving it.
_Avoid_: deleted item, removed item, hidden item (hidden = sold-out/unavailable, which is different)

**Write-secret**:
The shared secret (a single env var) that guards abuse-prone vendor write operations (media upload, menu delete) while real authentication is deferred. Entered once in the KDS, kept client-side, and validated server-side on guarded Server Actions. Not real auth.
_Avoid_: password, api key, token (when you specifically mean this interim guard)

**Adapter**:
A concrete implementation satisfying the Store interface at its seam. Two exist: an in-memory adapter (tests/local dev) and a Prisma/Postgres adapter (production).
_Avoid_: backend, driver, provider
