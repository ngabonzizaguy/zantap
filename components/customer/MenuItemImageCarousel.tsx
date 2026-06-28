"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const SHELL_CHROME =
  "overflow-hidden border border-white/70 shadow-[inset_0_2px_6px_rgba(255,255,255,0.5),0_6px_14px_rgba(170,110,100,0.16)]";

export type CarouselVariant = "thumb" | "header" | "hero";

const VARIANT_SHELL: Record<CarouselVariant, string> = {
  thumb: "h-[72px] w-[72px] rounded-2xl",
  header: "h-[88px] w-[88px] rounded-[20px]",
  hero: "h-[200px] w-full rounded-[22px]",
};

const VARIANT_ICON_SIZE: Record<CarouselVariant, number> = {
  thumb: 28,
  header: 30,
  hero: 48,
};

const VARIANT_INDICATOR: Record<CarouselVariant, "dots" | "count"> = {
  thumb: "dots",
  header: "count",
  hero: "dots",
};

interface MenuItemImageCarouselProps {
  urls: string[];
  fallbackBg: string;
  /** Extra classes appended to the shell (e.g. layout/flex helpers). */
  className?: string;
  /** Shell size + default indicator. Defaults to the 72×72 thumb. */
  variant?: CarouselVariant;
  /** Override the default indicator for the chosen variant. */
  indicator?: "dots" | "count";
}

export function MenuItemImageCarousel({
  urls,
  fallbackBg,
  className = "",
  variant = "thumb",
  indicator,
}: MenuItemImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const shell = `${SHELL_CHROME} ${VARIANT_SHELL[variant]}`;
  const indicatorKind = indicator ?? VARIANT_INDICATOR[variant];

  const syncActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), urls.length - 1));
  }, [urls.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || urls.length < 2) return;

    syncActiveIndex();

    const observer = new ResizeObserver(syncActiveIndex);
    observer.observe(el);
    return () => observer.disconnect();
  }, [urls.length, syncActiveIndex]);

  if (urls.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${shell} ${className}`}
        style={{ background: fallbackBg }}
      >
        <Icon
          name="plate"
          size={VARIANT_ICON_SIZE[variant]}
          className="stroke-white/90"
        />
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div
        className={`${shell} ${className}`}
        role="img"
        aria-label="Menu item photo"
        style={{
          background: `center / cover no-repeat url(${urls[0]})`,
        }}
      />
    );
  }

  return (
    <div className={`relative ${shell} ${className}`}>
      <div
        ref={scrollRef}
        onScroll={syncActiveIndex}
        className="zt-hidescroll flex h-full w-full snap-x snap-mandatory overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {urls.map((url, index) => (
          <div
            key={`${url}-${index}`}
            role="img"
            aria-label={`Photo ${index + 1} of ${urls.length}`}
            className="h-full w-full flex-none snap-center bg-cover bg-center"
            style={{ backgroundImage: `url(${url})` }}
          />
        ))}
      </div>

      {indicatorKind === "count" ? (
        <div
          className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm"
          aria-hidden
        >
          {activeIndex + 1}/{urls.length}
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5"
          aria-hidden
        >
          {urls.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-4 bg-white opacity-100"
                  : "w-1.5 bg-white/60 opacity-80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
