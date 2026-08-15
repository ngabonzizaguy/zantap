// Per-storefront PWA manifest so customers install "<Restaurant>" launching
// into that storefront, not "ZanTap" launching into the marketing root.
// Icons stay on the approved-Z set: vendor logos aren't guaranteed square,
// opaque, or maskable-safe, so they can't be launcher icons yet.

interface StorefrontManifestVendor {
  name: string;
  slug: string;
  description?: string;
}

const SHORT_NAME_MAX = 12;

export function buildStorefrontShortName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= SHORT_NAME_MAX) return trimmed;
  const cut = trimmed.slice(0, SHORT_NAME_MAX);
  if (trimmed.charAt(SHORT_NAME_MAX) === " ") return cut;
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace >= 4 ? cut.slice(0, lastSpace) : cut).trim();
}

export function buildStorefrontManifest(vendor: StorefrontManifestVendor) {
  const encodedSlug = encodeURIComponent(vendor.slug);

  return {
    id: `/${encodedSlug}`,
    name: vendor.name,
    short_name: buildStorefrontShortName(vendor.name),
    description:
      vendor.description?.trim() ||
      `Order from ${vendor.name} — powered by ZanTap.`,
    start_url: `/${encodedSlug}`,
    // Narrow scope so the storefront is its own installable app. With the
    // previous scope "/", any installed ZanTap app (e.g. the marketing root)
    // covered every storefront page and Chrome suppressed their install
    // prompts entirely.
    scope: `/${encodedSlug}`,
    display: "standalone" as const,
    background_color: "#f5f5f5",
    theme_color: "#f5f5f5",
    orientation: "any" as const,
    categories: ["food", "shopping"],
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
  };
}
