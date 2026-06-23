import type { MenuImage, MenuItem } from "@/lib/types";

export const MAX_MENU_IMAGES = 6;
export const MAX_MENU_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MENU_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMenuImageMime = (typeof ALLOWED_MENU_IMAGE_MIMES)[number];

export class MenuImageError extends Error {
  readonly code: "MAX_IMAGES" | "NOT_FOUND" | "INVALID_SET";

  constructor(
    message: string,
    code: "MAX_IMAGES" | "NOT_FOUND" | "INVALID_SET"
  ) {
    super(message);
    this.name = "MenuImageError";
    this.code = code;
  }
}

export function validateMenuImageFile(
  byteLength: number,
  mime: string
): string | null {
  if (!ALLOWED_MENU_IMAGE_MIMES.includes(mime as AllowedMenuImageMime)) {
    return "Only JPEG, PNG, and WebP images are allowed";
  }
  if (byteLength > MAX_MENU_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller";
  }
  if (byteLength <= 0) {
    return "Image file is empty";
  }
  return null;
}

export function sortMenuImages(images: MenuImage[]): MenuImage[] {
  return [...images].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.getTime() - b.createdAt.getTime()
  );
}

/** Primary gallery URL with legacy imageUrl fallback. */
export function getPrimaryImageUrl(item: MenuItem): string | undefined {
  return item.images?.find((image) => image.isPrimary)?.url ?? item.imageUrl;
}

export function assertCanAddMenuImage(currentCount: number): void {
  if (currentCount >= MAX_MENU_IMAGES) {
    throw new MenuImageError(
      `Maximum ${MAX_MENU_IMAGES} images per item`,
      "MAX_IMAGES"
    );
  }
}

export function nextMenuImageSortOrder(images: MenuImage[]): number {
  if (images.length === 0) return 0;
  return Math.max(...images.map((image) => image.sortOrder)) + 1;
}

export function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export function buildMenuBlobPathname(
  vendorSlug: string,
  itemId: string,
  mime: string
): string {
  const ext = extensionForMime(mime);
  return `menu/${vendorSlug}/${itemId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
}

export function pickNextPrimaryImage(
  images: MenuImage[],
  excludeId?: string
): MenuImage | undefined {
  return sortMenuImages(images).find((image) => image.id !== excludeId);
}
