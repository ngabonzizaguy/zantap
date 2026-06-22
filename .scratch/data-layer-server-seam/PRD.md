# PRD: Collapse the data layer behind a server-only Store seam

Status: ready-for-agent
Feature slug: data-layer-server-seam
Source: /improve-codebase-architecture → candidate #1 → /grill-with-docs

## Problem Statement

Today the same `lib/data` module is imported from both the browser and the server. Because module-scoped state (`orders`, `menuItems`, `kitchenOpen`) lives per JavaScript realm, each realm gets its own copy of the data. The concrete pain:

- A Customer checks out — the Order is created in the **browser's** copy of the Store.
- MoMo PIN confirmation runs on the **server** and looks up the Order in the **server's** copy, where it may not exist.
- The KDS, in yet another browser tab, polls **its own** copy and never sees the new Order.

On Vercel's serverless runtime this is worse still: even server-only module state is not shared across function invocations. The result is paid Orders that the KDS never displays — the single highest-risk bug in the app, and the foundation every later feature (real MoMo callbacks, KDS live sync, Prisma types) silently assumes is solid.

## Solution

Make the Store a **server-only module** reached through **one interface**, backed by a durable adapter. The browser never imports the Store; it mutates through Server Actions and reads through React Server Components. Production is backed by Prisma/Postgres; tests and local dev use an in-memory adapter that satisfies the same interface. After this, there is exactly one writer and one source of truth for Orders, Menu, kitchen state, and Drivers.

## User Stories

1. As a Customer, I want my placed Order to be visible to the Vendor, so that my food actually gets prepared.
2. As a Customer, I want the Order I paid for to be the same Order the system confirms, so that my MoMo payment is not lost.
3. As a Customer, I want my Order to persist if I refresh the page, so that I don't lose my checkout progress.
4. As a Vendor, I want every paid Order to appear on my KDS, so that I never miss revenue.
5. As a Vendor, I want my KDS to show the true state of Orders regardless of which device or tab I use, so that staff stay in sync.
6. As a Vendor, I want toggling an item's availability to be seen by all Customers immediately, so that I don't sell sold-out items.
7. As a Vendor, I want opening/closing the kitchen to persist across restarts and devices, so that the storefront reflects reality.
8. As a Vendor, I want Order status changes (PAID → DISPATCHED → COMPLETED) to be durable, so that dispatch decisions aren't lost.
9. As a developer, I want the browser to be unable to import the Store, so that the client/server split-brain cannot reappear.
10. As a developer, I want one Store interface, so that I learn one surface and exercise all data behavior through it.
11. As a developer, I want a Prisma/Postgres adapter in production, so that data is durable across serverless invocations.
12. As a developer, I want an in-memory adapter for tests and local dev, so that I can run the suite with no database.
13. As a developer, I want both adapters verified by the same contract test suite, so that they cannot drift.
14. As a developer, I want the adapter chosen automatically (Prisma when configured, in-memory otherwise), so that local dev and CI need no extra wiring.
15. As a developer, I want a seed script reproducing the current demo data, so that local Postgres matches the existing experience.
16. As a developer, I want a single Prisma client instance, so that dev hot-reload doesn't exhaust connections.
17. As a developer, I want kitchen state to have a real home in the schema, so that it persists like every other field.
18. As a developer, I want Customer checkout to write through a Server Action, so that the Order lands in the durable Store.
19. As a developer, I want the KDS poll to read through the server seam, so that it observes the real Store.
20. As a developer, I want RSC pages to read the Store directly server-side, so that initial render uses one source of truth.
21. As a developer, I want tests not to assume id formats, so that switching from mock ids to cuid doesn't break them.
22. As a maintainer, I want the deletion test to pass for the Store, so that I know the module earns its keep.

## Implementation Decisions

- **One Store module, one interface.** The deepened module preserves the existing verb set (vendor reads, menu reads + availability mutation, order reads + create + status, drivers, kitchen open/close, today's gross). Verb signatures are kept to minimize blast radius; callers barely change.
- **Server-only enforcement.** The Store and its adapters are server-only; client modules may not import them. Client mutations go through Server Actions; client/RSC reads come from RSC props or Server Actions. No `lib/data` import from any `"use client"` module.
- **Two adapters behind the seam.** A Prisma/Postgres adapter (production) and an in-memory adapter (tests/local dev). The in-memory adapter is the current mock store promoted to a real adapter; its reset capability (today `resetMockStore`) is retained for tests.
- **Adapter selection by factory.** A factory returns the Prisma adapter when `DATABASE_URL` is configured and the in-memory adapter otherwise. Tests force the in-memory adapter.
- **Scope: whole module at once.** The entire Store interface migrates in this slice to avoid a Prisma/mock coexistence split.
- **Schema change.** Add kitchen-open state to the `Vendor` model (a `Boolean`, defaulting to open), distinct from `isActive`. One migration. The existing Prisma schema (Vendor, MenuItem, Order, OrderItem, Driver, Payment, and the OrderStatus/PaymentProvider/PaymentStatus enums) is otherwise adopted as-is.
- **Datasource.** Postgres (Supabase) via the already-declared `DATABASE_URL` / `DIRECT_URL`.
- **Prisma client singleton** guarded against duplicate instantiation under dev hot-reload.
- **Seed.** A seed script reproduces the current demo dataset (the `inka-steakhouse` Vendor, its menu, drivers, and sample orders) so local Postgres matches today's UX.
- **ids.** Production ids come from Prisma (cuid); the in-memory adapter may generate its own. No caller or test may depend on a specific id format.
- **Payment boundary deferred.** This slice fixes the Store seam only. Persisting `Payment` rows and the idempotent payment state machine are candidate #2 and are out of scope here, but after this slice the MoMo confirm path will read/write the same durable Store.

## Testing Decisions

- **Test the interface, not the implementation.** Tests cross the single Store seam and assert external behavior (an Order created is later listed; a PAID Order appears in active orders; toggling availability hides an item from the available menu). No test reaches past the interface into adapter internals.
- **One contract suite, both adapters.** A single behavioral suite runs against the in-memory adapter and the Prisma adapter (the latter against a disposable test database), proving the two adapters cannot drift. Unit-speed runs use in-memory; the Prisma run is the higher-fidelity integration pass.
- **Lifecycle coverage.** The order lifecycle is the centerpiece: create → confirm/PAID → `listActiveOrders` shows it; status transitions through DISPATCHED/COMPLETED; today's gross reflects only counted statuses.
- **No id-format assumptions.** Assertions use returned ids, never literals.
- **Prior art.** None exists yet (no test runner is configured). This slice introduces the runner and the first suite, establishing the pattern (`resetMockStore` already hints at the intended reset-between-tests shape).

## Out of Scope

- Persisting `Payment` records and the idempotent MoMo payment state machine (candidate #2).
- Real MTN MoMo / Airtel Money API integration and webhooks.
- KDS live push (SSE/WebSocket) — candidate #4 builds on this seam; polling stays for now but reads through the server seam.
- Replacing hand-written types with Prisma-generated types + Zod DTOs (candidate #5).
- Auth on the KDS route.
- Multi-vendor support beyond the seeded demo Vendor; fixing the hardcoded vendor slug on the slip page.

## Further Notes

- The deletion test confirms the Store earns its keep: removing it scatters data access and reintroduces the realm split across every caller.
- This is the foundational slice — candidates #2 (Payment module), #4 (KDS live sync), and #5 (Prisma types) all assume a single writer, which this establishes.
- Domain terms `Store` and `Adapter` were added to `CONTEXT.md` during grilling; use them exactly in issue titles and tests.
