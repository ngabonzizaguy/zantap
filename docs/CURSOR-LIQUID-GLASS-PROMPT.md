# ZanTap — Liquid-Glass UI Upgrade · Build Prompt for Cursor

> Paste this whole file into Cursor as your task. Attach the **3 assets** listed
> in §0. You (Cursor) have full access to this repository. Assume **no prior
> conversation context** — everything you need is in this file or the repo.

---

## 0. Assets provided with this prompt

1. **This repo** — the ZanTap Next.js app (full read/write access).
2. **Two background images** (attached):
   - `kitchen` — warm kitchen scene: wooden cutting board, rosemary, linen,
     soft window light, cream/tan tones. → **Storefront** background.
   - `hexagon` — dark 3D hexagon pattern, black/charcoal with glowing **orange**
     accents. → **KDS (vendor dashboard)** background.
   - Save them to `public/bg/storefront-kitchen.jpg` and
     `public/bg/kds-hexagon.jpg` (convert to `.webp` if you prefer; update refs).
3. **`glassliquidmorphism.html`** (attached) — a working reference of the
   *exact* liquid-glass look we want. Read it fully before starting. See §3.

---

## 1. What ZanTap is (context)

ZanTap is a mobile-first food-ordering + MTN MoMo payment app for informal food
vendors in Rwanda. Stack: **Next.js 16 (App Router) · React 19 · Tailwind CSS
3.4 · TypeScript**. Data layer is mock-backed today (see `lib/`), UI is the
focus. Two entry points, both **mobile-width single columns**:

| Route | Purpose | Root component | Bg image |
|---|---|---|---|
| `/[slug]` | **Storefront** — customer browses menu & checks out (≤450px) | `components/customer/Storefront.tsx` | kitchen |
| `/vendor/[slug]` | **KDS** — vendor kitchen dashboard: accept/prep/dispatch orders (≤560px) | `components/vendor/KdsDashboard.tsx` | hexagon |

Run it: `npm install && npm run dev`, then
`http://localhost:3000/inka-steakhouse` (storefront) and
`http://localhost:3000/vendor/inka-steakhouse` (KDS).

Read `DESIGN.md` and `CONTEXT.md` for the current design system and vocabulary
before changing styles.

---

## 2. The goal

Replace the app's current glass styling with a **true liquid-glass** look
matching `glassliquidmorphism.html`, set over the two background images — one per
surface. Overlaying UI (cards, sheets, chips, tickets, buttons) should read as
**frosted, translucent, light-refracting glass floating above the photo**.

**Do not break existing functionality.** This is a visual/skin upgrade: cart,
checkout, MoMo flow, KDS order lifecycle, tabs, modals must all still work.

---

## 3. Understand the reference (`glassliquidmorphism.html`)

That file is a "GitHub Glass Card" toy. **Ignore** the GitHub fetch, signature
pad, and download features — they're demo filler. **What matters:**

- It renders a full-screen background image on a **WebGL canvas** (`#glcanvas`),
  and a **fragment shader** (`<script id="fragShader">`) draws a rounded-rect
  "glass" region wherever the card sits. Behind the card the shader **bends and
  magnifies the background like a real lens** (refraction), softly **blurs** it
  (9×9 sample loop), and paints a **bright light rim along the edges**. That
  refraction + edge glow is what makes it read as *real liquid glass*.
- The visible card (`#card`) is ordinary HTML/CSS on top: translucent sub-panels
  (`rgba(...,0.07)` fills, `rgba(...,0.45)` borders, rounded 15–34px), an `--ink`
  CSS var that flips text color for light vs dark backgrounds, and pill inputs.

### The critical distinction — why the current app looks wrong
This repo currently fakes glass with **CSS `backdrop-filter: blur()`** (see
`app/globals.css` → `.glass-panel` / `.glass-panel-strong`, and
`components/ui/GlassPanel.tsx`). That only *frosts* — it looks like cloudy
plastic. The reference **refracts** — it bends the image. Closing that gap is the
whole job.

### The hard part you must solve
The reference shader draws **one** glass rectangle (the single card). ZanTap has
**many** panels per screen (menu cards, cart bar, order tickets, tabs, sheets),
and they **scroll**. A single WebGL canvas tracking many scrolling DOM rects is
the core challenge. See §8 for the recommended approach and a fallback.

---

## 4. Backgrounds & per-surface design rules

Both surfaces use the **same glass recipe**, tinted for their background:

**Storefront — over the light/warm kitchen photo:**
- Background image `fixed`, `cover`, behind the scrolling column.
- Glass panels: light frosted fills, **dark ink text** (near-black) for
  legibility over the bright photo. Keep the existing editorial serif for the
  vendor name / "Menu" headings.
- Preserve current accents: black `+` add buttons, black "All" chip, colored
  menu-item thumbnails (pink, amber, dark logo).

**KDS — over the dark hexagon photo:**
- Background image `fixed`, `cover`.
- Glass panels: dark translucent fills, **light text**, **brighter edge
  highlights** (they pop on dark). Lean into **orange/amber** accents — they
  already match the hexagon glow, the amber order amounts, and the gold "Orders"
  button. Keep the color-coded filter chips (All=amber, New=purple,
  Preparing=olive, Ready=teal) and the green "OPEN"/"Paid via MoMo" pills.

**Both:** maintain WCAG-AA text contrast over imagery (add a subtle scrim behind
text if needed), keep large touch targets, and verify at mobile widths.

---

## 5. Files to touch (component map)

**Shared glass system (do this first — highest leverage):**
- `app/globals.css` — the `.glass-panel*` utilities live here. This is where the
  new glass recipe / CSS vars go.
- `components/ui/GlassPanel.tsx` — the reusable wrapper. Extend with a
  surface/variant prop (e.g. `on-light` / `on-dark`) if helpful.
- `components/ui/primitives/*` — `Card`, `Modal`, `Button`, `Input`, `Select`,
  `Badge`. Restyling here propagates broadly.
- `tailwind.config.ts` — tokens/colors.
- `components/ui/primitives/GradientOrbs.tsx` — existing decorative bg; likely
  replaced/retired by the new image backgrounds.

**Storefront:** `components/customer/` — `Storefront.tsx` (container + bg),
`TopBar.tsx`, `Hero.tsx`, `CategoryChips.tsx`, `MenuItemCard.tsx`,
`StickyCartBar.tsx`, `CheckoutSheet.tsx`, `ManualMomoSheet.tsx`, `UssdModal.tsx`,
`SuccessReceipt.tsx`.

**KDS:** `components/vendor/` — `KdsDashboard.tsx` (container + bg),
`MetricsBanner.tsx`, `Tabs.tsx`, `OrderTicket.tsx`, `MenuSection.tsx`,
`SetupDrawer.tsx`, `DispatchModal.tsx`, `HistoryPanel.tsx`.

---

## 6. Recommended approach (+ fallback)

You have two viable paths. **Prototype the glass engine in isolation first**
(a scratch route or standalone HTML) before wiring it across the app.

**Path A — WebGL/Three.js refraction (the "hero" look, matches the reference):**
- One fixed full-screen `<canvas>` behind the app renders the background + glass.
- Generalize the reference shader to accept **an array of rounded-rect panels**
  (position + half-size + radius), fed each frame from the bounding boxes of DOM
  elements marked `data-glass`. Use Three.js (`ShaderMaterial` on a fullscreen
  quad) as requested.
- Use **GSAP** for entrance/hover/press micro-interactions on panels.
- Risk: performance with many scrolling panels on low-end phones. Cap panel
  count, throttle rect updates to scroll/resize, and test on a mid-range device.

**Path B — CSS + SVG displacement fallback (pragmatic, integrates cleanly):**
- If Path A can't hit ~60fps on mobile, emulate refraction with layered
  `backdrop-filter: blur() saturate()` + an SVG `feDisplacementMap`/`feTurbulence`
  filter for edge distortion + a specular highlight (inset light border +
  gradient sheen). This scales to unlimited scrolling panels for near-zero cost
  and still reads as liquid glass.
- Document which path you shipped and why.

Either way, the **panel styling** (fills, borders, radii, `--ink` text-color
switch, highlights) comes straight from the reference CSS — reuse those values.

---

## 7. Task breakdown (do in order, commit after each)

1. **Glass engine spike.** Save the 2 images to `public/bg/`. Build the chosen
   glass mechanism (Path A or B) in isolation over BOTH backgrounds, proving
   **multiple** panels refract/frost correctly and perform on mobile. Decide
   A vs B here.
2. **Shared system.** Fold the recipe into `app/globals.css` +
   `GlassPanel.tsx` + primitives, with light/dark surface variants.
3. **Storefront.** Apply over the kitchen bg: `Storefront` bg layer, then
   `TopBar`, `Hero`, `CategoryChips`, `MenuItemCard`, cart/checkout sheets.
   Light-surface legibility + GSAP polish.
4. **KDS.** Apply over the hexagon bg: `KdsDashboard` bg layer, then
   `MetricsBanner`, `Tabs`, `OrderTicket`, modals. Dark-surface styling + orange
   accents.
5. **Polish & verify.** Contrast/accessibility, mobile widths, reduced-motion,
   `npm run lint` + `npm run build` clean. Screenshot both screens.

---

## 8. Guardrails

- Work on a feature branch (e.g. `feature/liquid-glass-ui`). Commit per task with
  clear messages. Don't force-push shared branches.
- **Don't regress behavior** — cart, checkout, MoMo simulation (PIN `12345`),
  KDS order lifecycle, tabs, modals, exports must keep working.
- Respect `prefers-reduced-motion` (disable GSAP loops / heavy shader motion).
- Keep bundle sane — lazy-load Three.js only on the two glass surfaces; don't
  ship it to routes that don't need it.
- Update `docs/GLASS_BG_UPGRADE_HANDOFF.md` (a running progress log already in
  this repo) after each task so work is resumable.

---

## 9. How to verify

```bash
npm install
npm run dev
#  Storefront: http://localhost:3000/inka-steakhouse   (over kitchen bg)
#  KDS:        http://localhost:3000/vendor/inka-steakhouse (over hexagon bg)
npm run lint && npm run build
```
Confirm: real refraction/frost over the correct image per surface, legible text,
smooth scroll on mobile viewport, and no broken flows.
