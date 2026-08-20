import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { getMomoMode } from "@/lib/momo/mode";
import { InstallHintBanner } from "@/components/pwa/InstallHintBanner";
import { Storefront } from "@/components/customer/Storefront";
import { SuspendedStorefront } from "@/components/customer/SuspendedStorefront";
import { parseStorefrontMenuQuery } from "@/lib/menu/storefront-pagination";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CustomerStorefrontPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const store = getStore();
  const vendor = await store.getVendorBySlug(slug);
  if (!vendor) notFound();

  if (!vendor.isActive) {
    return <SuspendedStorefront vendor={vendor} />;
  }

  const [menu, categories] = await Promise.all([
    store.getAvailableMenu(slug),
    store.getCategories(slug),
  ]);

  return (
    <>
      <InstallHintBanner
        variant="light"
        surface="storefront"
        appName={vendor.name}
      />
      <Storefront
        vendor={vendor}
        menu={menu}
        categories={categories}
        initialMenuQuery={parseStorefrontMenuQuery(query, categories)}
        fromKds={query.from === "kds"}
        momoMode={getMomoMode()}
      />
    </>
  );
}
