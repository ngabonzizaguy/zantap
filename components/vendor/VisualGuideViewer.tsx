"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Button, Modal } from "@/components/ui/primitives";
import {
  getVisualGuide,
  isVisualGuideComplete,
  markVisualGuideComplete,
  markVisualGuideDismissed,
  type VisualGuideId,
} from "@/lib/kds/visual-guides";

interface VisualGuideViewerProps {
  guideId: VisualGuideId;
  vendorSlug: string;
  onClose: () => void;
  onShowMe: () => void;
}

export function VisualGuideViewer({
  guideId,
  vendorSlug,
  onClose,
  onShowMe,
}: VisualGuideViewerProps) {
  const guide = getVisualGuide(guideId);
  const [frameIndex, setFrameIndex] = useState(0);
  const frame = guide.frames[frameIndex];
  const isLastFrame = frameIndex === guide.frames.length - 1;

  const goBack = useCallback(() => {
    setFrameIndex((current) => Math.max(0, current - 1));
  }, []);

  const goNext = useCallback(() => {
    setFrameIndex((current) =>
      Math.min(guide.frames.length - 1, current + 1)
    );
  }, [guide.frames.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") goBack();
      if (event.key === "ArrowRight" && !isLastFrame) goNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, goNext, isLastFrame]);

  const handleClose = () => {
    try {
      if (!isVisualGuideComplete(localStorage, vendorSlug, guideId)) {
        markVisualGuideDismissed(localStorage, vendorSlug, guideId);
      }
    } catch {
      // Private browsing and storage quotas must never trap the Vendor.
    }
    onClose();
  };

  const handleShowMe = () => {
    try {
      markVisualGuideComplete(localStorage, vendorSlug, guideId);
    } catch {
      // Completion persistence is a convenience; navigation still succeeds.
    }
    onShowMe();
  };

  const frameRatio = frame.imageWidth / frame.imageHeight;

  return (
    <Modal
      open
      onClose={handleClose}
      title={guide.title}
      className="h-[min(94dvh,920px)]"
      panelStyle={{ maxWidth: "56rem" }}
      footer={
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-brand-lg border border-hairline bg-surface-strong p-3 sm:p-4">
            <span
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary font-body text-body-strong text-[#0c0a09]"
              aria-hidden="true"
            >
              {frameIndex + 1}
            </span>
            <div>
              <p className="font-body text-caption-uppercase uppercase text-primary">
                {frame.stage}
              </p>
              <p className="mt-1 font-body text-body-sm text-ink sm:text-body-md">
                {frame.instruction}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              size="kds"
              variant="outline"
              disabled={frameIndex === 0}
              onClick={goBack}
            >
              Back
            </Button>
            <Button
              type="button"
              size="kds"
              onClick={isLastFrame ? handleShowMe : goNext}
            >
              {isLastFrame ? guide.showMe.label : "Next"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex min-h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-body text-caption-uppercase uppercase text-primary">
            Visual guide
          </p>
          <p
            className="font-body text-body-sm font-medium text-primary"
            aria-live="polite"
          >
            {frameIndex + 1} of {guide.frames.length}
          </p>
        </div>

        <div
          className="relative mx-auto w-full max-w-[calc(var(--guide-frame-ratio)*43dvh)] overflow-hidden rounded-brand-lg border border-hairline bg-[#09090b] shadow-brand-soft sm:max-w-[calc(var(--guide-frame-ratio)*56dvh)]"
          style={{
            aspectRatio: `${frame.imageWidth} / ${frame.imageHeight}`,
            "--guide-frame-ratio": frameRatio,
          } as React.CSSProperties}
        >
          <Image
            src={frame.imageSrc}
            alt={frame.imageAlt}
            fill
            priority
            sizes="(max-width: 768px) 90vw, 560px"
            className="object-contain"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-brand-md border-2 border-primary shadow-[0_0_0_3px_rgba(245,166,35,0.15),0_0_24px_rgba(245,166,35,0.35)]"
            style={{
              left: `${frame.callout.left}%`,
              top: `${frame.callout.top}%`,
              width: `${frame.callout.width}%`,
              height: `${frame.callout.height}%`,
            }}
          />
        </div>

      </div>
    </Modal>
  );
}
