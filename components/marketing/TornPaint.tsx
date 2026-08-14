/**
 * Torn-paint primitives (owner's brush-splash reference, round 8):
 *
 * - `TornPanelBackdrop` replaces a card's straight edges — mount as the first
 *   child of a `relative isolate` container and the panel's background becomes
 *   a cream sheet whose edges are ragged like torn watercolor paper.
 * - `TornDivider` is a full-width cream seam with torn top/bottom edges, used
 *   where the scroll-world walkthrough begins and ends.
 *
 * Pure inline SVG; the ragged edges come from feTurbulence + feDisplacementMap.
 * Brand palette only: cream `#faf7f2`/`#efe8da` on near-black, amber accents.
 */

export function TornPanelBackdrop() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 480 640"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-3 -z-10 h-[calc(100%+24px)] w-[calc(100%+24px)] drop-shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
    >
      <defs>
        <filter id="torn-panel" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.032 0.024"
            numOctaves="4"
            seed="9"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" />
        </filter>
      </defs>
      <rect
        x="14"
        y="14"
        width="452"
        height="612"
        fill="#faf7f2"
        filter="url(#torn-panel)"
      />
    </svg>
  );
}

/**
 * Dark torn edge overlaid on the walkthrough footage seams: the page's own
 * near-black background tears into the media — no new color introduced.
 * Mount inside a `relative` wrapper around the footage; `position` picks the
 * seam. Pointer-events pass through.
 */
export function TornEdge({ position }: { position: "top" | "bottom" }) {
  const isTop = position === "top";
  return (
    <div
      aria-hidden
      className={
        isTop
          ? "pointer-events-none absolute inset-x-0 top-0 z-[60] h-[64px] sm:h-[84px]"
          : "pointer-events-none absolute inset-x-0 bottom-0 z-[60] h-[64px] sm:h-[84px]"
      }
    >
      <svg
        viewBox="0 0 1440 84"
        preserveAspectRatio="none"
        className={
          isTop
            ? "h-full w-full"
            : "h-full w-full -scale-x-100 -scale-y-100"
        }
      >
        <defs>
          <filter id="torn-edge" x="-5%" y="-60%" width="110%" height="220%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.05"
              numOctaves="4"
              seed="4"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" />
          </filter>
        </defs>
        {/* Dark sheet anchored above the seam; its lower boundary is the tear */}
        <rect
          x="-20"
          y="-40"
          width="1480"
          height="86"
          fill="#0c0a09"
          filter="url(#torn-edge)"
        />
      </svg>
    </div>
  );
}
