import type { MenuItem, MenuItemSizeOption } from "@/lib/types";

export const MIN_MENU_ITEM_SIZE_OPTIONS = 2;
export const MAX_MENU_ITEM_SIZE_OPTIONS = 8;
export const MENU_ITEM_SIZE_LABEL_MAX = 30;
export const MENU_ITEM_SIZE_ID_MAX = 40;

const SIZE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function createDefaultSizeOptions(
  priceRwf: number
): MenuItemSizeOption[] {
  return ["Small", "Medium", "Large"].map((label) => ({
    id: label.toLowerCase(),
    label,
    priceRwf,
    isAvailable: true,
  }));
}

export function createCustomSizeOption(
  existing: readonly MenuItemSizeOption[],
  priceRwf: number
): MenuItemSizeOption {
  const used = new Set(existing.map((option) => option.id));
  let suffix = existing.length + 1;
  let id = `custom-${suffix}`;
  while (used.has(id)) {
    suffix += 1;
    id = `custom-${suffix}`;
  }
  return {
    id,
    label: `Size ${suffix}`,
    priceRwf,
    isAvailable: true,
  };
}

export function isValidSizeOptionId(id: string): boolean {
  return (
    id.length > 0 &&
    id.length <= MENU_ITEM_SIZE_ID_MAX &&
    SIZE_ID_PATTERN.test(id)
  );
}

export function normalizeMenuItemSizeOptions(
  options: readonly MenuItemSizeOption[]
): MenuItemSizeOption[] {
  return options.map((option) => ({
    id: option.id,
    label: option.label.trim(),
    priceRwf: option.priceRwf,
    isAvailable: option.isAvailable,
  }));
}

export function parseMenuItemSizeOptions(
  value: unknown
): MenuItemSizeOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const parsed: MenuItemSizeOption[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return undefined;
    const option = entry as Record<string, unknown>;
    if (
      typeof option.id !== "string" ||
      typeof option.label !== "string" ||
      typeof option.priceRwf !== "number" ||
      typeof option.isAvailable !== "boolean"
    ) {
      return undefined;
    }
    parsed.push({
      id: option.id,
      label: option.label,
      priceRwf: option.priceRwf,
      isAvailable: option.isAvailable,
    });
  }
  return parsed.length > 0 ? parsed : undefined;
}

export function getSizeOptionsStartingPrice(
  options: readonly MenuItemSizeOption[]
): number {
  const available = options.filter((option) => option.isAvailable);
  if (available.length === 0) {
    throw new Error("At least one size must be available");
  }
  return Math.min(...available.map((option) => option.priceRwf));
}

export function getMenuItemSizeOptions(
  item: MenuItem,
  options: { availableOnly?: boolean } = {}
): MenuItemSizeOption[] {
  const sizes = item.sizeOptions ?? [];
  return options.availableOnly
    ? sizes.filter((size) => size.isAvailable)
    : sizes;
}

export function getMenuItemSizeOption(
  item: MenuItem,
  sizeOptionId: string
): MenuItemSizeOption | undefined {
  return item.sizeOptions?.find((option) => option.id === sizeOptionId);
}

export function getMenuItemPrice(
  item: MenuItem,
  sizeOptionId?: string
): number {
  if (!item.sizeOptions?.length) {
    if (sizeOptionId) throw new Error("This menu item does not offer sizes");
    return item.priceRwf;
  }
  if (!sizeOptionId) throw new Error("Choose a size for this menu item");
  const option = getMenuItemSizeOption(item, sizeOptionId);
  if (!option) throw new Error("This size no longer exists");
  if (!option.isAvailable) throw new Error("This size is unavailable");
  return option.priceRwf;
}

export function getMenuItemStartingPrice(item: MenuItem): number {
  const enabled = getMenuItemSizeOptions(item, { availableOnly: true });
  if (enabled.length === 0) return item.priceRwf;
  return getSizeOptionsStartingPrice(enabled);
}

export function buildCartLineKey(
  menuItemId: string,
  sizeOptionId?: string
): string {
  return sizeOptionId ? `${menuItemId}::${sizeOptionId}` : menuItemId;
}

export function parseCartLineKey(
  lineKey: string
): { menuItemId: string; sizeOptionId?: string } {
  lineKey = lineKey.split("##", 1)[0];
  const separator = lineKey.lastIndexOf("::");
  if (separator < 0) return { menuItemId: lineKey };
  const sizeOptionId = lineKey.slice(separator + 2);
  if (!isValidSizeOptionId(sizeOptionId)) return { menuItemId: lineKey };
  return { menuItemId: lineKey.slice(0, separator), sizeOptionId };
}
