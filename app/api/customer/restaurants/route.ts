import { getStore } from "@/lib/store";
import {
  parsePublicRestaurantIds,
  resolvePublicRestaurantResults,
} from "@/lib/customer-restaurants/public-resolver";

export async function GET(request: Request) {
  const vendorIds = parsePublicRestaurantIds(new URL(request.url).searchParams.get("ids"));
  const results = await resolvePublicRestaurantResults(
    vendorIds,
    getStore().resolvePublicRestaurants
  );

  return Response.json(
    { restaurants: results },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
