import type { MenuItem, Vendor } from "@/lib/types";
import type { VendorUpdateEntryInput } from "@/lib/vendor-updates/types";

function normalized(value: string | undefined): string {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function publicDishImage(item: MenuItem): string | undefined {
  return item.images?.find((image) => image.isPrimary)?.url ?? item.imageUrl;
}

function dishSnapshot(
  type: VendorUpdateEntryInput["type"],
  item: MenuItem
): VendorUpdateEntryInput {
  return {
    type,
    subjectId: item.id,
    name: item.name,
    ...(publicDishImage(item) ? { imageUrl: publicDishImage(item) } : {}),
    currentPriceRwf: item.priceRwf,
  };
}

export function buildNewDishUpdateEntry(
  item: MenuItem
): VendorUpdateEntryInput {
  return dishSnapshot("NEW_DISH", item);
}

export function buildRestoredDishUpdateEntry(
  item: MenuItem
): VendorUpdateEntryInput {
  return dishSnapshot("DISH_RESTORED", item);
}

export function buildMenuUpdateEntry(
  before: MenuItem,
  after: MenuItem
): VendorUpdateEntryInput | null {
  if (before.priceRwf !== after.priceRwf) {
    return {
      type: "PRICE_CHANGE",
      subjectId: after.id,
      name: after.name,
      ...(publicDishImage(after) ? { imageUrl: publicDishImage(after) } : {}),
      oldPriceRwf: before.priceRwf,
      currentPriceRwf: after.priceRwf,
    };
  }

  return buildMenuImageUpdateEntry(before, after);
}

function imageSignature(item: MenuItem): string {
  if (item.images?.length) {
    return [...item.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => `${image.url}:${image.isPrimary ? "primary" : "secondary"}`)
      .join("|");
  }
  return normalized(item.imageUrl);
}

export function buildMenuImageUpdateEntry(
  before: MenuItem,
  after: MenuItem
): VendorUpdateEntryInput | null {
  return imageSignature(before) === imageSignature(after)
    ? null
    : dishSnapshot("DISH_IMAGE", after);
}

const PUBLIC_PROFILE_FIELDS = [
  "name",
  "tagline",
  "location",
  "deliveryTime",
  "businessCategory",
  "logoUrl",
  "coverImageUrl",
  "description",
] as const;

export function buildProfileUpdateEntry(
  before: Vendor,
  after: Vendor
): VendorUpdateEntryInput | null {
  const changed = PUBLIC_PROFILE_FIELDS.filter(
    (field) => normalized(before[field]) !== normalized(after[field])
  );
  if (changed.length === 0) return null;

  const labels: Record<(typeof PUBLIC_PROFILE_FIELDS)[number], string> = {
    name: "business name",
    tagline: "tagline",
    location: "location",
    deliveryTime: "delivery time",
    businessCategory: "business category",
    logoUrl: "logo",
    coverImageUrl: "cover image",
    description: "business description",
  };
  return {
    type: "PROFILE_CHANGE",
    subjectId: after.id,
    name: after.name,
    ...(after.logoUrl ? { imageUrl: after.logoUrl } : {}),
    summary: `Updated ${changed.map((field) => labels[field]).join(", ")}`,
  };
}
