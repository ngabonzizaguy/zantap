"use client";

import { useState, type ReactNode } from "react";

interface PublicCustomerImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  fallback: ReactNode;
}

export function publicCustomerImageSrc(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function PublicCustomerImage({
  src,
  alt,
  width,
  height,
  className,
  fallback,
}: PublicCustomerImageProps) {
  const safeSrc = publicCustomerImageSrc(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!safeSrc || failedSrc === safeSrc) return fallback;

  return (
    // These URLs are already approved public storefront data. Keeping delivery
    // in the browser avoids coupling runtime rendering to an optimizer host list.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safeSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(safeSrc)}
    />
  );
}
