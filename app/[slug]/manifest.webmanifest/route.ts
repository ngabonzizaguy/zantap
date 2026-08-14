import { getStore } from "@/lib/store";
import { buildStorefrontManifest } from "@/lib/pwa/storefront-manifest";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const vendor = await getStore().getVendorBySlug(slug);

  if (!vendor || !vendor.isActive) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(buildStorefrontManifest(vendor), {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Type": "application/manifest+json",
    },
  });
}
