"use client";

import Link from "next/link";

interface BackToKdsChipProps {
  vendorSlug: string;
}

/** Floating chip when vendor previews storefront from KDS (`?from=kds`). */
export function BackToKdsChip({ vendorSlug }: BackToKdsChipProps) {
  return (
    <Link
      href={`/vendor/${vendorSlug}?tab=setup`}
      className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-zt-brown/15 bg-white/92 px-4 py-2 font-body text-[13px] font-semibold text-zt-brown shadow-[0_8px_24px_rgba(120,70,60,0.18)] backdrop-blur-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <span aria-hidden="true">←</span>
      Back to KDS
    </Link>
  );
}
