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

**Lead** (ADR-0050):
A food business's request for ZanTap setup, captured by the public marketing
form and persisted through the Store. It moves through the operator follow-up
lifecycle `NEW → CONTACTED → ONBOARDED` or `NEW/CONTACTED → CLOSED`.
Its phone is stored as Rwanda-first E.164 digits and `consentAt` records when
the server accepted the contact request.
_Avoid_: vendor (until onboarding creates one), signup, WhatsApp message, prospect

**Prospect** (ADR-0054):
An outbound business ZanTap found and is contacting (Google Maps, Instagram,
referral, etc.). Separate from a Lead. Moves through
`FOUND → CONTACTED → IN_TALKS → CONVERTED`, or exits as `DECLINED` /
`UNREACHABLE`. Each touch is a ProspectInteraction; conversion may link to a
Vendor (and optionally a Lead).
_Avoid_: lead, client, contact (when you mean the pipeline record)

**Feature flag** (ADR-0056):
A per-Vendor boolean that Ops turns on/off to show or hide a KDS/product
surface (`featureWhatsappNotify`, `featureStockTracking`,
`featureProfitInsights`). Defaults off until enabled.
_Avoid_: kill switch (platform-wide), env var, remote config

**Stock** (ADR-0055):
An optional remaining-count on a MenuItem. When set, it decrements on PAID
orders and can mark the dish Sold out at zero. Distinct from ingredient
inventory.
_Avoid_: inventory (ingredient-level), availability (the isAvailable toggle)

**Cost price**:
What a MenuItem costs the Vendor to make, in RWF. Used with sale price to
compute margin on Know Your Profit.
_Avoid_: price (the customer-facing sale price), fee

**Expense**:
A Vendor-logged business cost (gas, ingredients, rent) used with sales to
compute period profit on Know Your Profit.
_Avoid_: cost price (per-dish), fee, payout

**Payment**:
A durable record of money moving for an Order, keyed by a stable `transactionRef` (the STK token in sandbox mode; `manual-{orderId}` in production manual MoMo). Moves through `PENDING → SUCCESS` on valid confirm (which also marks the Order `PAID`), or `PENDING → FAILED` on abandonment. `FAILED` is terminal — not a typoed PIN (sandbox wrong PIN keeps `PENDING`). Manual confirm requires the Customer's phone to match the Order.
_Avoid_: transaction, charge, txn

**Checkout**:
The client-side module (`lib/checkout/`) that owns checkout validation, cart line/total computation, the stage machine, and place-order / MoMo orchestration for the Customer view. Distinct from an Order (which is the server-side commitment) and from the menu **cart** (item quantities only).
_Avoid_: basket, payment flow (when you mean the whole checkout module)

**Menu image**:
A photo attached to a MenuItem. An item has a gallery of images with exactly one **primary** image (shown on the storefront card and KDS); the rest are secondary. Uploaded (primary path) or linked by URL (secondary path). When an item has no images, a generated gradient (`thumbFrom`/`thumbTo`) is the fallback thumbnail.
_Avoid_: photo, picture, asset

**Add-on** (ADR-0071):
An item-specific Customer choice grouped by a Vendor as Optional/Required and
Single/Multiple. The browser sends stable choice IDs; the Store enforces the
group rules, resolves current prices, and snapshots labels/prices on the Order
line. Add-on surcharge is per item unit and quantity multiplies it.
_Avoid_: ingredient removal, shared modifier library, browser-priced option

**Customization**:
The Customer-facing sheet that combines size, persisted Add-ons and special
instructions. The older included-ingredient removal model from ADR-0019 remains
deferred/presentation-only; do not confuse it with the server-priced Add-on seam.
_Avoid_: cart (the sheet emits structured line selections)

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
A server-side log entry (`VendorRecoveryEvent`) emitted each time a Vendor recovers their Owner token via phone-based recovery (storefront slug + signup phone → the token is **immediately re-issued**, not halting the vendor). Operators may review these in the Ops console (ADR-0039). No admin UI reads it yet.
_Avoid_: audit log, recovery request, verification (it does not itself verify anything)

**Operator** (ADR-0039):
ZanTap platform staff with cross-vendor authority via the Operator Control API and `/ops` UI. Not a Vendor. Distinct from the kitchen user on the KDS.
_Avoid_: admin, superuser, vendor

**Operator action** (ADR-0039):
A durable audit record (`OperatorAction`) of an operator intervention — who acted, which vendor, what changed, when. Written on every Control API mutation.
_Avoid_: recovery event (vendor-initiated)

**Suspended vendor** (ADR-0039):
A Vendor with `isActive = false`. Storefront checkout is blocked, kitchen is forced closed, KDS shows a suspended banner. Distinct from an archived menu item.
_Avoid_: deleted, archived

**Operator override** (ADR-0039):
A mutation performed by an Operator through the Control API, bypassing the owner-token guard because operator API auth was validated server-side.
_Avoid_: owner token write, vendor self-service edit

**Access grant** (ADR-0072):
A recipient-specific invitation to the private ZanTap presentation, carrying its own secret, expiry, revocation state, and viewing history. One Access grant represents one intended recipient even when that recipient has not been given a ZanTap account.
_Avoid_: shared password, campaign password, viewer account, public link

**Viewing session** (ADR-0072):
One authorized browser's temporary access under an Access grant. An Access grant may have at most two active Viewing sessions so its recipient can review on a phone and a computer without making the secret effectively unlimited.
_Avoid_: viewer account, login, device registration

**Viewer acknowledgement** (ADR-0072):
The one-time confidentiality notice accepted when a new Viewing session enters the private ZanTap presentation. It names the intended recipient, states the expiry and no-redistribution expectation, then collapses into the persistent recipient/countdown notice.
_Avoid_: terms of service, login consent, cookie banner

**ZanTap Briefing**:
The protected, cinematic presentation that explains ZanTap's opportunity, product, evidence, operating model, and ways to participate to any invited stakeholder. Its main journey is persuasive and its detailed documentation opens contextually without becoming a separate edition.
_Avoid_: pitch deck, investor deck, manual, documentation site, presentation portal

**Briefing evidence** (ADR-0075):
An Operator-approved, dated claim, metric, milestone, testimonial, or authentic visual used to substantiate the ZanTap Briefing. It is a curated snapshot, never a live operational record or generated stand-in for real traction.
_Avoid_: live metric, dashboard data, illustrative testimonial, generated proof

**Briefing version** (ADR-0076):
An immutable published snapshot of the ZanTap Briefing's approved chapters, evidence, media references, and expandable documentation. Each Access grant is pinned to one Briefing version so its recipient's material does not change silently.
_Avoid_: draft, live page, current content, presentation copy

**Briefing interest**:
An invited viewer's request for follow-up after the ZanTap Briefing, classified as Vendor, Investor, Sponsor, Partner, or Other and accompanied by contact details and an optional message.
_Avoid_: Lead, Prospect, signup, Access grant

**Briefing activity** (ADR-0077):
A privacy-limited record of meaningful interaction with an Access grant, such as unlock, Viewing-session use, chapter progress, evidence opening, or Briefing-interest submission. It is engagement history, not a replay or recording of the viewer.
_Avoid_: surveillance, session recording, heatmap, analytics profile

**Adapter**:
A concrete implementation satisfying the Store interface at its seam. Two exist: an in-memory adapter (tests/local dev) and a Prisma/Postgres adapter (production).
_Avoid_: backend, driver, provider
