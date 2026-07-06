import { GradientOrbs } from "@/components/ui/primitives";
import type { Vendor } from "@/lib/types";

interface SuspendedStorefrontProps {
  vendor: Vendor;
}

export function SuspendedStorefront({ vendor }: SuspendedStorefrontProps) {
  return (
    <div className="relative min-h-screen bg-canvas text-ink">
      <GradientOrbs />
      <main className="relative z-[1] mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-display text-display-md font-light tracking-tight text-ink">
          {vendor.name}
        </p>
        <p className="mt-4 text-body text-muted">
          This storefront is temporarily unavailable. Please check back later.
        </p>
      </main>
    </div>
  );
}
