# ZanTap

A Rwanda-based food-ordering and mobile-money payment app. Customers order from a vendor's glassmorphic storefront and pay via MTN MoMo; vendors run a dark, high-contrast Kitchen Display System (KDS) to accept and dispatch orders.

## Language

**Vendor**:
A restaurant or food business with a storefront, menu, drivers, and a MoMo code. Identified in URLs by a `slug`.
_Avoid_: merchant, seller, restaurant

**Customer view**:
The public storefront at `/[slug]` where a Customer browses the menu and checks out. Glassmorphic styling.
_Avoid_: customer page, frontend, shop

**KDS** (Kitchen Display System):
The vendor-facing screen at `/vendor/[slug]` for accepting, preparing, and dispatching Orders. Matte dark industrial styling, large touch targets.
_Avoid_: dashboard, admin, backend UI

**Order**:
A Customer's basket committed for a Vendor, moving through `PENDING → PAID → DISPATCHED → COMPLETED`.
_Avoid_: cart, basket, purchase

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

**Adapter**:
A concrete implementation satisfying the Store interface at its seam. Two exist: an in-memory adapter (tests/local dev) and a Prisma/Postgres adapter (production).
_Avoid_: backend, driver, provider
