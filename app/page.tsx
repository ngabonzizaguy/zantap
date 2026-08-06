import type { Metadata } from "next";
import Image from "next/image";
import { getBaseUrl } from "@/lib/base-url";
import {
  CLOSE,
  FOOTER,
  HERO,
  HOW_IT_WORKS,
  MARKETING_META,
  NAV,
  OFFER,
  PRODUCT,
} from "@/lib/marketing/copy";
import { DeviceFrame } from "@/components/marketing/DeviceFrame";
import { HeroMedia } from "@/components/marketing/HeroMedia";
import { LeadForm } from "@/components/marketing/LeadForm";
import { MarketingMotion } from "@/components/marketing/MarketingMotion";
import { OrbitAccent } from "@/components/marketing/OrbitAccent";
import { StickyCta } from "@/components/marketing/StickyCta";

const OG_IMAGE = "/marketing/kigali-vendor-hero.png";

export function generateMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    title: MARKETING_META.title,
    description: MARKETING_META.description,
    ...(base ? { metadataBase: new URL(base) } : {}),
    openGraph: {
      title: MARKETING_META.title,
      description: MARKETING_META.description,
      siteName: MARKETING_META.siteName,
      type: "website",
      locale: "en_RW",
      images: [{ url: OG_IMAGE, width: 1376, height: 768 }],
    },
    twitter: {
      card: "summary_large_image",
      title: MARKETING_META.title,
      description: MARKETING_META.description,
      images: [OG_IMAGE],
    },
  };
}

const CTA_PILL_CREAM =
  "inline-flex items-center gap-2 rounded-pill bg-[#faf7f2] px-7 py-4 font-body text-button font-semibold text-[#0c0a09] transition-colors hover:bg-white";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#f4f4f3]">
      {/* Masthead */}
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <a href="#top" aria-label="ZanTap home" className="flex-none">
            <Image
              src="/brand/approved-z/zantap-wordmark-logo2-transparent.png"
              alt="ZanTap"
              width={128}
              height={36}
              priority
              className="h-8 w-auto brightness-0 invert"
            />
          </a>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 font-body text-body-sm text-white/70 md:flex"
          >
            <a href="#how" className="transition-colors hover:text-white">
              {NAV.howItWorks}
            </a>
            <a href="#offer" className="transition-colors hover:text-white">
              {NAV.offer}
            </a>
          </nav>
          <a
            href="#lead-form"
            className="rounded-pill bg-[#f5a623] px-5 py-2.5 font-body text-button font-semibold text-[#1a1205] transition-colors hover:bg-[#ffd24c]"
          >
            {NAV.cta}
          </a>
        </div>
      </header>

      {/* Hero — A's cinematic Kigali footage + C's conversion-first layout */}
      <section id="top" className="relative">
        <HeroMedia />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-28 sm:px-8 md:pt-36 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:pb-24">
          <div>
            <p
              data-mkt-hero
              className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-1.5 font-body text-caption text-white/80 backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
              {HERO.availability}
            </p>
            <p
              data-mkt-hero
              className="mt-6 font-body text-caption-uppercase uppercase text-[#f5a623]"
            >
              {HERO.kicker}
            </p>
            <h1
              data-mkt-hero
              className="mt-3 max-w-xl font-display text-[42px] font-light leading-[1.08] tracking-tight sm:text-[56px] lg:text-[64px]"
            >
              {HERO.headline}
            </h1>
            <p
              data-mkt-hero
              className="mt-5 max-w-md font-body text-body-md text-white/75"
            >
              {HERO.summary}
            </p>
            <p data-mkt-hero className="mt-3 font-body text-caption text-white/50">
              {HERO.audienceNote}
            </p>

            <ol data-mkt-hero className="mt-9 max-w-md divide-y divide-white/10">
              {HERO.promise.map((item) => (
                <li key={item.step} className="flex items-baseline gap-4 py-3.5">
                  <span className="font-mono text-caption text-[#f5a623]">
                    {item.step}
                  </span>
                  <span>
                    <span className="block font-body text-body-strong text-white">
                      {item.title}
                    </span>
                    <span className="block font-body text-caption text-white/55">
                      {item.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Form ahead of any device on mobile (prototype C) */}
          <div data-mkt-hero className="w-full max-w-md justify-self-center lg:justify-self-end">
            <LeadForm />
          </div>
        </div>
      </section>

      {/* What happens next */}
      <section id="how" className="border-t border-white/10 bg-[#0e0c0b]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <div data-mkt-reveal className="max-w-xl">
            <p className="font-body text-caption-uppercase uppercase text-[#f5a623]">
              {HOW_IT_WORKS.kicker}
            </p>
            <h2 className="mt-3 font-display text-[34px] font-light leading-tight sm:text-[44px]">
              {HOW_IT_WORKS.heading}
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.steps.map((step) => (
              <article
                key={step.tag}
                data-mkt-reveal
                className="rounded-brand-xl border border-white/10 bg-white/[0.04] p-6"
              >
                <span className="font-mono text-caption uppercase tracking-wide text-[#f5a623]">
                  {step.tag}
                </span>
                <h3 className="mt-3 font-body text-title-sm text-white">
                  {step.title}
                </h3>
                <p className="mt-1.5 font-body text-caption text-white/55">
                  {step.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Product: two screens inside device hardware */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <div data-mkt-reveal className="max-w-xl">
            <p className="font-body text-caption-uppercase uppercase text-[#f5a623]">
              {PRODUCT.kicker}
            </p>
            <h2 className="mt-3 font-display text-[34px] font-light leading-tight sm:text-[44px]">
              {PRODUCT.heading}
            </h2>
          </div>

          <div className="mt-14 grid items-center gap-14 lg:grid-cols-2">
            <div data-mkt-reveal className="relative flex justify-center">
              <OrbitAccent />
              <DeviceFrame
                src="/marketing/screen-storefront.png"
                alt={PRODUCT.storefront.alt}
                width={412}
                height={854}
                className="w-[230px] sm:w-[260px]"
              />
            </div>
            <div data-mkt-reveal>
              <h3 className="font-display text-display-md text-white">
                {PRODUCT.storefront.title}
              </h3>
              <p className="mt-3 max-w-md font-body text-body-md text-white/70">
                {PRODUCT.storefront.detail}
              </p>
            </div>
          </div>

          <div className="mt-20 grid items-center gap-14 lg:grid-cols-2">
            <div data-mkt-reveal className="lg:order-2">
              <div className="flex justify-center">
                <DeviceFrame
                  src="/marketing/screen-kitchen.png"
                  alt={PRODUCT.kitchen.alt}
                  width={390}
                  height={702}
                  variant="terminal"
                  className="w-[300px] sm:w-[360px]"
                />
              </div>
            </div>
            <div data-mkt-reveal className="lg:order-1">
              <h3 className="font-display text-display-md text-white">
                {PRODUCT.kitchen.title}
              </h3>
              <p className="mt-3 max-w-md font-body text-body-md text-white/70">
                {PRODUCT.kitchen.detail}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Offer */}
      <section id="offer" className="border-t border-white/10 bg-[#0e0c0b]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
          <div data-mkt-reveal>
            <p className="font-body text-caption-uppercase uppercase text-[#f5a623]">
              {OFFER.kicker}
            </p>
            <h2 className="mt-3 max-w-md font-display text-[34px] font-light leading-tight sm:text-[44px]">
              {OFFER.heading}
            </h2>
          </div>
          <div
            data-mkt-reveal
            className="rounded-brand-xxl border border-white/10 bg-white/[0.04] p-7 sm:p-9"
          >
            <p className="font-body text-body-sm text-white/65">{OFFER.intro}</p>
            <ul className="mt-5 space-y-3.5">
              {OFFER.includes.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#f5a623]/15 text-[13px] text-[#f5a623]">
                    ✓
                  </span>
                  <span className="font-body text-body-md text-white/90">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="#lead-form"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-pill bg-[#f5a623] px-6 py-4 font-body text-button font-semibold text-[#1a1205] transition-colors hover:bg-[#ffd24c]"
            >
              {OFFER.cta} <span aria-hidden>→</span>
            </a>
            <p className="mt-3 text-center font-body text-caption text-white/45">
              {OFFER.smallPrint}
            </p>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:py-24">
          <div data-mkt-reveal>
            <p className="font-body text-caption-uppercase uppercase text-[#f5a623]">
              {CLOSE.kicker}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-[34px] font-light leading-tight sm:text-[44px]">
              {CLOSE.heading}
            </h2>
          </div>
          <a data-mkt-reveal href="#lead-form" className={CTA_PILL_CREAM}>
            {CLOSE.cta} <span aria-hidden>↗</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0908]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-12 text-center sm:px-8">
          <Image
            src="/brand/approved-z/zantap-wordmark-logo2-transparent.png"
            alt="ZanTap"
            width={110}
            height={31}
            className="h-7 w-auto brightness-0 invert"
          />
          <p className="font-display text-title-md italic text-white/70">
            {FOOTER.tagline}
          </p>
          <p className="font-body text-caption text-white/40">
            {FOOTER.location}
          </p>
        </div>
      </footer>

      <StickyCta />
      <MarketingMotion />
    </div>
  );
}
