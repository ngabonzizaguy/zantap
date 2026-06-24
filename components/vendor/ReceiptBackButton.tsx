"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

interface ReceiptBackButtonProps {
  vendorSlug: string;
}

export function ReceiptBackButton({ vendorSlug }: ReceiptBackButtonProps) {
  const router = useRouter();
  const historyHref = `/vendor/${vendorSlug}?tab=history`;

  const handleBack = () => {
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const fromKds =
      referrer.includes(`/vendor/${vendorSlug}`) ||
      referrer.includes(`/vendor/${encodeURIComponent(vendorSlug)}`);

    if (fromKds && typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(historyHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "no-print inline-flex h-11 min-h-11 items-center gap-2 rounded-brand-pill",
        "border border-hairline-strong px-4 font-body text-body-sm font-medium text-ink",
        "transition-colors hover:bg-surface-strong"
      )}
    >
      <Icon name="chevronRight" size={18} className="rotate-180" strokeWidth={2} />
      Back
    </button>
  );
}
