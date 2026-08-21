import {
  sortSavedRestaurants,
  type SavedRestaurant,
  type SavedRestaurantRepository,
} from "@/lib/customer-restaurants/types";

export function createInMemorySavedRestaurantRepository(
  initial: SavedRestaurant[] = []
): SavedRestaurantRepository {
  const restaurants = new Map(
    initial.map((restaurant) => [restaurant.vendorId, { ...restaurant }])
  );

  return {
    async list() {
      return sortSavedRestaurants(
        [...restaurants.values()].map((restaurant) => ({ ...restaurant }))
      );
    },
    async save(restaurant) {
      const saved = { ...restaurant };
      restaurants.set(saved.vendorId, saved);
      return { ...saved };
    },
    async remove(vendorId) {
      restaurants.delete(vendorId);
    },
  };
}
