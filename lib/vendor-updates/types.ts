export const VENDOR_UPDATE_BATCH_WINDOW_MS = 20 * 60 * 1_000;
export const VENDOR_UPDATE_TTL_MS = 3 * 24 * 60 * 60 * 1_000;

export type VendorUpdateType =
  | "NEW_DISH"
  | "DISH_IMAGE"
  | "PRICE_CHANGE"
  | "DISH_RESTORED"
  | "PROFILE_CHANGE";

export interface VendorUpdateEntryInput {
  type: VendorUpdateType;
  subjectId: string;
  name: string;
  imageUrl?: string;
  oldPriceRwf?: number;
  currentPriceRwf?: number;
  summary?: string;
}

export interface VendorUpdateEntry extends VendorUpdateEntryInput {
  id: string;
  batchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorUpdateBatch {
  id: string;
  vendorId: string;
  revision: number;
  publishedAt: Date;
  expiresAt: Date;
  openCount: number;
  menuVisitCount: number;
  entries: VendorUpdateEntry[];
}

export interface VendorUpdateSettings {
  enabled: boolean;
}

export interface VendorUpdateOverview {
  settings: VendorUpdateSettings;
  activeBatch: VendorUpdateBatch | null;
  totals: {
    batches: number;
    revisions: number;
    opens: number;
    menuVisits: number;
  };
}

export interface RecordVendorUpdateInput {
  entry: VendorUpdateEntryInput;
  announce?: boolean;
  at?: Date;
}

export interface VendorSaveOptions {
  announce?: boolean;
}

export type VendorUpdateCounter = "open" | "menuVisit";

export interface PublicVendorUpdateEntry extends VendorUpdateEntry {
  isCurrentlyAvailable: boolean;
}

export interface PublicVendorUpdateBatch
  extends Omit<VendorUpdateBatch, "entries" | "openCount" | "menuVisitCount"> {
  entries: PublicVendorUpdateEntry[];
}

export interface PublicVendorUpdateFeedItem {
  vendorId: string;
  slug: string;
  name: string;
  logoUrl?: string;
  isAvailable: boolean;
  batches: PublicVendorUpdateBatch[];
}
