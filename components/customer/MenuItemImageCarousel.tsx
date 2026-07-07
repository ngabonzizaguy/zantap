"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

const SHELL_CHROME =
  "overflow-hidden border border-hairline shadow-brand-soft";

export type CarouselVariant = "thumb" | "header" | "hero";

const VARIANT_SHELL: Record<CarouselVariant, string> = {
  thumb: "h-[72px] w-[72px] rounded-brand-lg",
  header: "h-[88px] w-[88px] rounded-brand-xl",
  hero: "h-[200px] w-full rounded-brand-xl",
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
  /** Controlled slide index (syncs header carousel ↔ Photos strip). */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

export function MenuItemImageCarousel({
  urls,
  fallbackBg,
  className = "",
  variant = "thumb",
  indicator,
  activeIndex: controlledIndex,
  onActiveIndexChange,
}: MenuItemImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
  const isControlled = controlledIndex !== undefined;
  const activeIndex = isControlled ? controlledIndex : uncontrolledIndex;
  const programmaticScroll = useRef(false);

  const shell = `${SHELL_CHROME} ${VARIANT_SHELL[variant]}`;
  const indicatorKind = indicator ?? VARIANT_INDICATOR[variant];

  const setIndex = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), Math.max(urls.length - 1, 0));
      if (!isControlled) setUncontrolledIndex(clamped);
      onActiveIndexChange?.(clamped);
    },
    [isControlled, onActiveIndexChange, urls.length]
  );

  const syncActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth <= 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.min(Math.max(index, 0), urls.length - 1);
    if (programmaticScroll.current) {
      programmaticScroll.current = false;
      return;
    }
    if (clamped !== activeIndex) setIndex(clamped);
  }, [activeIndex, setIndex, urls.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || urls.length < 2) return;

    syncActiveIndex();

    const observer = new ResizeObserver(syncActiveIndex);
    observer.observe(el);
    return () => observer.disconnect();
  }, [urls.length, syncActiveIndex]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || urls.length < 2 || controlledIndex === undefined) return;
    const target = controlledIndex * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > 1) {
      programmaticScroll.current = true;
      el.scrollTo({ left: target, behavior: "smooth" });
    }
  }, [controlledIndex, urls.length]);

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
      <div className={`relative ${shell} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[0]}
          alt=""
          role="img"
          aria-label="Menu item photo"
          className="absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
        />
      </div>
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
            className="relative h-full w-full flex-none snap-center overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              role="img"
              aria-label={`Photo ${index + 1} of ${urls.length}`}
              className="absolute inset-0 h-full w-full object-cover object-center"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {indicatorKind === "count" ? (
        <div
          className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-pill bg-ink/55 px-2 py-0.5 font-body text-caption font-medium text-on-primary backdrop-blur-sm"
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
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex
                  ? "w-4 bg-white opacity-100"
                  : "w-1.5 bg-white/60 opacity-80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MenuItemPhotoStripProps {
  urls: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Horizontal thumbnail picker + dot row (customize sheet "Photos" section). */
export function MenuItemPhotoStrip({
  urls,
  activeIndex,
  onSelect,
}: MenuItemPhotoStripProps) {
  if (urls.length < 2) return null;

  return (
    <div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {urls.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            aria-label={`View photo ${index + 1} of ${urls.length}`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => onSelect(index)}
            className={cn(
              "relative h-[72px] w-[72px] flex-none overflow-hidden rounded-brand-lg border-2 transition",
              index === activeIndex
                ? "border-primary shadow-brand-soft"
                : "border-hairline opacity-85"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              draggable={false}
            />
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
        {urls.map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === activeIndex
                ? "w-4 bg-primary"
                : "w-1.5 bg-hairline-strong"
            )}
          />
        ))}
      </div>
    </div>
  );
}
