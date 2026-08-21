import type {
  SavedRestaurant,
  SavedRestaurantRepository,
} from "@/lib/customer-restaurants/types";

export type CustomerRestaurantEngagement =
  | "explicit-save"
  | "cart-add"
  | "checkout-start"
  | "order-place";

interface CustomerEngagementControllerOptions {
  repository: SavedRestaurantRepository;
  restaurant: Omit<SavedRestaurant, "lastInteractedAt" | "isAvailable">;
  now?: () => Date;
  onSaved?: (restaurant: SavedRestaurant) => void;
}

export function createCustomerEngagementController({
  repository,
  restaurant,
  now = () => new Date(),
  onSaved,
}: CustomerEngagementControllerOptions) {
  let cartAdditionRecorded = false;

  return {
    async record(reason: CustomerRestaurantEngagement) {
      if (reason === "cart-add") {
        if (cartAdditionRecorded) return null;
        cartAdditionRecorded = true;
      }
      const saved = await repository.save({
        ...restaurant,
        isAvailable: true,
        lastInteractedAt: now().toISOString(),
      });
      onSaved?.(saved);
      return saved;
    },
  };
}
