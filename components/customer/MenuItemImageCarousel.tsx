"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const THUMB_SHELL =
  "h-[72px] w-[72px] overflow-hidden rounded-2xl border border-white/70 shadow-[inset_0_2px_6px_rgba(255,255,255,0.5),0_6px_14px_rgba(170,110,100,0.16)]";

interface MenuItemImageCarouselProps {
  urls: string[];
  fallbackBg: string;
  className?: string;
}

export function MenuItemImageCarousel({
  urls,
  fallbackBg,
  className = "",
}: MenuItemImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
        className={`flex items-center justify-center ${THUMB_SHELL} ${className}`}
        style={{ background: fallbackBg }}
      >
        <Icon name="plate" size={28} className="stroke-white/90" />
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div
        className={`${THUMB_SHELL} ${className}`}
        role="img"
        aria-label="Menu item photo"
        style={{
          background: `center / cover no-repeat url(${urls[0]})`,
        }}
      />
    );
  }

  return (
    <div className={`relative ${THUMB_SHELL} ${className}`}>
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
            className="h-[72px] w-[72px] flex-none snap-center bg-cover bg-center"
            style={{ backgroundImage: `url(${url})` }}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center gap-1"
        aria-hidden
      >
        {urls.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 rounded-full transition-opacity ${
              index === activeIndex
                ? "bg-white opacity-100"
                : "bg-white/60 opacity-80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
