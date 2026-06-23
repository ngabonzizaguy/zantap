import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import type { Order, Payment, Vendor } from "@/lib/types";
import {
  formatPhoneDisplay,
  formatRwf,
  orderDisplayId,
} from "@/lib/format";
import { ORDER_HISTORY_TIMEZONE } from "@/lib/orders/history-filters";
import { PrintReceiptButton } from "@/components/vendor/PrintReceiptButton";

interface PageProps {
  params: Promise<{ slug: string; orderId: string }>;
}

function formatReceiptDate(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: ORDER_HISTORY_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentLine(payment: Payment | null, order: Order): string | null {
  if (!payment || payment.status !== "SUCCESS") return null;
  const provider =
    payment.provider === "AIRTEL_MONEY" ? "Airtel Money" : "MTN MoMo";
  return `Paid via ${provider} · Ref ${payment.transactionRef} · ${formatRwf(order.totalAmount)}`;
}

export default async function VendorReceiptPage({ params }: PageProps) {
  const { slug, orderId } = await params;
  const store = getStore();

  const [vendor, order] = await Promise.all([
    store.getVendorBySlug(slug),
    store.getOrder(orderId),
  ]);

  if (!vendor || !order || order.vendorId !== vendor.id) {
    notFound();
  }

  const payment = await store.getPaymentForOrder(orderId);
  const paidLine = paymentLine(payment, order);

  return (
    <div className="receipt-root min-h-screen bg-canvas px-5 py-8 font-body text-ink print:bg-white print:px-0 print:py-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .receipt-root { background: white !important; }
          .receipt-card {
            box-shadow: none !important;
            border: 1px solid #e7e5e4 !important;
          }
        }
      `}</style>

      <div className="receipt-card mx-auto max-w-lg rounded-brand-lg border border-hairline bg-surface-card p-8 shadow-brand-soft print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <header className="border-b border-hairline pb-6">
          <p className="font-body text-caption uppercase tracking-widest text-muted">
            ZanTap receipt
          </p>
          <h1 className="mt-2 font-display text-display-md text-ink">
            {vendor.name}
          </h1>
          <p className="mt-3 font-display text-display-sm text-ink">
            {orderDisplayId(order.id)}
          </p>
          <p className="mt-1 font-body text-body-sm text-muted">
            {formatReceiptDate(order.createdAt)}
          </p>
        </header>

        <section className="mt-6">
          <h2 className="font-body text-caption uppercase tracking-widest text-muted-soft">
            Items
          </h2>
          <ul className="mt-3 divide-y divide-hairline-soft">
            {order.orderItems.map((line) => {
              const name = line.menuItem?.name ?? "Item";
              const lineTotal = line.quantity * line.unitPriceRwf;
              return (
                <li
                  key={line.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div>
                    <p className="font-body text-body-md text-ink">
                      {line.quantity}× {name}
                    </p>
                    <p className="font-body text-body-sm text-muted">
                      {formatRwf(line.unitPriceRwf)} each
                    </p>
                  </div>
                  <p className="font-body text-body-md font-medium text-ink">
                    {formatRwf(lineTotal)}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-6 border-t border-hairline pt-4">
          <div className="flex items-center justify-between">
            <span className="font-body text-body-md text-muted">Total</span>
            <span className="font-display text-display-sm text-ink">
              {formatRwf(order.totalAmount)}
            </span>
          </div>
          {paidLine ? (
            <p className="mt-2 font-body text-body-sm text-muted">{paidLine}</p>
          ) : (
            <p className="mt-2 font-body text-body-sm text-muted">
              Order status: {order.status}
            </p>
          )}
        </section>

        <section className="mt-6 rounded-brand-md bg-canvas-soft p-4 print:bg-white print:border print:border-hairline">
          <h2 className="font-body text-caption uppercase tracking-widest text-muted-soft">
            Delivery
          </h2>
          <p className="mt-2 font-body text-body-md font-medium text-ink">
            {order.deliverySector}
          </p>
          <p className="mt-1 font-body text-body-sm text-muted">{order.landmark}</p>
          <p className="mt-3 font-body text-body-sm text-muted">
            Customer · {formatPhoneDisplay(order.customerPhone)}
          </p>
        </section>

        <div className="no-print mt-8 flex justify-center">
          <PrintReceiptButton />
        </div>
      </div>
    </div>
  );
}
