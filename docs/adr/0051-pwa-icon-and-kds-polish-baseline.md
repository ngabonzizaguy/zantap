# ADR-0051 — PWA, icon, and KDS polish baseline

Date: 2026-08-08

## Status

Accepted.

## Context

ZanTap had branded browser icons but no web app manifest, service worker,
installable KDS entry point, or explicit offline state. Its shared UI icons were
hand-authored paths with uneven visual quality. KDS also opened first-run
coachmarks, emphasized a large floating question mark, rendered deferred Setup
Guide items like active work, and defaulted its queue to oldest-first.

The owner made PWA readiness the priority, requested a professional free and
themeable icon system, temporarily disabled Setup Guide tooltips, asked for
subtler help and newest-first orders. A grayed treatment for deferred “Soon”
work was tried and rejected after visual review.

## Decision

1. Use the approved black-and-amber ZanTap Z for launcher assets. Ship 192 and
   512 pixel `any` and `maskable` PNGs through root and vendor-specific
   manifests. Vendor manifests start at that vendor's KDS and use the dark KDS
   theme; the root manifest starts at the public product.
2. Replace hand-drawn UI SVG paths with the ISC-licensed `lucide-react` package
   behind the existing semantic `Icon` adapter. Call sites retain product names
   and theme icons via `currentColor`, size, and stroke width.
3. Register a root service worker only in production. It version-caches only the
   offline shell and static Next/brand/PWA assets. Navigations remain
   network-first with an offline fallback. API, SSE, payment, and privileged
   responses are never cached.
4. Show a concise global offline status. Offline writes remain prohibited; the
   kitchen-stage queue is a separate Issue 09b decision.
5. Keep coachmark code but disable every mount behind
   `KDS_COACHMARKS_ENABLED = false`; remove the Setup Guide reset UI while off.
6. Keep the help tap target at 44 pixels but reduce the visible question glyph,
   weight, contrast, and shadow emphasis.
7. Render non-interactive `comingSoon` checklist rows with the same surface,
   opacity, label, and hint treatment as actionable rows, distinguished only by
   a textual “Soon” badge.
8. Default both the queue sorter and KDS sort control state to newest-first;
   retain oldest-first as an explicit choice.
9. Keep tappable controls on their resting KDS surface through hover and active
   states. The dark theme records each surface's resting background and reuses
   it for interaction-state utilities, preventing sticky mobile `:hover` from
   painting light editorial fills. Focus outlines and press-scale feedback stay
   enabled.
10. Use History's contained horizontal swipe-rail pattern for the Orders stage
    filters: inset within the content viewport, touch momentum enabled, and each
    chip a snap point. The rail may scroll, but the KDS document must not.

## Consequences

- ZanTap becomes installable with a KDS-specific launch target and professional,
  consistent UI glyphs without changing icon call sites across product areas.
- Offline behavior is honest and safe: users get a shell and clear status, but
  no payment or operational mutation is queued.
- `lucide-react` becomes a runtime dependency; tree-shaken named imports limit
  shipped glyph code.
- Coachmarks can be restored with one flag, but the disabled constant and Setup
  Guide UI must be revisited together.
- KDS controls no longer use background-color changes as hover/press feedback;
  keyboard focus and transform feedback carry those interaction cues instead.
- Orders stage chips remain swipeable without widening the page or clipping the
  rail outside the content viewport.
- The future offline stage queue/chime remains explicitly unimplemented.
