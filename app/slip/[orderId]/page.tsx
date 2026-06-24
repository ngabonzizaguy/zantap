import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { DEMO_VENDOR_SLUG } from "@/lib/store/seed-data";
import { buildDeliverySlip } from "@/lib/whatsapp";
import { formatRwf, orderDisplayId } from "@/lib/format";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function DriverSlipPage({ params }: PageProps) {
  const { orderId } = await params;
  const store = getStore();
  const order = await store.getOrder(orderId);
  if (!order) notFound();

  const vendor = await store.getVendorBySlug(DEMO_VENDOR_SLUG);
  const slipText = buildDeliverySlip(order, vendor?.name ?? "Vendor");

  return (
    <div className="min-h-screen bg-canvas px-5 py-8 font-body text-ink">
      <div className="mx-auto max-w-kds">
        <div className="mb-6">
          <div className="font-body text-caption uppercase tracking-widest text-muted">
            ZanTap Delivery Slip
          </div>
          <div className="mt-2 font-display text-display-md text-ink">
            {orderDisplayId(order.id)}
          </div>
          <div className="mt-1 font-body text-body-sm text-muted">
            {formatRwf(order.totalAmount)} · {order.status}
          </div>
        </div>

        <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-brand-lg border border-hairline bg-canvas-soft p-4 font-mono text-body-sm leading-relaxed text-ink">
          {slipText}
        </pre>

        <p className="mt-4 font-body text-body-sm text-muted">
          Hand this slip to your moto driver. Full dispatch workflow lives in the
          vendor KDS dashboard.
        </p>
      </div>
    </div>
  );
}
