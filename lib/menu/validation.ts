import type { CreateMenuItemInput, UpdateMenuItemInput } from "@/lib/types";

export function validateCreateMenuItemInput(
  input: CreateMenuItemInput
): string | null {
  if (!input.name?.trim()) {
    return "Name is required";
  }
  if (!Number.isInteger(input.priceRwf) || input.priceRwf <= 0) {
    return "Price must be a positive whole number (RWF)";
  }
  return null;
}

export function validateUpdateMenuItemInput(
  input: UpdateMenuItemInput
): string | null {
  const hasField =
    input.name !== undefined ||
    input.priceRwf !== undefined ||
    input.description !== undefined ||
    input.category !== undefined;
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
  return null;
}
