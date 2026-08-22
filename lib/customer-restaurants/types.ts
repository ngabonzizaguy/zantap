export const CUSTOMER_RESTAURANT_DB_VERSION = 2;

export interface CustomerUpdateState {
  batchId: string;
  vendorId?: string;
  viewedRevision: number;
  openSentRevision: number;
  menuVisitSentRevision: number;
}

export type CustomerUpdateAnalyticsKind = "open" | "menuVisit";

export interface SavedRestaurant {
  vendorId: string;
  slug: string;
  name: string;
  lastInteractedAt: string;
  logoUrl?: string;
  location?: string;
  tagline?: string;
  isAvailable?: boolean;
}

export interface PublicRestaurant {
  vendorId: string;
  slug: string;
  name: string;
  isAvailable: boolean;
  logoUrl?: string;
  location?: string;
  tagline?: string;
}

export interface SavedRestaurantRepository {
  list(): Promise<SavedRestaurant[]>;
  save(restaurant: SavedRestaurant): Promise<SavedRestaurant>;
  remove(vendorId: string): Promise<void>;
  getUpdateState(batchId: string): Promise<Omit<CustomerUpdateState, "batchId" | "vendorId">>;
  markUpdateViewed(batchId: string, vendorId: string, revision: number): Promise<void>;
  markUpdateAnalyticsSent(
    batchId: string,
    vendorId: string,
    kind: CustomerUpdateAnalyticsKind,
    revision: number
  ): Promise<void>;
}

export function sortSavedRestaurants(
  restaurants: SavedRestaurant[]
): SavedRestaurant[] {
  return [...restaurants].sort((left, right) =>
    right.lastInteractedAt.localeCompare(left.lastInteractedAt)
  );
}
