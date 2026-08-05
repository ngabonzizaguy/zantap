# Issue 03 — Production marketing page at `/` (C structure + A hero)

Status: **ready-for-agent** · Track 1 · ADR-0046 §5

Replace the root demo-storefront redirect with the production funnel page.
Design source: `.scratch/lead-funnel-prototype/` variant C structure (offer +
visible lead form first) + variant A cinematic hero (assets
`kigali-vendor-hero.png` + `kigali-shift-loop.mp4` — move into `public/`).
This is a port through real Next.js/Tailwind/DESIGN-token code, not a copy of
the throwaway prototype HTML.

Constraints (fixed):
- Copy: "local food businesses" umbrella, free guided setup offer, no invented
  pricing, Rwanda-first; i18n-ready string constants, no hard-coded JSX copy.
- Screenshots only inside device frames; exclude any screen with customer or
  driver phone numbers.
- Brand: approved Z + amber; marketing surface treatment to be codified in
  Issue 08 (`DESIGN.md`) — coordinate if sequenced after.
- Form fields per prototype (business name, type, contact person, WhatsApp
  phone, area) + a consent line for follow-up contact.

- [ ] Move hero assets into `public/`; build the page as RSC + small client islands (form, video).
- [ ] Lead form submits via Server Action from Issue 04 (if 04 not yet done, land the UI behind the action's interface).
- [ ] SEO: metadata, Open Graph image, `sitemap.xml`, `robots.txt`; keep vendor storefronts crawlable policy explicit.
- [ ] Preserve `/[slug]` routing — ensure no slug can collide with the root page and reserved paths.
- [ ] Mobile-first check at 390px; no horizontal overflow; reduced-motion fallback to the still image.
- [ ] `npm run build`; Playwright/curl smoke; delete `.scratch/lead-funnel-prototype/` per its NOTES once verified in prod.
- [ ] Handoff per protocol (ADR for the root-IA change).
