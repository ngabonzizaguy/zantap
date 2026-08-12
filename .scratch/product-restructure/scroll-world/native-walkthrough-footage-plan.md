# ZanTap native continuous walkthrough footage plan

Status: **APPROVED FINISH PATH · PRE-PRODUCTION PLAN COMPLETE · CAPTURE PENDING**

Owner decision: **Option B, 2026-08-09**
Credit budget: **0 Higgsfield credits · 0 Monid spend**

This plan replaces further AI-chain generation with real footage from a partner
restaurant. It preserves the six existing story beats and the scroll-world
Architecture A contract: a camera that keeps moving forward, with no connectors
and no visible cuts. The complete local preview remains uncommitted and
undeployed until a separate owner approval.

## 1. Final deliverables

Capture two independent, repeatable master takes of the same journey:

1. `zantap-walkthrough-desktop-master` — native 16:9 landscape, captured in
   4K/25 fps and delivered as six 1920×1080 scrub clips.
2. `zantap-walkthrough-mobile-master` — native 9:16 portrait, captured with the
   phone physically vertical in 4K/25 fps and delivered as six 720×1280 scrub
   clips. It is not a crop of the landscape take.

Each master becomes six adjacent clips named for the existing engine IDs:
`storefront`, `order`, `momo`, `kitchen`, `dispatch`, and `grow`. Each encoded
clip also gets a poster extracted from its actual first frame. Keep the raw
masters, a cut sheet with exact frame numbers, and the final web encodes.

Target running time: **45–60 seconds per master**, roughly 6–9 seconds per beat
plus a two-second lead-in and lead-out. Record at least three complete takes in
each orientation; the best continuous take wins.

## 2. Non-negotiable capture rules

- One real partner location, one continuous forward route, no arbitrary edits.
- Never reverse direction at a section boundary. Each beat ends with about one
  second of slow, steady forward drift toward the next beat.
- No AI-generated or invented phone interfaces. Use sanitized ZanTap demo data
  on real devices, angle unreadable screens away, or let the existing HTML
  overlays carry the real ZanTap/MoMo assets.
- No customer/vendor phone numbers, owner tokens, payment references, addresses,
  notifications, browser autofill, or other personal data in frame.
- Get written location permission and releases for every identifiable person.
  Keep uncontrolled customers and bystanders out of the route.
- Record clean plates and two seconds of steady framing at both ends. Audio is
  reference-only and will be stripped from the web encodes.
- If a take contains a broken handoff, unsafe obstruction, exposed data, severe
  focus/exposure shift, or unusable motion, reshoot the full take. A motivated
  full-frame occlusion at a doorway/pillar is the only acceptable fallback
  stitch, and it still requires seam QA.

## 3. Camera and location setup

Rwanda uses 50 Hz mains power, so the default capture settings are:

- 4K UHD, **25 fps**, SDR/Rec.709, shutter **1/50** to reduce indoor light
  flicker; disable HDR/Dolby Vision and variable frame rate when the camera app
  allows it.
- Use the phone's primary 1× lens. Do not switch lenses or use digital zoom
  during a take.
- Gimbal in pan-follow/lock mode; slow walking pace, bent knees, no whip pans,
  speed ramps, or artificial zooms.
- Lock white balance, exposure, and focus after testing the darkest kitchen and
  brightest doorway. Lower device-screen brightness until screens retain detail
  without clipping.
- Clean the lens, enable Do Not Disturb, charge the phone/gimbal, reserve at
  least 20 GB, and remove reflective clutter from the route.
- Light for a warm Kigali late-afternoon/evening look: natural wood, amber
  practicals, muted greens, warm near-black surfaces. Avoid mixed-color LEDs
  and visible light flicker.

Before filming, tape unobtrusive floor marks for the camera path, actor positions,
bag handoff, and the six section boundaries. Rehearse the full route until the
camera, customer, kitchen team, and driver can perform it without stopping.

## 4. Continuous route and choreography

| Beat | Approx. time | Camera route and action | Screen/data treatment |
|---|---:|---|---|
| Storefront | 0–8 s | Begin outside at the real storefront, cross the threshold, and glide toward the counter. End drifting toward the customer/order position. | Real signage is allowed with permission; no unrelated customer faces. |
| Order | 8–16 s | Pass over/alongside a staged customer's shoulder as they browse ZanTap, then continue past the phone toward the payment position. | Use a seeded demo storefront with no personal details. Keep the phone readable only if the screen is stable and authentic; the HTML overlay remains available. |
| MoMo | 16–24 s | Capture the payment gesture and acknowledgement without stopping, then carry forward toward the kitchen pass/doorway. | Do not show a live account, balance, PIN, phone number, or transaction reference. Prefer an oblique/dim screen and retain the official MoMo HTML badge. |
| Kitchen | 24–34 s | Move through the pass into the working kitchen, reveal the real ZanTap KDS and food preparation, then settle into forward motion behind the packed order. | KDS must use seeded demo orders with no PII; existing HTML KDS screen chip remains the reliable readable layer. |
| Dispatch | 34–43 s | Follow the packed bag to the handoff, continue through the exit with the driver, and keep moving toward the exterior/finale position. | No licence plates, driver phone numbers, or delivery addresses. |
| Grow | 43–55 s | Finish on a visibly active business: fuller tables, multiple prepared orders, or the team at the lively storefront. Ease to a slow forward settle with clean negative space for the CTA. | Releases for all visible people; hold the last composition for two seconds. |

The portrait take repeats the same choreography with actors and key props kept in
the center 60% of frame. It must be recomposed, not cropped. Copy occupies the
lower/side overlay zones in the current engine, so keep important faces, hands,
food, and screens away from those collision zones during the framing rehearsal.

## 5. Ingest and edit contract

Create an ingest folder only after footage exists:

```text
.scratch/product-restructure/scroll-world/native-footage/
  raw/desktop/
  raw/mobile/
  selects/
  cut-sheet.md
  qa-shots/
```

1. Copy originals without transcoding and retain camera metadata in the raw
   archive. Public outputs must not carry GPS or personal metadata.
2. Choose one complete landscape take and one complete portrait take. Apply only
   restrained stabilization, exposure/white-balance matching, and color work.
   Do not use generative fill, AI frame interpolation, AI screen replacement, or
   upscaling.
3. Record exact start/end **frame numbers** for all six beats. Adjacent clips
   share the same source boundary frame (`clip i` ends on frame N and `clip i+1`
   begins on frame N), preserving composition at the engine crossfade.
4. Encode from the selected master in one scripted batch so every clip in an
   orientation uses identical settings.
5. Extract every poster from frame zero of the corresponding final encoded clip;
   do not reuse the current AI stills as final posters.

Desktop delivery settings follow the existing scrub contract: H.264, 1920×1080,
CRF 20, slow preset, yuv420p, GOP 8, scene-cut keyframes disabled, no audio, and
faststart. Mobile uses H.264, 720×1280, CRF 23, GOP 4, no audio, and faststart.
The 4K originals remain the archive; the smaller web deliveries are deliberate
for Rwanda mobile data budgets.

Template encode filters (replace frame placeholders from `cut-sheet.md`):

```text
desktop: trim=start_frame=START:end_frame=END,setpts=PTS-STARTPTS,scale=1920:1080:flags=lanczos,setsar=1,unsharp=5:5:0.8:5:5:0
mobile:  trim=start_frame=START:end_frame=END,setpts=PTS-STARTPTS,scale=720:1280:flags=lanczos,setsar=1
```

Run `ffprobe` on every output. Reject clips with the wrong orientation, variable
frame rate, audio tracks, missing duration, or inconsistent dimensions.

## 6. Later integration work (not authorized by this planning decision)

When approved footage is delivered, a separate implementation session will:

1. Extend `ScrollWorldSection`/`scrub-engine.ts` with optional `clipMobile` and
   `stillMobile` fields, following the stock skill engine. Portrait phones use
   native 9:16 assets; desktop uses 16:9. No center-crop is shipped as mobile.
2. Replace all six preview clip/still mappings with the real web encodes and
   their actual first-frame posters. Keep `connectors: []` and `crossfade: 0.08`.
3. Preserve the real MoMo/ZanTap HTML overlays and the finale CTA to
   `#lead-form`; do not bake logos or readable UI into substitute media.
4. Re-run the existing `preview-qa.mjs` suite and extend it to assert:
   - all six desktop and all six native portrait clips are requested in the
     correct viewport;
   - desktop `videoWidth > videoHeight` and mobile `videoWidth < videoHeight`;
   - blob seekability and scroll/currentTime tracking for every clip;
   - before/after screenshots at all five boundaries in both orientations;
   - fast-flick behavior under 4–6× CPU throttling, iOS first-frame priming,
     URL-bar resize stability, rotation, reduced-motion, and Save-Data;
   - zero PII/fake UI, no console errors, no overflow, CTA reachability, and
     acceptable total transfer size.
5. Run lint, tests, production build, and local owner review. Commit/deploy and
   production smoke remain a separate explicit owner gate.

## 7. Next owner prerequisites

Before capture can be scheduled, the owner supplies or confirms:

- the partner restaurant and written filming permission;
- a quiet 2–3 hour capture window plus the desired golden-hour timing;
- phone/gimbal availability and whether the camera app can lock 25 fps,
  1/50 shutter, white balance, exposure, and focus;
- the staged customer, kitchen staff, driver, and appearance releases;
- a seeded ZanTap demo vendor/order set with no personal data;
- whether recognizable partner branding should remain visible.

No credit balance check is needed for this path. No Higgsfield, Monid, or image
generation command belongs in the capture or integration workflow.
