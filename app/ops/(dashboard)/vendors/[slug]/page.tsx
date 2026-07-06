import { notFound } from "next/navigation";
import {
  getVendorDetail,
  listAuditActions,
  listVendorMenu,
} from "@/lib/operator-client";
import { VendorDetailPanel } from "@/components/ops/VendorDetailPanel";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function OpsVendorDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [detail, menu, audit] = await Promise.all([
    getVendorDetail(slug),
    listVendorMenu(slug),
    listAuditActions(slug),
  ]);

  if (!detail) notFound();

  return (
    <VendorDetailPanel detail={detail} menu={menu} audit={audit} />
  );
}
