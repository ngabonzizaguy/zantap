"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

interface SuccessStepProps {
  slug: string;
  vendorName: string;
}

const primaryLinkClass =
  "inline-flex h-10 min-h-10 w-full items-center justify-center rounded-pill bg-primary px-5 font-body text-button font-medium text-on-primary transition-colors hover:bg-primary-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const outlineLinkClass =
  "inline-flex h-10 min-h-10 w-full items-center justify-center rounded-pill border border-hairline-strong bg-transparent px-5 font-body text-button font-medium text-ink transition-colors hover:border-ink active:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function SuccessStep({ slug, vendorName }: SuccessStepProps) {
  const storefrontPath = `/${slug}`;
  const kdsSetupPath = `/vendor/${slug}?tab=setup`;

  return (
    <div className="flex flex-col gap-6 text-center">
      <div>
        <h2 className="font-display text-display-sm text-ink">
          You&apos;re live, {vendorName}!
        </h2>
        <p className="mt-2 font-body text-body-md text-muted">
          Your menu is ready for customers. Open your kitchen dashboard to finish
          setup.
        </p>
      </div>

      <div className="rounded-brand-lg border border-hairline bg-canvas-soft px-4 py-3 text-left">
        <p className="font-body text-caption uppercase tracking-wider text-muted-soft">
          Customer menu
        </p>
        <p className="mt-1 break-all font-body text-body-sm text-ink">
          {storefrontPath}
        </p>
        <p className="mt-3 font-body text-caption uppercase tracking-wider text-muted-soft">
          Kitchen dashboard
        </p>
        <p className="mt-1 break-all font-body text-body-sm text-ink">
          {kdsSetupPath}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href={kdsSetupPath} className={cn(primaryLinkClass)}>
          Open kitchen dashboard
        </Link>
        <Link href={storefrontPath} className={cn(outlineLinkClass)}>
          View my menu
        </Link>
      </div>

      <p className="font-body text-caption text-muted-soft">
        Enter your write secret in Setup to edit the menu and upload photos.
      </p>
    </div>
  );
}
