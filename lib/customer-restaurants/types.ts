export const CUSTOMER_RESTAURANT_DB_VERSION = 1;

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
}

export function sortSavedRestaurants(
  restaurants: SavedRestaurant[]
): SavedRestaurant[] {
  return [...restaurants].sort((left, right) =>
    right.lastInteractedAt.localeCompare(left.lastInteractedAt)
  );
}
