import { createInMemorySavedRestaurantRepository } from "@/lib/customer-restaurants/in-memory";
import { createIndexedDbSavedRestaurantRepository } from "@/lib/customer-restaurants/indexeddb";
import { createResilientSavedRestaurantRepository } from "@/lib/customer-restaurants/resilient";
import type { SavedRestaurantRepository } from "@/lib/customer-restaurants/types";

let browserRepository: SavedRestaurantRepository | undefined;

export function getBrowserSavedRestaurantRepository(): SavedRestaurantRepository {
  if (browserRepository) return browserRepository;

  const fallback = createInMemorySavedRestaurantRepository();
  browserRepository =
    typeof window !== "undefined" && window.indexedDB
      ? createResilientSavedRestaurantRepository(
          createIndexedDbSavedRestaurantRepository({
            indexedDB: window.indexedDB,
          }),
          fallback
        )
      : fallback;
  return browserRepository;
}
