import { notFound } from "next/navigation";
import {
  getAvailableMenu,
  getCategories,
  getVendorBySlug,
} from "@/lib/data";
import { Storefront } from "@/components/customer/Storefront";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerStorefrontPage({ params }: PageProps) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const [menu, categories] = await Promise.all([
    getAvailableMenu(slug),
    getCategories(slug),
  ]);

  return (
    <Storefront vendor={vendor} menu={menu} categories={categories} />
  );
}
