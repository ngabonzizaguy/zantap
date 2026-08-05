# ZanTap Logo-2 Z — Exact Source Lock

Status: **APPROVED — 2026-07-29**

## Source of truth

- Canonical logo: `public/brand/zantap-logo-2.png`
- Required emblem: the upper black-and-amber Z mark exactly as drawn in that file
- The emblem geometry must never be regenerated, simplified, modernized, or reinterpreted.

## Higgsfield preservation instruction

Higgsfield was given only the user's correct cropped emblem and instructed to:

```text
Isolate the exact black-and-amber ZanTap emblem shown in the reference image.
Change only the white background.
Preserve the black outer contours, top bar, diagonal stroke, inward curve,
curved negative-space cut, lower black sweep, amber tap ripples, spacing,
proportions, orientation, and relative placement.
Do not redraw, reinterpret, simplify, modernize, straighten, thicken, thin,
rotate, crop, or invent any geometry.
```

The Higgsfield result was rejected because it changed the proportions and enlarged the lower sweep. It is stored only under `proofs/rejected/` for audit history.

## Approved production method

The current proof uses a deterministic extraction from `zantap-logo-2.png`:

1. Crop only the upper emblem, excluding the ZanTap wordmark.
2. Remove the light background.
3. Preserve the original black-and-amber pixels and geometry.
4. Add transparent or off-white square padding without redrawing the mark.

Approved production assets:

- `zantap-z-logo2-exact-transparent-v2.png`
- `zantap-z-logo2-exact-white-v2.png`
- `zantap-z-logo2-exact-favicon-32-preview.png`
- `zantap-z-logo2-exact-approval-sheet.png`
