import { notFound } from "next/navigation";
import { getOrder, getVendorBySlug } from "@/lib/data";
import { buildDeliverySlip } from "@/lib/whatsapp";
import { formatRwf, orderDisplayId } from "@/lib/format";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function DriverSlipPage({ params }: PageProps) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  const vendor = await getVendorBySlug("inka-steakhouse");
  const slipText = buildDeliverySlip(order, vendor?.name ?? "Vendor");

  return (
    <div className="min-h-screen bg-zk-bg px-5 py-8 text-zk-text">
      <div className="mx-auto max-w-kds">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wide text-zk-muted">
            ZanTap Delivery Slip
          </div>
          <div className="mt-1 text-2xl font-extrabold">
            {orderDisplayId(order.id)}
          </div>
          <div className="mt-1 text-sm font-semibold text-zk-sub">
            {formatRwf(order.totalAmount)} · {order.status}
          </div>
        </div>

        <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-[13px] border-[1.5px] border-zk-borderDark bg-[#100b07] p-4 font-mono text-[13px] font-medium leading-relaxed text-[#d8c9bd]">
          {slipText}
        </pre>

        <p className="mt-4 text-sm font-medium text-zk-muted">
          Hand this slip to your moto driver. Full dispatch workflow lives in the
          vendor KDS dashboard.
        </p>
      </div>
    </div>
  );
}
