"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

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
        <div className="relative mx-auto aspect-square w-full max-w-[min(100%,420px)] overflow-hidden rounded-brand-xl border border-hairline bg-canvas-soft shadow-brand-soft">
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
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === activeIndex
                      ? "w-4 bg-primary opacity-100"
                      : "w-1.5 bg-muted opacity-80"
                  )}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                disabled={activeIndex === 0}
                className="px-4"
              >
                Previous
              </Button>
              <span className="font-body text-body-sm text-muted">
                {activeIndex + 1} / {urls.length}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={goNext}
                disabled={activeIndex >= urls.length - 1}
                className="px-4"
              >
                Next
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
