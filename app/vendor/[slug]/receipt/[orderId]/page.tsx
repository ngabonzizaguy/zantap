import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import type { Order, Payment, Vendor } from "@/lib/types";
import {
  formatKigaliDateTime,
  formatPhoneDisplay,
  formatRwf,
  orderDisplayId,
} from "@/lib/format";
import { PrintReceiptButton } from "@/components/vendor/PrintReceiptButton";
import { ReceiptBackButton } from "@/components/vendor/ReceiptBackButton";
import { formatOrderItemAddOns } from "@/lib/menu/add-ons";

interface PageProps {
  params: Promise<{ slug: string; orderId: string }>;
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
    <div className="kds-dark kds-surface receipt-root min-h-screen w-full bg-canvas px-5 py-8 font-body text-ink print:bg-white print:px-0 print:py-0 print:text-ink">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .receipt-root,
          .receipt-root .receipt-card,
          .receipt-root .bg-canvas-soft {
            background: white !important;
            color: #292524 !important;
          }
          .receipt-root .text-ink { color: #292524 !important; }
          .receipt-root .text-muted { color: #78716c !important; }
          .receipt-root .text-muted-soft { color: #a8a29e !important; }
          .receipt-root .border-hairline,
          .receipt-root .border-hairline-soft,
          .receipt-root .divide-hairline-soft > * + * {
            border-color: #e7e5e4 !important;
          }
          .receipt-card {
            box-shadow: none !important;
            border: 1px solid #e7e5e4 !important;
          }
        }
      `}</style>

      <div className="kds-surface receipt-card mx-auto max-w-lg rounded-brand-lg border border-hairline bg-surface-card p-8 shadow-brand-soft print:max-w-none print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <div className="no-print mb-6">
          <ReceiptBackButton vendorSlug={slug} />
        </div>

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
            {formatKigaliDateTime(order.createdAt, "long")}
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
                      {line.sizeLabel ? ` · ${line.sizeLabel}` : ""}
                    </p>
                    <p className="font-body text-body-sm text-muted">
                      {formatRwf(line.unitPriceRwf)} each
                    </p>
                    {formatOrderItemAddOns(line.addOnSelections) ? (
                      <p className="font-body text-body-sm text-muted">+ {formatOrderItemAddOns(line.addOnSelections)}</p>
                    ) : null}
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
