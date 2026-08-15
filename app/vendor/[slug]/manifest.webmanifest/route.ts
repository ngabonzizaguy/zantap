interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const encodedSlug = encodeURIComponent(slug);

  return Response.json(
    {
      id: `/vendor/${encodedSlug}`,
      name: "ZanTap Kitchen",
      short_name: "ZanTap Kitchen",
      description: "Live kitchen orders and dispatch for your ZanTap storefront.",
      start_url: `/vendor/${encodedSlug}`,
      // Narrow scope: the KDS is its own installable app, independent from
      // the marketing root and the storefront apps (see storefront-manifest).
      scope: `/vendor/${encodedSlug}`,
      display: "standalone",
      background_color: "#0b0b0d",
      theme_color: "#0b0b0d",
      orientation: "any",
      categories: ["business", "food", "productivity"],
      icons: [
        {
          src: "/pwa/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/pwa/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/pwa/maskable-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/pwa/maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Type": "application/manifest+json",
      },
    }
  );
}
