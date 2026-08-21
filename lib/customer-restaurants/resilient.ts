import type {
  SavedRestaurantRepository,
} from "@/lib/customer-restaurants/types";

interface ResilientRepositoryOptions {
  timeoutMs?: number;
}

function rejectAfter(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    globalThis.setTimeout(
      () => reject(new Error("Customer storage did not respond")),
      timeoutMs
    );
  });
}

export function createResilientSavedRestaurantRepository(
  primary: SavedRestaurantRepository,
  fallback: SavedRestaurantRepository,
  { timeoutMs = 1500 }: ResilientRepositoryOptions = {}
): SavedRestaurantRepository {
  let active = primary;

  async function execute<T>(
    operation: (repository: SavedRestaurantRepository) => Promise<T>
  ): Promise<T> {
    try {
      return await Promise.race([operation(active), rejectAfter(timeoutMs)]);
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
