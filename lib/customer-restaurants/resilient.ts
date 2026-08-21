import type {
  SavedRestaurantRepository,
} from "@/lib/customer-restaurants/types";

export function createResilientSavedRestaurantRepository(
  primary: SavedRestaurantRepository,
  fallback: SavedRestaurantRepository
): SavedRestaurantRepository {
  let active = primary;

  async function execute<T>(
    operation: (repository: SavedRestaurantRepository) => Promise<T>
  ): Promise<T> {
    try {
      return await operation(active);
    } catch {
      active = fallback;
      return operation(fallback);
    }
  }

  return {
    list: () => execute((repository) => repository.list()),
    save: (restaurant) =>
      execute((repository) => repository.save(restaurant)),
    remove: (vendorId) =>
      execute((repository) => repository.remove(vendorId)),
  };
}
