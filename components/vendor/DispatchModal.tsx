"use client";

import type { Driver, Order } from "@/lib/types";
import { buildDeliverySlip, buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatPhoneDisplay, orderDisplayId } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
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
  const slipText = order ? buildDeliverySlip(order, vendorName) : "";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end justify-center transition-all duration-300",
        open ? "pointer-events-auto bg-black/60" : "pointer-events-none bg-transparent"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "zt-hidescroll max-h-[92vh] w-full max-w-kds overflow-y-auto rounded-t-[26px] border-[1.5px] border-zk-borderDark border-b-0 bg-zk-surfaceAlt transition-transform duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)]",
          open ? "translate-y-0" : "translate-y-[101%]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3">
          <div className="h-[5px] w-[42px] rounded-full bg-[#4a3526]" />
        </div>
        <div className="px-5 pb-[26px] pt-3.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-zk-text">
                Dispatch {order ? orderDisplayId(order.id) : ""}
              </div>
              <div className="mt-0.5 text-sm font-semibold text-zk-sub">
                {order ? `${order.deliverySector} — ${order.landmark}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border-[1.5px] border-zk-border bg-zk-surface"
            >
              <Icon name="close" size={18} className="text-zk-sub" strokeWidth={2.2} />
            </button>
          </div>

          {order && (
            <>
              <div className="mb-[11px] mt-[22px] text-xs font-bold uppercase tracking-wide text-zk-muted">
                Customer contact
              </div>
              <a
                href={`tel:${order.customerPhone}`}
                className="flex min-h-[60px] items-center gap-[13px] rounded-[14px] border-[1.5px] border-zk-border bg-zk-surface p-[12px_14px] no-underline"
              >
                <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl border-[1.5px] border-momo/45 bg-momo/15">
                  <Icon name="phone" size={20} className="text-momo" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-extrabold text-zk-text">Order customer</div>
                  <div className="font-mono text-sm font-semibold text-zk-sub">
                    {formatPhoneDisplay(order.customerPhone)}
                  </div>
                </div>
                <div className="flex h-[42px] items-center gap-1.5 rounded-full bg-green-400 px-[15px] text-sm font-extrabold text-[#052e16]">
                  <Icon name="call" size={17} className="text-[#052e16]" strokeWidth={2.3} />
                  Call
                </div>
              </a>

              <div className="mb-[11px] mt-[22px] text-xs font-bold uppercase tracking-wide text-zk-muted">
                Available drivers
              </div>
              <div className="flex flex-col gap-2.5">
                {drivers.map((driver) => (
                  <a
                    key={driver.id}
                    href={`tel:${driver.phone}`}
                    className="flex min-h-[60px] items-center gap-[13px] rounded-[14px] border-[1.5px] border-zk-border bg-zk-surface p-[12px_14px] no-underline"
                  >
                    <div
                      className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl text-base font-extrabold"
                      style={{
                        background: `${driver.hue}26`,
                        border: `1.5px solid ${driver.hue}73`,
                        color: driver.hue,
                      }}
                    >
                      {driver.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-extrabold text-zk-text">{driver.name}</div>
                      <div className="font-mono text-sm font-semibold text-zk-sub">
                        {formatPhoneDisplay(driver.phone)}
                      </div>
                    </div>
                    <div className="flex h-[42px] items-center gap-1.5 rounded-full bg-green-400 px-[15px] text-sm font-extrabold text-[#052e16]">
                      <Icon name="call" size={17} className="text-[#052e16]" strokeWidth={2.3} />
                      Call
                    </div>
                  </a>
                ))}
              </div>

              <div className="mb-[11px] mt-[22px] flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wide text-zk-muted">
                  Delivery slip
                </div>
                <button
                  type="button"
                  onClick={onCopy}
                  className="flex h-[34px] items-center gap-1.5 rounded-full border-[1.5px] border-zk-border bg-zk-surface px-[13px] text-[13px] font-bold text-[#ede2d9]"
                >
                  <Icon name="copy" size={15} strokeWidth={2} />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-[13px] border-[1.5px] border-zk-borderDark bg-[#100b07] p-4 font-mono text-[13px] font-medium leading-relaxed text-[#d8c9bd]">
                {slipText}
              </pre>

              <button
                type="button"
                onClick={() => {
                  onShareWhatsApp();
                  window.open(buildWhatsAppUrl(slipText), "_blank");
                }}
                className="mt-[18px] flex h-[60px] w-full items-center justify-center gap-[11px] rounded-[14px] border-none bg-[#25D366] text-base font-extrabold tracking-wide text-[#04361f] shadow-[0_10px_26px_rgba(37,211,102,0.32)]"
              >
                <svg width="23" height="23" viewBox="0 0 24 24" fill="#04361f">
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
