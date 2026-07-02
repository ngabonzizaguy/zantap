"use client";

import { useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/cn";

interface StorefrontQrProps {
  url: string;
  size?: number;
  slug?: string;
  showActions?: boolean;
  className?: string;
}

const actionButtonClass =
  "inline-flex h-10 min-h-10 flex-1 items-center justify-center rounded-brand-md border border-hairline-strong bg-surface-card px-3 font-body text-body-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Storefront QR for onboarding and KDS Setup. Rendered as SVG so it stays crisp
 * on screen; Download PNG rasterizes at 4× for print-ready output.
 */
export function StorefrontQr({
  url,
  size = 168,
  slug,
  showActions = false,
  className,
}: StorefrontQrProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const rasterizePng = useCallback(async (): Promise<string | null> => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return null;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(svgBlob);

    try {
      return await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const scale = 4;
          const canvas = document.createElement("canvas");
          canvas.width = size * scale;
          canvas.height = size * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas is not supported"));
            return;
          }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => reject(new Error("Failed to rasterize QR"));
        img.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }, [size]);

  const handleDownload = () => {
    void rasterizePng().then((png) => {
      if (!png) return;
      const link = document.createElement("a");
      link.download = slug
        ? `zantap-${slug}-qr.png`
        : "zantap-storefront-qr.png";
      link.href = png;
      link.click();
    });
  };

  const handlePrint = () => {
    void rasterizePng().then((png) => {
      if (!png) return;
      const printWindow = window.open("", "_blank", "noopener,noreferrer");
      if (!printWindow) return;

      printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Storefront QR</title>
    <style>
      body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      img { width: 280px; height: 280px; }
    </style>
  </head>
  <body>
    <img src="${png}" alt="Storefront QR code" />
  </body>
</html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    });
  };

  return (
    <div className={cn("flex w-full flex-col items-center gap-3", className)}>
      <div
        ref={containerRef}
        className="inline-flex rounded-brand-lg bg-white p-3"
      >
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          marginSize={0}
          bgColor="#ffffff"
          fgColor="#0e0e10"
        />
      </div>
      {showActions ? (
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className={actionButtonClass}
          >
            Download PNG
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className={actionButtonClass}
          >
            Print
          </button>
        </div>
      ) : null}
    </div>
  );
}
