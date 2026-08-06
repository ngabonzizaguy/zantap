/**
 * Single origin seam for storefront, QR, share, and WhatsApp links (G1 / Issue 11).
 * Uses NEXT_PUBLIC_BASE_URL when set; otherwise falls back to window.location.origin
 * on the client. Server renders without a runtime origin when unset.
 */

/** Public site origin with no trailing slash. */
export function getBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return "";
}

/** Host prefix for slug inputs, e.g. `zantap.app/` or `localhost:3000/`. */
export function getDisplayHostPrefix(): string {
  const base = getBaseUrl();
  if (!base) return "";

  try {
    const parsed = base.includes("://") ? new URL(base) : new URL(`https://${base}`);
    return `${parsed.host}/`;
  } catch {
    return `${base.replace(/^https?:\/\//, "").replace(/\/$/, "")}/`;
  }
}

/** Full storefront URL for QR codes, share links, and clipboard copy. */
export function getStorefrontUrl(slug: string): string {
  const origin = getBaseUrl();
  const path = `/${slug.replace(/^\/+/, "")}`;
  return origin ? `${origin}${path}` : path;
}

/** Storefront path without protocol for compact display, e.g. `zantap.app/inka`. */
export function formatStorefrontDisplayPath(slug: string): string {
  return getStorefrontUrl(slug).replace(/^https?:\/\//, "");
}
