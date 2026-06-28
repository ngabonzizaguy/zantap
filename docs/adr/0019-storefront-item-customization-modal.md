# ADR-0019: Storefront item customization modal (visual-only)

Date: 2026-06-27
Status: Accepted

## Context

The storefront (`/[slug]`) lets a Customer tap the `+` on a `MenuItemCard` to
quick-add one base item to the cart (`CartContext`, a `Record<menuItemId, qty>`).
ADR-0018 added a swipeable thumb carousel for items with ≥2 gallery images.

The owner wants tapping the card body (not the `+`) to open a premium glassmorphic
bottom sheet showing a large image carousel, an ingredient/add-on customization
surface, a special-instructions note, a live order summary, and a sticky
"Add to Order" CTA — matching the existing `zt-*` blush-glass language.

The blocking reality: **the domain has no modifier concept.** `MenuItem`
(`lib/types.ts`) has no ingredients/add-ons; the cart is quantity-only; the order
pipeline (`CreateOrderInput.items`, `OrderItem`, Store, Prisma, KDS read seam,
receipt) is keyed solely on `(menuItemId, quantity)`. A real modifier system would
cross every one of those boundaries in a single feature — a direct violation of the
`.cursorrules` anti-YOLO protocol and a multi-session epic.

Grilled 2026-06-27 (`/grill-with-docs`). Six decisions recorded below.

## Decision

Ship a **visual-only** customization modal as one isolated customer-UI slice. No
schema, Store, server-action, or order-pipeline changes.

1. **Scope — visual-only, but wired through a future-real seam.** The modal renders
   the full premium experience (carousel, ingredient toggles, add-ons, notes, live
   summary) and computes a *display* total. The modal emits **one structured
   `CustomizationSelection`** — `{ menuItemId, qty, removedIncludedIds: string[],
   addOns: { id: string; qty: number }[], notes: string }` — its complete "intent."
   "Add to Order" funnels through a **single `onAddToOrder(selection)` adapter**:
   today that adapter calls `addItem` `qty` times and discards the modifier parts;
   the future real version swaps that **one function** to push a real cart
   line-item. Modifier selections and notes are **not** persisted to the cart,
   Order, or KDS this slice. The visual-vs-cart total gap is a known, documented
   limitation until a future "real modifiers" PRD (see Forward compatibility +
   Consequences).

2. **Data source — optional presentation field + generic fallback.** Add an
   **optional, presentation-only** `customization` field on `MenuItem` (e.g.
   `customization?: { included: IngredientOption[]; addOns: AddOnOption[] }`). The
   Store passes it through when present (in-memory only today — no migration). When
   absent (every item currently), render a small **generic fallback** set so every
   item's modal looks complete. This is the seam a future real version grows into.

   **Types are persistence-shaped, not throwaway** (the visual slice must not need
   a rewrite to go real): every `IngredientOption` / `AddOnOption` carries a
   **stable string `id`** (serializable, referenceable by a future Order) and
   **integer RWF prices** — never display strings. Keep the two-bucket
   `included` / `addOns` shape (matches the mockup); a future real model may
   generalize to modifier groups, but that is not pre-built here.

3. **Carousel images — reuse `getMenuItemGalleryUrls`.** ≥2 URLs → full-width swipe
   carousel + dots; exactly 1 → static hero; 0 → the card's radial gradient +
   plate icon, sized as the hero. No fabricated slides. Generalize the existing
   `MenuItemImageCarousel` (currently hard-sized to a 72×72 thumb) into a
   size-agnostic core, or add a hero variant — do not duplicate scroll/dot logic.

4. **"Add to Order" semantics.** Modal quantity selector starts at 1 each open and
   adds N base items to the cart (via the `onAddToOrder` adapter above). Add-on
   prices appear in the modal's live summary for premium feel only; the
   cart/checkout total reflects base prices only. The total is computed by a
   **pure, server-safe** `computeCustomizeTotal(selection, item)` (no `"use client"`,
   no React/DOM imports) so the future server-side re-pricing step reuses the exact
   same function at the trust boundary.

5. **Mechanics — no new deps.** Match the existing CSS sheet pattern
   (`CheckoutSheet`/`UssdModal`: `fixed inset-0 z-[60]`, backdrop-blur overlay,
   `translate-y` transition, tap-scrim/X to close) and add drag-to-dismiss with
   native Pointer Events + a transform on the drag handle (release past a threshold
   closes; otherwise springs back via CSS ease). No framer-motion / vaul.

6. **State — one Storefront-level instance, ephemeral draft.** Render a single
   modal at `StorefrontInner` (like `CheckoutSheet`) driven by `activeItemId`. Card
   body tap sets it; `+` stays pure quick-add. Draft state (toggles/add-ons/notes/
   qty) resets fresh each open. "Preserve scroll position when reopened" is honored
   as preserving the **background storefront scroll** (the storefront never
   unmounts), not per-item draft memory.

**Design language:** keep `zt-*` blush-glass (consistent with ADR-0018). This is
**not** the DESIGN.md customer migration (candidate #10, owner-deferred).

## Forward compatibility (so "real modifiers" is an extension, not a rewrite)

The owner directive: this slice is visual-only *now*, but must be **architected so
the future real wiring drops in cleanly.** Four explicit seams carry that promise:

1. **Stable, persistence-shaped types.** `IngredientOption`/`AddOnOption` use stable
   string `id`s + integer RWF prices. When the catalog moves from the in-memory
   `customization` field to a real Store/Prisma model, the IDs are the join key — no
   reshaping of the modal.
2. **A single selection payload.** `CustomizationSelection` is the one object the
   modal produces and the only thing the order needs. Promoting it means: the future
   `CreateOrderInput.items` entry gains `removedIncludedIds` / `addOns` / `notes`
   (additively), and the modal already produces exactly that.
3. **One adapter to flip.** `onAddToOrder(selection)` is the single chokepoint. The
   day the cart becomes line-item-based, only this function changes (and the cart
   type) — the modal, pricing, and types are untouched.
4. **Pure, reusable pricing.** `computeCustomizeTotal` lives in a server-safe module
   with no client/runtime coupling, so the future Server Action re-prices with the
   identical function — the client total and the trusted server total can never
   drift in logic (only in trust).

### Documented migration path for the future epic (its own `/grill-with-docs`)

- Back the `customization` field with a real Store read (and Prisma model for
  ingredients/add-on catalog) instead of the in-memory passthrough + fallback.
- Upgrade the cart from `Record<menuItemId, qty>` to line-items carrying a
  `CustomizationSelection`; update `computeLines`/`computeTotal`.
- Extend `CreateOrderInput.items` + `OrderItem` (additively) to persist the
  selection; **re-price server-side** with `computeCustomizeTotal` (never trust the
  client total).
- Surface modifiers/notes on the KDS ticket and the printed receipt.
- Re-point `onAddToOrder` to push the line-item. Everything else stays.

## Consequences

- Two ordering flows: `+` quick-add (returning customers) and tap-to-customize
  (browse images, inspect ingredients) — both land the same base item in the cart
  this slice.
- **Known gap:** add-ons/removals/notes shown in the modal do not reach the cart,
  checkout total, kitchen, or receipt. Acceptable for a visual slice; must be
  called out in UI copy review and closed by a future end-to-end "real modifiers"
  feature (cart line-items → `CreateOrderInput` re-priced server-side → Prisma
  schema → KDS ticket → receipt). That feature gets its own `/grill-with-docs`.
- The optional `customization` field is the forward-compatible seam; promoting it
  to a real, persisted, server-priced model is the future epic, not this slice.
- No new npm deps; drag-to-dismiss is the first gesture interaction in the app.
