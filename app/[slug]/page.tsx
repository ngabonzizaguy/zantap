import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { getMomoMode } from "@/lib/momo/mode";
import { InstallHintBanner } from "@/components/pwa/InstallHintBanner";
import { Storefront } from "@/components/customer/Storefront";
import { SuspendedStorefront } from "@/components/customer/SuspendedStorefront";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function CustomerStorefrontPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { from } = await searchParams;
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
        fromKds={from === "kds"}
        momoMode={getMomoMode()}
      />
    </>
  );
}
