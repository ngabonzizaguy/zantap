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
A Customer's basket committed for a Vendor. **Payment/dispatch lifecycle** moves through `PENDING → PAID → DISPATCHED → COMPLETED`, or `PENDING → CANCELLED` when checkout is abandoned (customer declined payment or the payment window expired). **Kitchen progress** (`kitchenStage`) is tracked separately once paid: `NEW → ACCEPTED → PREPARING → READY → OUT FOR DELIVERY → COMPLETED`. See ADR-0013.
_Avoid_: cart, basket, purchase

**Cancelled order**:
An Order whose checkout was abandoned before MoMo payment succeeded — either the Customer tapped "Didn't pay" or the ten-minute payment window expired. `Payment` is `FAILED`; the Order is `CANCELLED`. It never reaches the KDS queue but appears in vendor History and exports; it is excluded from gross and metrics.
_Avoid_: expired order, abandoned cart

**Kitchen stage**:
Where an Order sits in the vendor's prep-and-handoff workflow on the KDS, independent of whether MoMo payment succeeded. The KDS surfaces kitchen stage as the primary status; payment remains visible but secondary.
_Avoid_: order status (when you mean kitchen progress), workflow step

**MoMo** (MTN Mobile Money):
The mobile-money payment rail. In production, checkout hands off to MTN USSD (*182# dial strings) and the Customer self-confirms payment; locally, checkout simulates an STK push and PIN confirmation. A real MTN API callback integration is future work.
_Avoid_: mobile money, payment provider (when you specifically mean MTN MoMo)

**Manual MoMo payment**:
The interim production checkout path where the Customer dials a prefilled MTN USSD string, returns to the storefront, and self-declares whether payment succeeded (honor system until API access exists). A ten-minute **payment window** applies from order creation; after that, or if the Customer taps "Didn't pay", the Order is **Cancelled**. An in-window order can be resumed via stored checkout state or by re-entering the same phone at checkout. Confirming payment after the window closes is rejected — the Customer must start again.
_Avoid_: STK push (when you mean the real or simulated prompt flow), fake payment

**STK push**:
The prompt sent to a Customer's phone to authorize a MoMo payment, confirmed with a PIN.
_Avoid_: push notification, payment prompt

**Store**:
The server-only data module that owns all persistent reads and mutations (Vendors, Menu, Orders, Payments, Drivers, kitchen state) behind a single interface. The browser never imports it; it is reached through Server Actions or RSC.
_Avoid_: data layer, repository, db, service

**Payment**:
A durable record of money moving for an Order, keyed by a stable `transactionRef` (the STK token in sandbox mode; `manual-{orderId}` in production manual MoMo). Moves through `PENDING → SUCCESS` on valid confirm (which also marks the Order `PAID`), or `PENDING → FAILED` on abandonment. `FAILED` is terminal — not a typoed PIN (sandbox wrong PIN keeps `PENDING`). Manual confirm requires the Customer's phone to match the Order.
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

**Write-secret** (being retired — ADR-0022):
The shared secret (a single env var) that guards abuse-prone vendor write operations (media upload, menu delete) while real authentication is deferred. Entered once in the KDS, kept client-side, and validated server-side on guarded Server Actions. Not real auth. **Being replaced by the per-vendor Owner token** (candidate #16): the data-layer primitive landed in Issue 1; the guard swap that actually removes `assertWriteSecret` happens in Issue 2.
_Avoid_: password, api key, token (when you specifically mean this interim guard)

**Owner token** (ADR-0022):
A per-vendor capability token minted at provision, cached in that vendor's browser (keyed by slug) and **never typed**. Only its sha256 hash is stored on the Vendor (`ownerTokenHash`, server-only — never sent to the browser); the plaintext is returned exactly once. Guarded writes validate the token *against that specific vendor*, so it gives per-vendor isolation the shared Write-secret never had. A bearer capability, not real auth (candidate #12 subsumes it). Minted/verified by `lib/vendor/owner-token.ts`.
_Avoid_: password, api key, write-secret, session (it has no identity or revocation UX)

**Recovery event** (ADR-0022):
A server-side log entry (`VendorRecoveryEvent`) emitted each time a Vendor recovers their Owner token via phone-based recovery (storefront slug + signup phone → the token is **immediately re-issued**, never halting the vendor). It exists purely as the seam the future ZanTap operator/admin panel (candidate #17) will consume for async verification. No admin UI reads it yet.
_Avoid_: audit log, recovery request, verification (it does not itself verify anything)

**Adapter**:
A concrete implementation satisfying the Store interface at its seam. Two exist: an in-memory adapter (tests/local dev) and a Prisma/Postgres adapter (production).
_Avoid_: backend, driver, provider
