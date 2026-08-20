export const INVENTORY_CATEGORIES = [
  "Ingredients",
  "Drinks",
  "Packaging",
  "Cleaning",
  "Other",
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const INVENTORY_STANDARD_UNITS = [
  "pieces",
  "packs",
  "boxes",
  "bags",
  "bottles",
  "kg",
  "litres",
] as const;

export type InventoryStandardUnit = (typeof INVENTORY_STANDARD_UNITS)[number];
export type InventoryUnitInput = InventoryStandardUnit | "custom";
export type InventoryStatus = "OUT" | "LOW" | "OK";
export type InventoryAdjustmentType =
  | "RECEIVED"
  | "USED"
  | "WASTED"
  | "CORRECTION";

export interface InventoryItem {
  id: string;
  vendorId: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  category: InventoryCategory;
  unitCostRwf?: number;
  note?: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInventoryItemInput {
  name: string;
  quantity: number;
  unit: InventoryUnitInput;
  customUnit?: string;
  lowStockThreshold: number;
  category: InventoryCategory;
  unitCostRwf?: number;
  note?: string;
}

export interface RecordInventoryAdjustmentInput {
  type: InventoryAdjustmentType;
  /** Positive amount for Received/Used/Wasted; absolute stock count for Correction. */
  quantity: number;
  note?: string;
}

export interface UpdateInventoryItemInput {
  name?: string;
  unit?: InventoryUnitInput;
  customUnit?: string;
  lowStockThreshold?: number;
  category?: InventoryCategory;
  unitCostRwf?: number | null;
  note?: string | null;
}

export interface InventoryAdjustment {
  id: string;
  inventoryItemId: string;
  type: InventoryAdjustmentType;
  quantity: number;
  oldQuantity: number;
  newQuantity: number;
  note?: string;
  createdAt: Date;
}

export interface InventoryItemDetail {
  item: InventoryItem;
  history: InventoryAdjustment[];
}

export interface InventoryListFilters {
  search?: string;
  category?: InventoryCategory | "ALL";
  archived?: boolean;
}

export interface InventoryCounts {
  active: number;
  low: number;
  out: number;
}

export interface PaginatedInventory {
  items: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: InventoryCounts;
}
