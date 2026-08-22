import { parsePublicRestaurantIds } from "@/lib/customer-restaurants/public-resolver";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const vendorIds = parsePublicRestaurantIds(
    new URL(request.url).searchParams.get("ids")
  );
  const updates = await getStore().listPublicVendorUpdates(vendorIds);

  return Response.json(
    { updates },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
