# Issue D — Marketing page polish

**Status:** Done (code on `feat/ops-kds-marketing-batch`; not deployed)  
**Branch:** `feat/ops-kds-marketing-batch`

## Checklist

- [x] Ops-configurable Marketing Site Settings (socials + phone/email)
- [x] Footer: Z logo, social icons, contact details (only filled links)
- [x] `/privacy` and `/terms` pages (drafted copy for owner review)
- [x] Sticky CTA: hide when equivalent CTA/footer in view; remove "my"; drop redundant "free setup" wording where needed
- [x] Hero Z logo + seamless video loop
- [x] "Without ZanTap / With ZanTap" comparison section before lead form

## Owner-feedback round 2 (2026-08-14)

- [x] Sticky "Get setup" also hidden while the hero (`#top`) is on screen — the masthead already carries a Get setup button, so the pill no longer covers hero text on mobile
- [x] Footer renders ALL 7 social icons always; ones without an Ops URL show as dimmed placeholders (`title="… coming soon"`, non-clickable) until the owner fills them in `/ops` → Marketing site settings
- [x] "Your own mobile menu" screen: single storefront `DeviceFrame` replaced with `ScreenCardDeck` — GSAP auto-cycling 3-card deck (front card centered, two peeking behind, eased tilted swap, caption pill + dots, pause on hover/press, reduced-motion = static deck) per the owner's two reference videos in `public/brand/UI-screens/new-UI-screens & video walkthrough/`. Cards = `kds-store-live.png`, `momo-pay-step.png`, `kds-dashboard.png` (copied to `public/marketing/card-*.png`). This deliberately supersedes ADR-0046 §5 "screenshots only inside device hardware" for this one section, at explicit owner request.
- [x] Languages CRUD in Ops (rw/fr/sw word-for-word editor → full CMS) recorded as DEFERRED: see `deferred-language-cms.md`

## Owner-feedback round 3 (2026-08-14)

- [x] Deck placement corrected: the ORIGINAL storefront `DeviceFrame` (`screen-storefront.png`) is restored in "Your own mobile menu"; the `ScreenCardDeck` now replaces the kitchen terminal frame in "A clearer kitchen" (cards config moved to `PRODUCT.kitchen.cards`; the kitchen `DeviceFrame`/`screen-kitchen.png` usage removed from `/`)
- [x] Footer socials: LinkedIn + YouTube fully hidden until a URL is set in Ops (`HIDDEN_WHEN_EMPTY` in `MarketingFooter`); the other 5 (WhatsApp, Instagram, X, TikTok, Facebook) keep dimmed-placeholder behavior. Ops settings fields unchanged — owner can enable them later by filling URLs.
- [x] Torn-paint treatment (owner rounds 7–8): round-7 halo-blob attempt (`PaintSplash.tsx`) REJECTED by owner ("uglily"); round 8 replaces it with `components/marketing/TornPaint.tsx` — (a) `TornPanelBackdrop`: the LeadForm card's straight rounded edges are REPLACED by a torn-watercolor cream sheet (SVG rect + feTurbulence displacement, drop-shadow follows the torn shape; aside is now `relative isolate`, bg/rounding/shadow removed); (b) walkthrough seams — round-8 cream `TornDivider` REJECTED ("crazy ugly, introduces a different color"); round 9 replaces it with `TornEdge` (same file): the page's own near-black (`#0c0a09`) tears INTO the footage — absolute overlays at the top+bottom of the scroll-world track (`ScrollWorldSection` wraps `trackRef` in a `relative` div; bottom edge mirrored), z-[60], pointer-events-none, no new color anywhere. Owner APPROVED round 9 ("works for me"); round-10 fix: mobile `.sw-hint` top offset 18px→76px (scrub-engine CSS) so the pill clears the 64px `TornEdge` seam overlay. Shots: `deck-shots/torn-form-desktop.png` / `torn-form-mobile.png` / `torn-edge-top.png` / `hint-mobile-fixed.png`.
- [x] Masthead language switcher added (owner round 6): `components/marketing/LanguageSwitcher.tsx` — globe + current locale pill next to "Get setup"; dropdown English / Kinyarwanda / Français / Kiswahili. Selection persists via a `useSyncExternalStore` localStorage store (`zantap.lang`) + `<html lang>`; only `en` is enabled today, the other three show "Soon" badges until the deferred translation dictionaries + Ops CRUD land (see `deferred-language-cms.md`). Verified shot: `deck-shots/lang-switcher-mobile.png`.
- [x] Deck swap smoothed (owner round 5): duration 0.85s→1.5s, ease `power2.inOut`, cycle 4.2s; z-index now interpolates inside the tween (no instant layer pop); caption/dots swap mid-transition. Travel direction confirmed right → center → left (incoming card enters from the right).
- [x] Deck cards restyled as phone hardware (owner round 4): DeviceFrame-style chassis (body, side buttons, bezel, glass sheen; notch omitted so no UI is covered); all three frames share ONE height via a uniform `aspect-[10/19]` screen — each screenshot fills the width top-down, uncropped and full-size, remaining screen stays dark; back cards dim via a SOLID dark scrim animated by GSAP (opacity transparency removed as unprofessional). Verified shot: `deck-shots/kitchen-deck-framed.png`.

## Owner-feedback round 11 (2026-08-14)

- [x] Walkthrough screen media framed as phone hardware: scrub-engine now wraps every `kind: "screen"` media in a `.sw-phone` chassis (ScreenCardDeck look — dark body, side buttons, no notch, glass sheen) with ONE uniform `aspect-ratio: 10/19` screen for all scenes (verified 293px height each on desktop); screenshots fill the width top-down, uncropped, remaining screen dark; the old radial soft-mask on bare imgs removed. Mobile widths 108px.
- [x] Scene 02 ("The order") now shows the storefront UI (`storefront.png` from `public/brand/UI-screens/new-UI-screens & video walkthrough/`, copied to `public/marketing/card-storefront.png`); scenes 03/04 point at the updated `card-momo-pay.png` / `card-kds-dashboard.png` (byte-identical to the folder's `momo-pay-step.png` / `kds-dashboard.png`). New `momoScreenAlt` copy key. Check script: `phone-frame-check.mjs`; shots `deck-shots/walk-scene{2,3,4}-*.png`.

## Locked decisions

- Fee machinery deferred; comparison states low-fee promise only
- Socials: X, TikTok, Instagram, Facebook, LinkedIn, YouTube, WhatsApp
- Language CMS is a future candidate with its own grill + PRD (not this batch)
