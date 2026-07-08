# ZanTap — Glassmorphism Background Upgrade · Handoff & Progress Log

> **Purpose of this file:** A living handoff document so that if this session's
> credits/tokens run out, the next agent (or a human) can pick up exactly where
> things left off without re-discovering context. Update the **Progress Log** at
> the bottom after every meaningful step.

Last updated: 2026-07-08
Branch: `claude/zantap-ui-design-v9foax`
Owner: ngabonzizaguy1996@gmail.com

---

## 1. The task (what the user asked for)

Apply two supplied background images and give the overlaying UI a **liquid /
glassmorphism** treatment, on the two entry points of the ZanTap app:

1. **Storefront** (customer view) → **pinkish** background image.
2. **Vendor Dashboard / KDS** → **dark greeny (leaves)** background image.

The background is the image; components float on top as frosted / translucent /
blurred "liquid glass" panels. The user will also supply an **HTML reference
file** demonstrating the desired glassmorphism/liquid-glass design language —
match that language.

### Constraints / ground rules
- All work on branch `claude/zantap-ui-design-v9foax`. Never push elsewhere.
- Commit with clear messages; push with `git push -u origin <branch>`.
- Keep this handoff file updated as work progresses.

---

## 2. Assets the user is providing (via chat screenshots/files)

| Asset | For | Status |
|---|---|---|
| Storefront current-state screenshot | reference | ⏳ not received yet |
| Vendor Dashboard/KDS current-state screenshot | reference | ⏳ not received yet |
| **Pinkish** background image | Storefront bg | ⏳ not received yet |
| **Dark greeny (leaves)** background image | Vendor/KDS bg | ⏳ not received yet |
| HTML reference file (glass/liquid design) | design language | ⏳ not received yet |

> **NOTE for next agent:** Images arrive as chat screenshots, not files in the
> repo. When received, save them under `public/` (proposed:
> `public/bg/storefront-pink.<ext>` and `public/bg/kds-leaves.<ext>`) and wire
> them as CSS backgrounds. Confirm exact filenames/format with the user or check
> the Progress Log below for what was actually saved.

---

## 3. Codebase map (verified)

Stack: **Next.js 16** (App Router) · **React 19** · **Tailwind 3.4** ·
Prisma (schema only, mock data layer today).

### Two entry points
| Route | Page file | Root component |
|---|---|---|
| `/[slug]` — Storefront (customer) | `app/[slug]/page.tsx` | `components/customer/Storefront.tsx` |
| `/vendor/[slug]` — Vendor KDS | `app/vendor/[slug]/page.tsx` | `components/vendor/KdsDashboard.tsx` |

### Glassmorphism plumbing that already exists
- `components/ui/GlassPanel.tsx` — wrapper applying `.glass-panel` /
  `.glass-panel-strong` classes (+ `rounded-3xl`).
- `app/globals.css` — where the `.glass-panel*` utilities are defined (verify
  current definitions before editing).
- `tailwind.config.ts` — palette + design tokens.
- `components/ui/primitives/GradientOrbs.tsx` — existing decorative background
  orbs (note: recent commits removed some dead orb/blush styles per ADR-0042 —
  check git log).
- `DESIGN.md` — current brand/design system (ElevenLabs editorial: off-white
  canvas, near-black ink, pastel gradient orbs). **The new background-image
  direction may supersede parts of this — reconcile, don't blindly follow.**

### Component inventory (targets for glass restyle)
- `components/customer/*` — TopBar, Hero, MenuItemCard, CategoryChips,
  StickyCartBar, CheckoutSheet, ManualMomoSheet, UssdModal, SuccessReceipt, etc.
- `components/vendor/*` — KdsDashboard, OrderTicket, Tabs, MenuSection,
  SetupDrawer, MetricsBanner, DispatchModal, HistoryPanel, etc.
- `components/ui/primitives/*` — Card, Button, Input, Modal, Select, Badge, etc.
  (shared; restyle here propagates broadly — highest-leverage place to touch).

### Vendor storefront-management scope (per user)
Vendors can: add menus & menu items, add phone numbers, change/add/update logo
and cover image. (Storefront management lives in the KDS/vendor surface.)

---

## 4. Plan / approach (proposed — refine once assets arrive)

1. **Receive & study** the 2 current-state screenshots; map each visible region
   to the components above.
2. **Save** the 2 background images into `public/bg/`.
3. **Study** the HTML glass reference; extract the exact recipe (blur radius,
   background alpha, border, highlight/inner-shadow, saturation, radius).
4. **Establish backgrounds:**
   - Storefront: fixed pink image behind `Storefront.tsx` content.
   - KDS: fixed leaves image behind `KdsDashboard.tsx` content.
   - Prefer a per-surface background layer (CSS `background` on a fixed wrapper),
     so it doesn't scroll and stays performant on mobile.
5. **Refactor glass tokens** in `globals.css` to match the reference recipe;
   ensure `.glass-panel` reads well over BOTH a light-pink and a dark-green bg
   (may need surface-aware variants, e.g. `.glass-panel--on-dark`).
6. **Apply** glass treatment to key components, starting with shared primitives
   (`Card`, `Modal`, `Button`, sheets) then surface-specific chrome.
7. **Verify** legibility/contrast (WCAG), mobile viewport (storefront ≤450px,
   KDS ≤560px per README), and that text stays readable over imagery.
8. **Run** `npm run lint` + `npm run build`; screenshot via the run/verify skill.
9. **Commit + push** in reviewable chunks; update this log each step.

---

## 5. How to run / verify locally
```bash
npm install
npm run dev
# Storefront: http://localhost:3000/inka-steakhouse
# Vendor KDS: http://localhost:3000/vendor/inka-steakhouse
npm run lint
npm run build
```

---

## 6. Progress Log (append newest at top)

- **2026-07-08** — Session start. Confirmed task understanding with user.
  Verified branch (`claude/zantap-ui-design-v9foax`, already checked out).
  Explored repo, mapped entry points + existing glass plumbing. Created this
  handoff file. **Waiting on user** to send: 2 current-state screenshots, then
  2 background images (pink=storefront, leaves=KDS) + HTML glass reference.
  No code changes yet.
