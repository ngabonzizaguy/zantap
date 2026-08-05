# ZanTap Cover Options — Generation and Composition Record

## Generation mode

The three atmospheric plates were generated with the built-in image-generation tool. The model
was instructed to create backgrounds only.

Common constraints for every plate:

- Extreme-wide panoramic ZanTap Facebook/X cover background.
- Charcoal `#0E0E10`, amber `#F5A623`, and warm off-white palette.
- Quiet zones for brand copy and two real product screenshots.
- No text, letters, logo, Z, wordmark, devices, UI, people, food, QR code, or watermark.
- No generated interface or generated campaign copy.

## Prompt directions

### Option 1 — Warm Flow

Warm off-white parchment transitioning into deep charcoal, with a restrained amber tap ripple and
flowing light trail. Premium editorial technology atmosphere with subtle film grain and restrained
mint, peach, lavender, and sky accents.

### Option 2 — Night Signal

Near-black operational canvas with a soft amber horizon, a large concentric tap signal slightly
left of center, and a precise amber line travelling toward two calm product-placement zones.
Minimal, cinematic, warm, and explicitly not cyberpunk.

### Option 3 — Editorial Arc

Warm ivory and charcoal architectural arcs interlocking around the center, with a restrained amber
tap pulse and curved path. Tactile editorial paper texture, gentle light, and small blush/sage
accents.

## Deterministic post-production

- Exact approved Z: `public/brand/approved-z/zantap-z-mark-1024.png`
- Real wordmark: `public/brand/approved-z/zantap-wordmark-logo2-transparent.png`
- Customer screen: `public/brand/UI-screens/Screenshot 2026-07-10 042351.png`
- Kitchen screen: `public/brand/UI-screens/Screenshot 2026-07-10 042559.png`
- Headline: `Order simply. Serve smoothly.`
- Support line: `From customer tap to kitchen flow.`
- Location line: `BUILT FOR KIGALI FOOD BUSINESSES`

Composition script:

`.scratch/social-account-branding/compose_cover_options.py`

## Option 3 Revision B — Tap. Serve. Grow.

The user selected Option 3 and requested a more meaningful campaign story with short copy and 3D
assets. The built-in image-generation tool edited only the atmospheric background:

- The central tap pulse became a raised amber disc with shallow concentric rings.
- An ivory pearl, amber handoff cube, and charcoal signal sphere follow the path to suggest
  order → handoff → momentum.
- The warm editorial arcs, botanical accents, charcoal operational half, and device zones were
  preserved.
- No generated text, logo, interface, phone, or wordmark was accepted.

Deterministic Revision B copy:

- Headline: `Tap. Serve. Grow.`
- Support line: `One smooth flow—from every order to every kitchen.`
- Flow label: `ORDER • KITCHEN • MOMENTUM`

Revision B proof:

`public/brand/cover-proofs/zantap-cover-option-3-rev-b-tap-serve-grow.png`

## Approved and live platform exports

Revision B was approved on 2026-07-29 and exported deterministically:

- X header: `1500 × 500`, with core content inside the central area that remains visible if X
  crops up to 60 pixels from the top and bottom.
- The initial Facebook proof used the exact same `1500 × 500` file as X. The files passed matching
  SHA-256 and pixel-difference checks, but Facebook's live 2.7:1 display cropped both horizontal
  edges of that 3:1 upload.
- The final Facebook Page cover is `1500 × 556`. It preserves the complete X artwork as one
  unchanged `1500 × 500` band and adds only 28-pixel edge-row continuations above and below.
- The live Facebook cover shows the complete wordmark, headline, left-side leaves, amber path, and
  both product screens. There is no duplicate background layer or omitted artwork.
- Both covers were uploaded and visually verified on their live profiles on 2026-07-29.

Files:

- `platform-exports/zantap-x-header-option-3-rev-b-1500x500.png`
- `platform-exports/zantap-facebook-cover-full-x-artwork-1500x556.png`
- `platform-exports/zantap-cover-platform-placement-proof.png`

Rejected:

- `platform-exports/rejected/zantap-facebook-cover-option-3-rev-b-1640x924-rejected.png`
- `platform-exports/rejected/zantap-facebook-cover-exact-match-x-1500x500-rejected-live-crop.png`

Export script:

`.scratch/social-account-branding/export_platform_crops.py`
