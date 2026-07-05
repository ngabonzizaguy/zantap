"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Confetti } from "@/components/onboard/Confetti";
import { StorefrontQr } from "@/components/onboard/StorefrontQr";

interface LiveStepProps {
  vendorName: string;
  slug: string;
  storefrontUrl: string;
  /** Vendor preview path — includes back navigation to the KDS. */
  storefrontPreviewPath: string;
}

const actionButtonClass =
  "inline-flex h-11 min-h-11 flex-1 items-center justify-center gap-2 rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function LiveStep({
  vendorName,
  slug,
  storefrontUrl,
  storefrontPreviewPath,
}: LiveStepProps) {
  const [copied, setCopied] = useState(false);
  const kdsPath = `/vendor/${slug}?tab=drivers`;
  const displayUrl = storefrontUrl.replace(/^https?:\/\//, "");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op, the link is visible above
    }
  };

  const shareStore = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${vendorName} on ZanTap`,
          text: `Order from ${vendorName}`,
          url: storefrontUrl,
        });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    void copyLink();
  };

  return (
    <div className="relative flex flex-col items-center gap-6 text-center">
      <Confetti />

      <span className="zt-live-glow mt-4 flex h-24 w-24 items-center justify-center rounded-full">
        <Image
          src="/brand/zantap-logo.png"
          alt="ZanTap"
          width={96}
          height={96}
          priority
          className="h-full w-full object-contain"
        />
      </span>

      <div>
        <h1 className="font-display text-display-lg leading-tight text-ink">
          🎉 Your Store is Live
        </h1>
        <p className="mt-3 font-body text-body-md text-muted">
          Congratulations, {vendorName}! You can now receive orders from
          customers.
        </p>
      </div>

      <div className="w-full text-left">
        <p className="mb-2 font-body text-caption uppercase tracking-wider text-muted">
          Your Storefront
        </p>
        <div className="flex items-center gap-3 rounded-brand-lg border border-hairline-strong bg-surface-card px-4 py-3">
          <span className="text-primary" aria-hidden="true">
            🔗
          </span>
          <span className="min-w-0 flex-1 truncate font-body text-body-sm text-primary">
            {displayUrl}
          </span>
          <button
            type="button"
            onClick={() => void copyLink()}
            aria-label="Copy storefront link"
            className="flex-none text-muted transition-colors hover:text-ink"
          >
            {copied ? "✓" : "⧉"}
          </button>
        </div>
      </div>

      <StorefrontQr url={storefrontUrl} slug={slug} showActions />

      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={() => void shareStore()}
          className={actionButtonClass}
        >
          ↗ Share Store
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className={actionButtonClass}
        >
          ⧉ {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      <Link
        href={kdsPath}
        className={cn(
          "inline-flex h-[60px] min-h-[60px] w-full items-center justify-center gap-2 rounded-brand-lg bg-primary px-6 font-body text-button font-medium text-on-primary transition-colors hover:bg-primary-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        )}
      >
        Open Kitchen Dashboard →
      </Link>

      <Link
        href={storefrontPreviewPath}
        className="font-body text-body-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        View my storefront
      </Link>
    </div>
  );
}
