"use client";

import { useEffect, useId, useRef } from "react";
import type { Driver, Order } from "@/lib/types";
import { buildDeliverySlip, buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatPhoneDisplay, orderDisplayId } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface DispatchModalProps {
  open: boolean;
  order: Order | null;
  vendorName: string;
  drivers: Driver[];
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onShareWhatsApp: () => void;
}

function CallBadge() {
  return (
    <span className="flex h-[42px] flex-none items-center gap-1.5 rounded-pill border border-success/40 bg-success/10 px-4 font-body text-body-sm font-medium text-success">
      <Icon name="call" size={17} strokeWidth={2.3} />
      Call
    </span>
  );
}

export function DispatchModal({
  open,
  order,
  vendorName,
  drivers,
  copied,
  onClose,
  onCopy,
  onShareWhatsApp,
}: DispatchModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const slipText = order ? buildDeliverySlip(order, vendorName) : "";

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dispatch dialog"
        className="absolute inset-0 bg-canvas-deep/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="zt-hidescroll relative z-10 max-h-[92vh] w-full max-w-kds overflow-y-auto rounded-t-brand-xl border border-b-0 border-hairline bg-surface-card shadow-brand-soft"
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-soft" aria-hidden />
        </div>
        <div className="px-5 pb-[26px] pt-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="font-display text-display-md text-ink"
              >
                Dispatch {order ? orderDisplayId(order.id) : ""}
              </h2>
              <p className="mt-0.5 font-body text-body-sm text-muted">
                {order ? `${order.deliverySector} — ${order.landmark}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-hairline bg-surface-card transition-colors hover:bg-canvas-soft"
              aria-label="Close"
            >
              <Icon name="close" size={18} className="text-muted" strokeWidth={2.2} />
            </button>
          </div>

          {order && (
            <>
              <div className="mb-[11px] mt-[22px] font-body text-caption-uppercase uppercase tracking-wide text-muted">
                Customer contact
              </div>
              <a
                href={`tel:${order.customerPhone}`}
                className="flex min-h-[60px] items-center gap-[13px] rounded-brand-lg border border-hairline bg-surface-strong p-3.5 no-underline transition-colors hover:bg-canvas-soft"
              >
                <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-brand-lg border border-gradient-peach/45 bg-gradient-peach/20">
                  <Icon name="phone" size={20} className="text-body-strong" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-body-md font-medium text-ink">
                    Order customer
                  </div>
                  <div className="font-mono font-body text-body-sm text-muted">
                    {formatPhoneDisplay(order.customerPhone)}
                  </div>
                </div>
                <CallBadge />
              </a>

              <div className="mb-[11px] mt-[22px] font-body text-caption-uppercase uppercase tracking-wide text-muted">
                Available drivers
              </div>
              <div className="flex flex-col gap-2.5">
                {drivers.map((driver) => (
                  <a
                    key={driver.id}
                    href={`tel:${driver.phone}`}
                    className="flex min-h-[60px] items-center gap-[13px] rounded-brand-lg border border-hairline bg-surface-strong p-3.5 no-underline transition-colors hover:bg-canvas-soft"
                  >
                    <div
                      className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-brand-lg text-base font-medium"
                      style={{
                        background: `${driver.hue}26`,
                        border: `1.5px solid ${driver.hue}73`,
                        color: driver.hue,
                      }}
                    >
                      {driver.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-body text-body-md font-medium text-ink">
                        {driver.name}
                      </div>
                      <div className="font-mono font-body text-body-sm text-muted">
                        {formatPhoneDisplay(driver.phone)}
                      </div>
                    </div>
                    <CallBadge />
                  </a>
                ))}
              </div>

              <div className="mb-[11px] mt-[22px] flex items-center justify-between gap-3">
                <div className="font-body text-caption-uppercase uppercase tracking-wide text-muted">
                  Delivery slip
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCopy}
                  className={cn(
                    "h-[34px] min-h-[34px] gap-1.5 rounded-pill px-3.5 font-body text-caption"
                  )}
                >
                  <Icon name="copy" size={15} strokeWidth={2} />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-brand-lg border border-hairline bg-canvas-soft p-4 font-mono text-body-sm leading-relaxed text-ink">
                {slipText}
              </pre>

              <button
                type="button"
                onClick={() => {
                  onShareWhatsApp();
                  window.open(buildWhatsAppUrl(slipText), "_blank");
                }}
                className="mt-[18px] flex h-[60px] w-full items-center justify-center gap-2.5 rounded-pill border border-[#25D366]/30 bg-[#25D366] font-body text-button font-medium text-[#04361f] transition-colors hover:bg-[#20bd5a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <svg width="23" height="23" viewBox="0 0 24 24" fill="#04361f" aria-hidden>
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2zm5.8 14.13c-.24.68-1.42 1.31-1.95 1.36-.5.05-1.13.27-3.82-.8-3.21-1.27-5.26-4.54-5.42-4.75-.16-.21-1.3-1.73-1.3-3.3 0-1.57.82-2.34 1.12-2.66.3-.32.65-.4.86-.4.21 0 .43 0 .61.01.2.01.46-.07.72.55.27.64.92 2.21 1 2.37.08.16.13.35.03.56-.1.21-.16.34-.31.53-.16.18-.33.41-.47.55-.16.16-.32.33-.14.64.18.32.8 1.32 1.72 2.14 1.18 1.05 2.18 1.38 2.49 1.54.31.16.49.13.67-.08.18-.21.77-.9.98-1.21.21-.32.42-.26.71-.16.29.11 1.85.87 2.17 1.03.32.16.53.24.61.37.08.14.08.78-.16 1.46z" />
                </svg>
                Copy &amp; Share to WhatsApp
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
