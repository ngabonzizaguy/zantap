# Introduce the server-only Store seam (in-memory) and move the client off direct imports

Status: ready-for-agent

## Parent

PRD: `.scratch/data-layer-server-seam/PRD.md`

## What to build

Establish the **Store** as a server-only module reached through a single interface, while keeping today's in-memory data behind it. Promote the current mock data module into a real in-memory **adapter** that satisfies the Store interface, and route every caller through a factory-returned Store instance instead of importing data functions directly.

Crucially, the browser must no longer import the Store. Client mutations (Customer checkout creating an Order; KDS toggling item availability, opening/closing the kitchen, advancing Order status; the KDS poll) go through **Server Actions**. Server-rendered reads come from RSC calling the Store directly. The MoMo confirm path keeps running server-side and now hits the same server-side Store.

This slice does not add a database — it fixes the client/server split-brain so that, within one dev process, an Order placed by a Customer is visible to the KDS and to the MoMo confirm path. It also introduces the test runner and the Store contract suite so the interface is verified from day one.

## Acceptance criteria

- [ ] A single Store interface defines all current verbs (vendor reads, menu reads + availability toggle, order reads + create + status, drivers, today's gross, kitchen open/close).
- [ ] An in-memory adapter implements the interface; its reset capability is available for tests.
- [ ] A factory returns the Store instance; all callers use it. No `"use client"` module imports the Store or the adapters.
- [ ] Customer checkout creates the Order via a Server Action; the KDS reads/mutates via Server Actions; RSC pages read the Store directly.
- [ ] In one running dev process: placing an Order makes it appear on the KDS, and MoMo PIN confirmation flips that same Order to PAID.
- [ ] A test runner is configured with a project test script.
- [ ] A contract suite exercises the Store interface against the in-memory adapter, including the order lifecycle (create → PAID → appears in active orders; status advances; today's gross counts only counted statuses).
- [ ] Tests make no assumptions about id formats (use returned ids, not literals).

## Blocked by

None - can start immediately
