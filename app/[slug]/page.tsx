import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { Storefront } from "@/components/customer/Storefront";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerStorefrontPage({ params }: PageProps) {
  const { slug } = await params;
  const store = getStore();
  const vendor = await store.getVendorBySlug(slug);
  if (!vendor) notFound();

  const [menu, categories] = await Promise.all([
    store.getAvailableMenu(slug),
    store.getCategories(slug),
  ]);

  return (
    <Storefront vendor={vendor} menu={menu} categories={categories} />
  );
}
