# ADR-0049: Production marketing page at `/` (root IA change)

- **Status:** Accepted
- **Date:** 2026-08-06
- **Branch:** `cursor/setup-dev-environment-0a7d` (Track 1, restructure Issue 03)
- **Implements:** ADR-0046 §5 (C structure + A hero), ADR-0047 (motion stack)

## Context

Since launch the root route redirected to the demo storefront
(`/inka-steakhouse`). Track 1 of the restructure PRD replaces it with the
production lead funnel: prototype C's conversion-first structure (offer +
visible lead form) combined with prototype A's cinematic Kigali hero.

## Decisions

1. **Root IA:** `app/page.tsx` is now the marketing funnel (RSC + client
   islands). The demo-storefront redirect is gone; vendor storefronts remain
   at `/[slug]` and take routing precedence only below the static root.
2. **Reserved slugs at the Store seam:** `RESERVED_VENDOR_SLUGS` in
   `lib/vendor/slug.ts` (app routes: `api/onboard/ops/slip/vendor`; asset
   folders: `brand/marketing`; marketing/legal paths: `about/admin/blog/
   contact/help/legal/pricing/privacy/terms`). Enforced inside BOTH adapters'
   `isSlugAvailable`, so provisioning, KDS slug rename, and operator rename
   all reject them — no caller can bypass. Contract + unit tests added.
3. **Copy is i18n-ready:** every string lives in `lib/marketing/copy.ts`
   (ADR-0046 §14); the umbrella is "local food businesses", the offer is free
   guided setup, no invented pricing, Rwanda-first.
4. **Interim lead transport (pre-Issue-04):** the form validates against the
   Issue 04 interface (`lib/leads/types.ts` → `SubmitLeadInput`) and then
   opens WhatsApp to the owner's support number with a prefilled message —
   the owner's stated follow-up channel (ADR-0046 §9). No lead is silently
   dropped; Issue 04 swaps `deliverLead` in `components/marketing/LeadForm.tsx`
   for the durable `submitLead` server action without UI changes.
5. **Motion stack shipped this pass (ADR-0047):** GSAP + ScrollTrigger
   entrance/scroll reveals (`MarketingMotion`, declarative `data-mkt-*`
   attributes, `gsap.matchMedia` gates all motion behind
   `prefers-reduced-motion: no-preference`); restrained Three.js orbit-line
   accent (`OrbitAccent`, lazy `import("three")` inside the effect so three
   never enters the initial bundle, skipped under reduced motion); the hero
   video fades over the still and is never requested under reduced motion or
   Save-Data (`useSyncExternalStore` media-query subscription).
   **The scroll-world cinematic is NOT in this pass** — it requires the
   skill's owner interview + budget approval before any paid rendering; a
   follow-up session slots it between the "What happens next" and offer
   sections once approved.
6. **Conversion guard:** the lead form renders inside the hero viewport on
   desktop; on mobile a sticky amber "Get free setup" pill (hidden while the
   form is on screen via IntersectionObserver) keeps the form one tap away.
7. **Screenshots inside device hardware only:** `DeviceFrame` renders phone/
   terminal bezels. The kitchen screenshot was freshly captured against the
   in-memory store so it carries the Z brand (the July UI-screens captures
   show the retired medallion and a `zantap.ai` URL — do not reuse them on
   marketing surfaces). No screen exposes customer or driver phone numbers.
8. **SEO:** page metadata + Open Graph (hero still), `app/sitemap.ts` (root +
   `/onboard`), `app/robots.ts`. Crawl policy made explicit: marketing root
   and vendor storefronts are crawlable; `/api/`, `/ops`, `/vendor/`
   (KDS), `/slip/` are disallowed.
9. **Brand treatment:** dark near-black (`#0c0a09`) marketing surface with
   amber (`#f5a623`) accents and the cream form card, per the prototype-C
   final verdict. The transparent Z wordmark is rendered white via CSS
   (`brightness-0 invert`) on the dark masthead/footer — an interim treatment
   until Issue 08 codifies the marketing surface in `DESIGN.md`.

## Consequences

- `gsap` and `three` are runtime dependencies, used only by marketing client
  islands.
- Issue 04 (durable lead capture) is the next dependency for real lead
  persistence + the `/ops` leads inbox (Issue 05).
- `.scratch/lead-funnel-prototype/` is deleted once the page is verified in
  prod (its NOTES.md provision); hero assets now live in `public/marketing/`.
- The scroll-world interview answers + budget approval gate the cinematic
  follow-up session (ADR-0047 decision 3 unchanged).
