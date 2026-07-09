# ADR-0043: Storefront immersive editorial hero

**Status:** Accepted  
**Date:** 2026-07-10  
**Branch:** `feat/storefront-hero-editorial`

## Context

The customer storefront hero used a padded `Card` with the cover image, logo, actions,
and vendor metadata all inside one floating surface. This read as a traditional food-delivery
card rather than the editorial, magazine-like aesthetic defined in `DESIGN.md` (ADR-0005,
ADR-0041).

## Decision

Replace the card-based hero with an immersive, full-bleed cover zone:

1. **Cover zone** — `36vh` (clamped `220px`–`360px`), full viewport width on all breakpoints.
2. **Dissolve** — bottom gradient mask from cover into `bg-canvas` (no hard edge).
3. **Readability** — light ink wash + subtle backdrop blur over the image; pastel gradient fallback when no `coverImageUrl`.
4. **Floating glass chrome** — logo (lower-left, overlapping content), call + share (upper-right). All use `bg-surface-card/90` + `backdrop-blur-md` + shadow so they remain legible on any vendor-uploaded cover.
5. **Vendor identity** — tagline, name, delivery/rating pills rendered directly on the page surface below the fade (no card wrapper).
6. **TopBar integration** — `TopBar` passed via `header` prop and absolutely positioned over the cover; share/call/phone behavior unchanged.

`Storefront.tsx` no longer renders `TopBar` separately; it is composed inside `Hero`.

## Consequences

- **Positive:** Premium editorial hierarchy; cover photography is the hero; logo/actions always contrast-safe.
- **Positive:** No schema or server-action changes; existing `logoUrl` / `coverImageUrl` / `phoneNumber` props suffice.
- **Neutral:** `Hero` gains optional `header?: ReactNode` prop (only `Storefront` uses it today).
- **Follow-up:** Deploy + visual smoke on prod vendor with and without cover image (`inka-steakhouse`).

## Addendum: dark liquid-glass surface + metallic gold accents

Extended on the same branch:

1. **Dark canvas** — `.storefront-dark` scope remaps the editorial tokens to a warm
   near-black (`#0c0a09`) surface, mirroring the `.kds-dark` remap pattern (ADR-0017).
   KDS and onboarding are unaffected.
2. **Liquid glass** — `.glass-liquid`, `.glass-liquid-strong`, `.glass-liquid-pill`
   utilities replace the light `glass-panel` set on the storefront: low-opacity white
   gradients, heavy backdrop blur, deep shadows with an inset top highlight.
3. **Metallic gold differentiator** — quantity badges, the `+` add buttons, prices, the
   active category chip, and the cart-bar CTA use a `#d4af37`-family metallic ramp
   (`.glass-gold`, `.glass-gold-badge`, `.glass-gold-pill`, plus a scoped `.text-gold`
   remap to `#e0be55`). Deliberately richer/deeper than the KDS's flat `#ffd24c` gold so
   the customer surface reads premium rather than operational.

## References

- `components/customer/Hero.tsx`
- `components/customer/Storefront.tsx`
- ADR-0005, ADR-0041
