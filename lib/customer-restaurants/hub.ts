import type { PublicRestaurantResult } from "@/lib/customer-restaurants/public-resolver";
import {
  sortSavedRestaurants,
  type SavedRestaurant,
  type SavedRestaurantRepository,
} from "@/lib/customer-restaurants/types";

export function reconcileSavedRestaurants(
  local: SavedRestaurant[],
  resolved: PublicRestaurantResult[]
): SavedRestaurant[] {
  const byId = new Map(resolved.map((result) => [result.vendorId, result]));
  return sortSavedRestaurants(
    local.map((saved) => {
      const result = byId.get(saved.vendorId);
      if (!result?.restaurant) return { ...saved, isAvailable: false };
      return {
        ...saved,
        ...result.restaurant,
        lastInteractedAt: saved.lastInteractedAt,
      };
    })
  );
}

export function filterSavedRestaurants(
  restaurants: SavedRestaurant[],
  query: string
): SavedRestaurant[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return restaurants;
  return restaurants.filter((restaurant) =>
    [restaurant.name, restaurant.location, restaurant.tagline]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(normalized))
  );
}

export async function removeSavedRestaurant(
  repository: SavedRestaurantRepository,
  vendorId: string,
  confirm: () => boolean
): Promise<boolean> {
  if (!confirm()) return false;
  await repository.remove(vendorId);
  return true;
}
