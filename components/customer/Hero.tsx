"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/primitives";
import { DescriptionClamp } from "@/components/customer/DescriptionClamp";
import { getStorefrontUrl } from "@/lib/base-url";
import { cn } from "@/lib/cn";

interface HeroProps {
  vendorSlug: string;
  tagline: string;
  restaurantName: string;
  deliveryTime: string;
  rating?: number;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  phoneNumber?: string;
}

function PlaceholderLogo() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className="text-muted"
    >
      <path d="M24 6l13 7.5v15L24 36 11 28.5v-15L24 6z" />
      <path d="M24 14l7 4v8l-7 4-7-4v-8l7-4z" />
      <path
        d="M24 22l3.5 2v4L24 30l-3.5-2v-4L24 22z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

const actionButtonClass =
  "flex h-10 w-10 flex-none items-center justify-center rounded-full border border-hairline bg-surface-card text-muted shadow-brand-soft transition-colors hover:text-ink";

const metaPillClass =
  "flex h-9 items-center gap-1.5 rounded-pill border border-hairline bg-canvas-soft px-3.5";

export function Hero({
  vendorSlug,
  tagline,
  restaurantName,
  deliveryTime,
  rating = 4.8,
  logoUrl,
  coverImageUrl,
  description,
  phoneNumber,
}: HeroProps) {
  const [copied, setCopied] = useState(false);
  const trimmedDescription = description?.trim();
  const trimmedPhone = phoneNumber?.trim();
  const storefrontUrl = getStorefrontUrl(vendorSlug);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const shareStore = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${restaurantName} on ZanTap`,
          text: `Order from ${restaurantName}`,
          url: storefrontUrl,
        });
        return;
      } catch {
        // user cancelled or share failed
      }
    }
    void copyLink();
  };

  return (
    <>
      <Card padding="lg" className="relative overflow-hidden">
        {coverImageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${coverImageUrl})` }}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-br from-canvas/92 via-surface-card/88 to-canvas-soft/90"
              aria-hidden
            />
          </>
        ) : null}

        <div className="relative flex items-start justify-between gap-4">
          <div
            className={cn(
              "relative flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-brand-xl border border-hairline bg-surface-card shadow-brand-soft",
              coverImageUrl && "bg-surface-card/95 backdrop-blur-sm"
            )}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${restaurantName} logo`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <PlaceholderLogo />
            )}
          </div>

          <div className="flex flex-none items-center gap-2">
            {trimmedPhone ? (
              <a
                href={`tel:${trimmedPhone}`}
                aria-label={`Call ${restaurantName}`}
                className={actionButtonClass}
              >
                <Icon name="phone" size={18} />
              </a>
            ) : null}
            <button
              type="button"
              aria-label={copied ? "Link copied" : "Share storefront"}
              onClick={() => void shareStore()}
              className={actionButtonClass}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <p className="font-body text-caption-uppercase uppercase text-muted">
            {tagline}
          </p>
          <h1 className="mt-1 font-display text-display-lg font-light tracking-tight text-ink">
            {restaurantName}
          </h1>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <div className={metaPillClass}>
            <Icon name="clock" size={14} className="text-muted" />
            <span className="font-body text-body-sm font-medium text-ink">
              {deliveryTime}
            </span>
          </div>
          <div className={metaPillClass}>
            <Icon name="star" size={14} className="text-muted" />
            <span className="font-body text-body-sm font-medium text-ink">
              {rating}
            </span>
            <span className="font-body text-body-sm text-muted">· Free delivery</span>
          </div>
        </div>
      </Card>

      {trimmedDescription ? (
        <DescriptionClamp text={trimmedDescription} />
      ) : null}
    </>
  );
}
