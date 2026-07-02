import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { Storefront } from "@/components/customer/Storefront";

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

  const [menu, categories] = await Promise.all([
    store.getAvailableMenu(slug),
    store.getCategories(slug),
  ]);

  return (
    <Storefront
      vendor={vendor}
      menu={menu}
      categories={categories}
      fromKds={from === "kds"}
    />
  );
}
