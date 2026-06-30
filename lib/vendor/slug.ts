/** Valid slug after normalization: lowercase alphanumeric segments separated by hyphens. */
export const VENDOR_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
