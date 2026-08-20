import {
  INVENTORY_CATEGORIES,
  INVENTORY_STANDARD_UNITS,
  type CreateInventoryItemInput,
  type RecordInventoryAdjustmentInput,
  type UpdateInventoryItemInput,
} from "@/lib/inventory/types";

const MAX_QUANTITY = 999_999_999;

function hasAtMostThreeDecimals(value: number): boolean {
  return Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8;
}

export function resolveInventoryUnit(
  unit: CreateInventoryItemInput["unit"],
  customUnit?: string
): string {
  if (unit === "custom") {
    const resolved = customUnit?.trim();
    if (!resolved) throw new Error("Enter a custom unit");
    if (resolved.length > 30) throw new Error("Custom unit is too long");
    return resolved;
  }
  if (!INVENTORY_STANDARD_UNITS.includes(unit)) {
    throw new Error("Choose a supported unit");
  }
  return unit;
}

export function validateCreateInventoryItemInput(
  input: CreateInventoryItemInput
): void {
  const name = input.name.trim();
  if (!name) throw new Error("Item name is required");
  if (name.length > 120) throw new Error("Item name is too long");
  if (
    !Number.isFinite(input.quantity) ||
    input.quantity < 0 ||
    input.quantity > MAX_QUANTITY ||
    !hasAtMostThreeDecimals(input.quantity)
  ) {
    throw new Error("Quantity must be zero or more with up to 3 decimal places");
  }
  if (
    !Number.isFinite(input.lowStockThreshold) ||
    input.lowStockThreshold < 0 ||
    input.lowStockThreshold > MAX_QUANTITY ||
    !hasAtMostThreeDecimals(input.lowStockThreshold)
  ) {
    throw new Error("Low-stock threshold must be zero or more");
  }
  if (!INVENTORY_CATEGORIES.includes(input.category)) {
    throw new Error("Choose a supported category");
  }
  if (
    input.unitCostRwf !== undefined &&
    (!Number.isInteger(input.unitCostRwf) || input.unitCostRwf < 0)
  ) {
    throw new Error("Unit cost must be zero or more");
  }
  resolveInventoryUnit(input.unit, input.customUnit);
}

export function inventoryStatus(
  quantity: number,
  lowStockThreshold: number
): "OUT" | "LOW" | "OK" {
  if (quantity === 0) return "OUT";
  if (quantity <= lowStockThreshold) return "LOW";
  return "OK";
}

export function validateInventoryAdjustmentInput(
  input: RecordInventoryAdjustmentInput
): void {
  if (
    !Number.isFinite(input.quantity) ||
    input.quantity < 0 ||
    input.quantity > MAX_QUANTITY ||
    !hasAtMostThreeDecimals(input.quantity)
  ) {
    throw new Error("Adjustment quantity must be zero or more with up to 3 decimal places");
  }
  if (input.type !== "CORRECTION" && input.quantity === 0) {
    throw new Error("Adjustment quantity must be greater than zero");
  }
  if (input.note && input.note.trim().length > 300) {
    throw new Error("Adjustment note is too long");
  }
}

export function validateUpdateInventoryItemInput(
  input: UpdateInventoryItemInput
): void {
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error("Item name is required");
    if (input.name.trim().length > 120) throw new Error("Item name is too long");
  }
  if (
    input.lowStockThreshold !== undefined &&
    (!Number.isFinite(input.lowStockThreshold) ||
      input.lowStockThreshold < 0 ||
      input.lowStockThreshold > MAX_QUANTITY ||
      !hasAtMostThreeDecimals(input.lowStockThreshold))
  ) {
    throw new Error("Low-stock threshold must be zero or more");
  }
  if (
    input.category !== undefined &&
    !INVENTORY_CATEGORIES.includes(input.category)
  ) {
    throw new Error("Choose a supported category");
  }
  if (
    input.unitCostRwf !== undefined &&
    input.unitCostRwf !== null &&
    (!Number.isInteger(input.unitCostRwf) || input.unitCostRwf < 0)
  ) {
    throw new Error("Unit cost must be zero or more");
  }
  if (input.unit !== undefined) resolveInventoryUnit(input.unit, input.customUnit);
}
