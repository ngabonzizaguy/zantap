import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/base-url";

/**
 * Static marketing surface only. Vendor storefronts stay crawlable (see
 * robots.ts) but are not enumerated here — vendors share their own links;
 * a store-backed storefront index can be added when SEO for vendors becomes
 * a goal.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl() || "https://zantap.app";
  return [
    {
      url: `${base}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/onboard`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
