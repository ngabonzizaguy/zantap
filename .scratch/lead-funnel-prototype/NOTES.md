# ZanTap lead-funnel prototype

**Prototype question:** Which landing-page structure best turns attention from
social posts and Reels into qualified restaurant leads?

**Status:** Prototype revision 3 complete — owner design choice pending.

This is deliberately throwaway HTML, CSS, and JavaScript. It does not connect
to the production Store, database, analytics, or operator authentication.
Submitted leads exist only in memory until the page reloads.

## Revision 3 directions

- `?variant=A` — **Cinematic service:** a full-screen Kigali restaurant film,
  a single kitchen terminal as the hero object, and a step-driven phone showing
  the customer-to-kitchen flow.
- `?variant=B` — **Editorial product:** a bright, typography-led product stage
  with three independent hardware devices, restrained Three.js orbit lines,
  and large alternating editorial chapters.
- `?variant=C` — **Founder offer:** a dark conversion-first split layout with
  the offer, one go-live phone, and the lead form visible immediately on
  desktop and moved ahead of the device on mobile.

This is a full structural replacement of revision 2, not a copy change. Real
product screenshots are now presented only inside designed phone or kitchen
terminal hardware with bezels, camera/island details, side buttons, glass,
reflections, and grounded shadows. They are never floating screenshot cards.

All directions use short, Rwanda-first language, clear outcomes, a free guided
setup offer for selected early restaurant partners, and an East-Africa-ready
growth message. Screens with customer or driver phone numbers remain excluded.

The shared lead workflow is functional: form submission adds an in-memory lead,
metrics update, search works, and CSV export is available from the dashboard.

## Higgsfield assets

- `assets/kigali-vendor-hero.png` — still hero background, Higgsfield job
  `6f386e5c-b90c-476a-89de-608ce16e0b41`, model `nano_banana_2`.
- `assets/kigali-shift-loop.mp4` — five-second subtle motion background,
  Higgsfield job `1bfe4ee7-0e36-4c13-9c49-d926f8544652`, model
  `kling3_0_turbo`.

Still-image prompt:

> Use case: ads-marketing. Asset type: premium website hero background for
> ZanTap, a restaurant commerce platform launching first in Rwanda and East
> Africa. Create a photorealistic, cinematic but natural scene inside a
> contemporary independent restaurant in Kigali at early evening. A confident
> East African restaurant owner or manager stands near the service counter,
> reviewing the shift on a smartphone while the softly active kitchen and a
> staff member appear in the background. The restaurant should feel attainable,
> warm, modern, and locally authentic without stereotypes or luxury excess.
> Composition: wide 16:9 frame, subject placed toward the right third, generous
> darker negative space across the left and center for website copy and real UI
> screenshot overlays. Lighting: warm practical restaurant lights, subtle
> city-evening ambience, crisp subject, soft background depth, real skin and
> fabric texture. Palette: warm near-black, amber, natural wood, small hints of
> muted green, compatible with an off-white and black editorial website.
> Constraints: no visible brands, no logos, no readable text, no watermarks, no
> fake app screens, no exaggerated futuristic technology, no flags, no tourist
> imagery, no generic stock-photo handshake pose.

Video prompt:

> Create a subtle premium website hero background animation from this exact
> restaurant image. Slow controlled camera push-in of only a few percent. The
> restaurant owner remains on the right, calmly glances at his phone, and makes
> one small natural thumb movement. Background staff make gentle realistic
> service motions. Warm practical lights softly breathe. Preserve faces,
> clothing, restaurant geometry, composition, and the large dark negative space
> on the left. No camera shake, no fast movement, no morphing, no new objects,
> no text, no logos, no fake interface, no dramatic gestures. Seam-like calm
> ending suitable for an autoplay muted landing-page background.

The external website-builder prompt is in `higgsfield-website-prompt.md`.

## Verification

- Desktop concepts A, B, and C visually reviewed in the in-app browser.
- Responsive layouts reviewed below the 600px CSS breakpoint with no horizontal
  page overflow.
- Product image references and both generated assets resolve locally.
- Lead submission verified to create a new dashboard row and update totals.
- Dashboard search and CSV export remain wired.
- JavaScript syntax check passes.

## Verdict placeholder

Winner: **TBD**

Keep from other directions: **TBD**

Why: **TBD**

After a direction is chosen, delete this prototype and implement the decision
through a PRD and isolated issues using the production Store seam.
