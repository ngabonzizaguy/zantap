"use client";

import { QRCodeSVG } from "qrcode.react";

interface StorefrontQrProps {
  url: string;
  size?: number;
}

/**
 * Storefront QR for the "You're Live" screen. Rendered as SVG so it stays crisp
 * when the vendor screenshots it to print. Light modules on a light plate keep
 * it scannable even inside the dark wizard.
 */
export function StorefrontQr({ url, size = 168 }: StorefrontQrProps) {
  return (
    <div className="inline-flex rounded-brand-lg bg-white p-3">
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        marginSize={0}
        bgColor="#ffffff"
        fgColor="#0e0e10"
      />
    </div>
  );
}
