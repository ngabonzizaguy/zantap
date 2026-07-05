"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/primitives";

interface MenuImageLightboxProps {
  open: boolean;
  urls: string[];
  initialIndex?: number;
  itemName: string;
  onClose: () => void;
}

export function MenuImageLightbox({
  open,
  urls,
  initialIndex = 0,
  itemName,
  onClose,
}: MenuImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) {
      setActiveIndex(Math.min(initialIndex, Math.max(urls.length - 1, 0)));
    }
  }, [open, initialIndex, urls.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((index) => Math.max(index - 1, 0));
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((index) => Math.min(index + 1, urls.length - 1));
  }, [urls.length]);

  if (urls.length === 0) return null;

  const activeUrl = urls[activeIndex] ?? urls[0];

  return (
    <Modal open={open} onClose={onClose} title={itemName} className="max-w-customer">
      <div className="relative flex min-h-[50vh] flex-col">
        <div className="relative mx-auto aspect-square w-full max-w-[min(100%,420px)] overflow-hidden rounded-[20px] border border-white/60 bg-zt-blush-100 shadow-[0_12px_32px_rgba(58,44,38,0.18)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeUrl}
            alt={`${itemName} photo ${activeIndex + 1} of ${urls.length}`}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>

        {urls.length > 1 ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5"
              aria-hidden
            >
              {urls.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex
                      ? "w-4 bg-zt-brown opacity-100"
                      : "w-1.5 bg-zt-brown/40 opacity-80"
                  }`}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={activeIndex === 0}
                className="rounded-full border border-zt-blush-300 bg-white/80 px-4 py-2 text-sm font-semibold text-zt-brown disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-zt-warm">
                {activeIndex + 1} / {urls.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={activeIndex >= urls.length - 1}
                className="rounded-full border border-zt-blush-300 bg-white/80 px-4 py-2 text-sm font-semibold text-zt-brown disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
