import Link from "next/link";
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
        <Link
          href="/restaurants"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-pill border border-hairline-strong px-5 font-body text-button font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Your restaurants
        </Link>
      </main>
    </div>
  );
}
