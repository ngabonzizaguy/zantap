import type { Metadata, Viewport } from "next";

interface VendorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
};

export async function generateMetadata({
  params,
}: Omit<VendorLayoutProps, "children">): Promise<Metadata> {
  const { slug } = await params;
  return {
    applicationName: "ZanTap Kitchen",
    manifest: `/vendor/${encodeURIComponent(slug)}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "ZanTap Kitchen",
    },
  };
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  return children;
}
