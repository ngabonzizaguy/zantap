import type { Metadata } from "next";
import { getStore } from "@/lib/store";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: Omit<StorefrontLayoutProps, "children">): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getStore().getVendorBySlug(slug);

  // Missing/suspended vendors keep the root manifest; the page 404s or shows
  // the suspended surface anyway.
  if (!vendor || !vendor.isActive) return {};

  return {
    applicationName: vendor.name,
    manifest: `/${encodeURIComponent(slug)}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: vendor.name,
    },
  };
}

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return children;
}
