import type { CreateMenuItemInput, UpdateMenuItemInput } from "@/lib/types";
import {
  isValidSizeOptionId,
  MAX_MENU_ITEM_SIZE_OPTIONS,
  MENU_ITEM_SIZE_LABEL_MAX,
  MIN_MENU_ITEM_SIZE_OPTIONS,
} from "@/lib/menu/sizes";
import { validateMenuItemAddOnGroups } from "@/lib/menu/add-ons";

function validateSizeOptions(
  sizeOptions: CreateMenuItemInput["sizeOptions"] | null | undefined
): string | null {
  if (sizeOptions === undefined || sizeOptions === null) return null;
  if (
    sizeOptions.length < MIN_MENU_ITEM_SIZE_OPTIONS ||
    sizeOptions.length > MAX_MENU_ITEM_SIZE_OPTIONS
  ) {
    return `Size pricing requires ${MIN_MENU_ITEM_SIZE_OPTIONS}–${MAX_MENU_ITEM_SIZE_OPTIONS} options`;
  }
  const ids = new Set<string>();
  const labels = new Set<string>();
  for (const option of sizeOptions) {
    if (!isValidSizeOptionId(option.id) || ids.has(option.id)) {
      return "Each size needs a unique id";
    }
    ids.add(option.id);
    const label = option.label.trim();
    const normalizedLabel = label.toLocaleLowerCase();
    if (!label || label.length > MENU_ITEM_SIZE_LABEL_MAX) {
      return `Size labels must be 1–${MENU_ITEM_SIZE_LABEL_MAX} characters`;
    }
    if (labels.has(normalizedLabel)) return "Size labels must be unique";
    labels.add(normalizedLabel);
    if (!Number.isInteger(option.priceRwf) || option.priceRwf <= 0) {
      return "Every size needs a positive whole-number price (RWF)";
    }
  }
  if (!sizeOptions.some((option) => option.isAvailable)) {
    return "At least one size must be available";
  }
  return null;
}

export function validateCreateMenuItemInput(
  input: CreateMenuItemInput
): string | null {
  if (!input.name?.trim()) {
    return "Name is required";
  }
  if (!Number.isInteger(input.priceRwf) || input.priceRwf <= 0) {
    return "Price must be a positive whole number (RWF)";
  }
  const sizeError = validateSizeOptions(input.sizeOptions);
  if (sizeError) return sizeError;
  const addOnError = validateMenuItemAddOnGroups(input.addOnGroups);
  if (addOnError) return addOnError;
  return null;
}

export function validateUpdateMenuItemInput(
  input: UpdateMenuItemInput
): string | null {
  const hasField =
    input.name !== undefined ||
    input.priceRwf !== undefined ||
    input.sizeOptions !== undefined ||
    input.addOnGroups !== undefined ||
    input.description !== undefined ||
    input.category !== undefined ||
    input.stockCount !== undefined ||
    input.lowStockThreshold !== undefined ||
    input.costPriceRwf !== undefined;
  if (!hasField) {
    return "Nothing to update";
  }
  if (input.name !== undefined && !input.name.trim()) {
    return "Name is required";
  }
  if (
    input.priceRwf !== undefined &&
    (!Number.isInteger(input.priceRwf) || input.priceRwf <= 0)
  ) {
    return "Price must be a positive whole number (RWF)";
  }
  const sizeError = validateSizeOptions(input.sizeOptions);
  if (sizeError) return sizeError;
  const addOnError = validateMenuItemAddOnGroups(input.addOnGroups);
  if (addOnError) return addOnError;
  return null;
}
