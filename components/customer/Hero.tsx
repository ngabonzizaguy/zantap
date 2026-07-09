"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
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
  /** Top navigation rendered over the immersive cover (e.g. TopBar). */
  header?: ReactNode;
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

/** Solid ink pills — always legible on any cover (matches reference mockup). */
const actionButtonClass =
  "flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_4px_16px_rgba(0,0,0,0.22)] transition-all duration-200 hover:bg-primary-active hover:scale-[1.04] active:scale-[0.97]";

const logoTileClass =
  "glass-liquid-strong flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-brand-xl";

const metaPillClass = "glass-liquid-pill flex h-9 items-center gap-1.5 px-3.5";

const heroBleedClass = cn(
  "relative h-[36vh] min-h-[13.75rem] max-h-[22.5rem]",
  "-mx-5 w-[calc(100%+2.5rem)]",
  "min-[480px]:left-1/2 min-[480px]:w-screen min-[480px]:max-w-[100vw] min-[480px]:-translate-x-1/2"
);

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
  header,
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
    <section className="relative">
      {/* Cover zone — overflow visible so logo can float below the image edge */}
      <div className={heroBleedClass}>
        {/* Clipped image stack only */}
        <div className="absolute inset-0 overflow-hidden">
          {coverImageUrl ? (
            <div
              className="zt-hero-mask absolute inset-0"
              aria-hidden
            >
              <Image
                src={coverImageUrl}
                alt=""
                fill
                priority
                unoptimized
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-gradient-mint/40 via-canvas to-gradient-peach/35 [mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,transparent_100%)]"
              aria-hidden
            />
          )}

          {/* Light top vignette for TopBar legibility — does not wash out the image */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/25 to-transparent"
            aria-hidden
          />

          {/* Single eased bottom feather — dissolves into dark storefront canvas */}
          <div
            className="zt-hero-feather pointer-events-none absolute inset-x-0 bottom-0 h-[64%]"
            aria-hidden
          />
        </div>

        {/* Top navigation */}
        {header ? (
          <div className="absolute inset-x-0 top-0 z-20 px-5 pt-4">{header}</div>
        ) : null}

        {/* Call + share — solid ink, upper-right of cover */}
        <div className="absolute right-5 top-[4.5rem] z-20 flex items-center gap-2.5">
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

        {/* Logo — floats over the dissolve, not clipped by the image stack */}
        <div className="absolute bottom-0 left-5 z-30 translate-y-1/2">
          <div className={logoTileClass}>
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
        </div>
      </div>

      {/* Vendor identity — on page surface below the floating logo */}
      <div className="relative z-10 mt-12 px-0.5">
        <p className="font-body text-caption-uppercase uppercase tracking-[0.08em] text-muted">
          {tagline}
        </p>
        <h1 className="mt-2 font-display text-display-lg font-light tracking-tight text-ink">
          {restaurantName}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
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
      </div>

      {trimmedDescription ? (
        <DescriptionClamp text={trimmedDescription} />
      ) : null}
    </section>
  );
}
