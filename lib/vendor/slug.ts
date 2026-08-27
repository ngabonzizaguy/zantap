/** Valid slug after normalization: lowercase alphanumeric segments separated by hyphens. */
export const VENDOR_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Slugs that can never become a vendor storefront because they collide with
 * app routes, public asset folders, or paths reserved for the marketing site
 * (root funnel, ADR-0049). Enforced at the Store seam (`isSlugAvailable` in
 * both adapters) so provisioning, profile rename, and operator rename all
 * reject them.
 */
export const RESERVED_VENDOR_SLUGS: ReadonlySet<string> = new Set([
  // Live app routes
  "api",
  "briefing",
  "onboard",
  "ops",
  "restaurants",
  "slip",
  "vendor",
  // Public asset folders served from the same origin
  "brand",
  "marketing",
  // Marketing/legal paths reserved for the funnel site
  "about",
  "admin",
  "blog",
  "contact",
  "help",
  "legal",
  "pricing",
  "privacy",
  "terms",
]);

export function isReservedVendorSlug(slug: string): boolean {
  return RESERVED_VENDOR_SLUGS.has(normalizeVendorSlug(slug));
}

/**
 * Normalizes a raw slug for vendor storefront + KDS routes.
 * Lowercase, trim, spaces → hyphens, strip invalid characters.
 */
export function normalizeVendorSlug(raw: string): string {  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidVendorSlug(raw: string): boolean {
  const normalized = normalizeVendorSlug(raw);
  return normalized.length > 0 && VENDOR_SLUG_PATTERN.test(normalized);
}
