import type { PublicRestaurant } from "@/lib/customer-restaurants/types";

export const MAX_PUBLIC_RESTAURANT_IDS = 50;
const MAX_VENDOR_ID_LENGTH = 200;

export interface PublicRestaurantResult {
  vendorId: string;
  restaurant: PublicRestaurant | null;
}

export function parsePublicRestaurantIds(value: string | null): string[] {
  if (!value) return [];
  const unique = new Set<string>();
  for (const rawId of value.split(",")) {
    const vendorId = rawId.trim();
    if (!vendorId || vendorId.length > MAX_VENDOR_ID_LENGTH) continue;
    unique.add(vendorId);
    if (unique.size === MAX_PUBLIC_RESTAURANT_IDS) break;
  }
  return [...unique];
}

export async function resolvePublicRestaurantResults(
  vendorIds: string[],
  resolve: (vendorIds: string[]) => Promise<PublicRestaurant[]>
): Promise<PublicRestaurantResult[]> {
  const restaurants = await resolve(vendorIds);
  const byId = new Map(
    restaurants.map((restaurant) => [restaurant.vendorId, restaurant])
  );
  return vendorIds.map((vendorId) => ({
    vendorId,
    restaurant: byId.get(vendorId) ?? null,
  }));
}
