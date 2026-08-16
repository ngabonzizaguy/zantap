/**
 * All marketing-page copy lives here — never hard-coded in JSX — so
 * Kinyarwanda/French become translation tasks, not rewrites (ADR-0046 §14).
 * Copy constraints (ADR-0046 §2–3): "local food businesses" umbrella, free
 * guided setup offer, no invented pricing, Rwanda-first.
 */

export const MARKETING_META = {
  title: "ZanTap — Put your food business online, with help",
  description:
    "ZanTap gives local food businesses in Rwanda one ordering link, MoMo payments, and a live kitchen view. Free guided setup for selected early partners.",
  siteName: "ZanTap",
} as const;

export const NAV = {
  howItWorks: "How it works",
  offer: "The offer",
  cta: "Get setup",
  openStorefrontDemo: "See a live storefront",
} as const;

export const HERO = {
  availability: "Early partner places open",
  kicker: "Starting in Rwanda",
  headline: "Put your food business online—with help.",
  summary:
    "We set up your ordering link, your first menu items and your MoMo flow. Your team gets a live kitchen view.",
  promise: [
    { step: "01", title: "Customers order", detail: "From one simple link" },
    { step: "02", title: "You receive payment", detail: "Through MoMo" },
    { step: "03", title: "Your kitchen moves", detail: "With every paid order" },
  ],
  deviceTag: { title: "Your store is live", detail: "Share your link" },
  audienceNote:
    "For restaurants, bars, caterers and home-based food delivery.",
} as const;

export const LEAD_FORM = {
  kicker: "Free early setup",
  heading: "Tell us about your business.",
  subheading: "We\u2019ll contact you on WhatsApp.",
  fields: {
    businessName: { label: "Business name", placeholder: "e.g. Mama Aline\u2019s Kitchen" },
    businessType: {
      label: "Type of business",
      placeholder: "Choose one",
      options: [
        "Restaurant",
        "Bar & grill",
        "Caterer",
        "Home-based food delivery",
        "Other food business",
      ],
    },
    contactName: { label: "Contact person", placeholder: "Your full name" },
    phone: { label: "WhatsApp number", placeholder: "07\u2022\u2022 \u2022\u2022\u2022 \u2022\u2022\u2022" },
    area: { label: "Area", placeholder: "e.g. Kimihurura, Kigali" },
  },
  submit: "Request setup",
  submitting: "Sending\u2026",
  consent:
    "By sending this, you agree that ZanTap may contact you on WhatsApp about your setup.",
  reassurance: "No long contract. No pressure.",
  errors: {
    required: "Please fill in every field.",
    phone: "Enter a valid Rwandan phone number (07XX XXX XXX).",
    rateLimited: "Too many requests. Please wait a while and try again.",
    submissionFailed: "We couldn\u2019t save your request. Please try again.",
  },
  success: {
    title: "You\u2019re on the list.",
    detail: "We\u2019ll contact you on WhatsApp and take it from there.",
    whatsappCta: "Continue on WhatsApp",
    whatsappNote: "Review the message, then tap Send in WhatsApp.",
  },
} as const;

export const HOW_IT_WORKS = {
  kicker: "What happens next",
  heading: "Simple from day one.",
  steps: [
    {
      tag: "Day 01",
      title: "We set up together",
      detail: "Your details, menu and MoMo.",
    },
    {
      tag: "Go live",
      title: "You share your link",
      detail: "WhatsApp, Instagram or anywhere.",
    },
    {
      tag: "First order",
      title: "Your kitchen sees it",
      detail: "Paid and ready to prepare.",
    },
  ],
} as const;

export const PRODUCT = {
  kicker: "One order. Two screens.",
  heading: "From their phone to your kitchen.",
  storefront: {
    title: "Your own mobile menu",
    detail:
      "Share one link. Customers choose, order and pay by MoMo without downloading an app.",
    alt: "A ZanTap storefront on a phone showing a menu and cart",
  },
  kitchen: {
    title: "A clearer kitchen",
    detail:
      "Every paid order arrives on your kitchen dashboard — new, preparing, ready. No searching through messages.",
    alt: "The ZanTap kitchen dashboard showing a new paid order",
    /** Cards for the auto-cycling screen deck (reference-video style). */
    cards: [
      {
        src: "/marketing/card-store-live.png",
        width: 534,
        height: 943,
        caption: "Your store, live in minutes",
        alt: "ZanTap onboarding success screen with storefront link and QR code",
      },
      {
        src: "/marketing/card-momo-pay.png",
        width: 422,
        height: 633,
        caption: "Customers pay by MoMo",
        alt: "ZanTap checkout sheet asking the customer to pay with MoMo",
      },
      {
        src: "/marketing/card-kds-dashboard.png",
        width: 557,
        height: 768,
        caption: "Orders land in your kitchen",
        alt: "ZanTap kitchen dashboard listing paid orders",
      },
    ],
  },
} as const;

/**
 * Scroll-world cinematic (Issue 03, zero-credit preview). Scenes 1–2 scrub
 * accepted walkthrough legs; scenes 3–6 crossfade accepted stills until the
 * real partner footage arrives. Real product screens + the MoMo logo live in
 * this HTML overlay — never baked into generated video.
 */
export const SCROLL_WORLD = {
  kicker: "One order, start to finish",
  heading: "Walk through it.",
  hint: "Scroll to walk through",
  sections: [
    {
      id: "storefront",
      label: "The storefront",
      eyebrow: "Kigali, golden hour",
      title: "It starts at your counter.",
      body: "Great food already brings people in. ZanTap gives them an easier way to reach you \u2014 wherever they are.",
    },
    {
      id: "order",
      label: "The order",
      eyebrow: "One simple link",
      title: "They order from their phone.",
      body: "No app to download. Your menu, your prices, one link you can share on WhatsApp, Instagram or anywhere.",
    },
    {
      id: "momo",
      label: "MoMo payment",
      eyebrow: "Paid before you cook",
      title: "MoMo payment, confirmed.",
      body: "Customers pay with MTN MoMo. You see the money before the kitchen starts \u2014 no chasing, no guessing.",
    },
    {
      id: "kitchen",
      label: "The kitchen",
      eyebrow: "The kitchen view",
      title: "Every paid order, on one screen.",
      body: "New, preparing, ready \u2014 your team works a clear queue instead of scrolling through messages.",
    },
    {
      id: "dispatch",
      label: "Dispatch",
      eyebrow: "Out for delivery",
      title: "From your door to theirs.",
      body: "Assign a driver and send the order on its way, with a delivery slip that carries everything they need.",
    },
    {
      id: "grow",
      label: "Grow",
      eyebrow: "Made in Rwanda",
      title: "More orders. Fuller nights.",
      body: "Selected early partners get free guided setup. Your food business, online \u2014 with help.",
      cta: "Get setup",
    },
  ],
  media: {
    momoLogoAlt: "MoMo from MTN logo",
    momoScreenAlt: "Paying with MoMo on a phone",
    storefrontScreenAlt: "A ZanTap storefront on a phone",
    kitchenScreenAlt: "The ZanTap kitchen dashboard",
  },
} as const;

export const COMPARISON = {
  kicker: "Why change?",
  heading: "Same food. Better system.",
  rows: [
    {
      problem: "Commission fees eating profits",
      solution: "Lower fees — your revenue stays yours",
      icon: "fees",
    },
    {
      problem: "Competition platforms own your customers",
      solution: "Your own kitchen dashboard and link",
      icon: "platform",
    },
    {
      problem: "Paper sales tracking and guesswork",
      solution: "Digital sales system, clear records",
      icon: "tracking",
    },
    {
      problem: "No insight into stock or demand",
      solution: "Stock and demand tracking, built in",
      icon: "stock",
    },
  ],
} as const;

export const OFFER = {
  kicker: "Early partner offer",
  heading: "We help you set it up. You start taking orders.",
  intro: "For selected early food-business partners in Rwanda.",
  includes: [
    "Your own order link",
    "First menu setup",
    "MoMo payment setup",
    "Personal WhatsApp walkthrough",
  ],
  cta: "Request setup",
  smallPrint: "No long contract. No pressure.",
} as const;

export const CLOSE = {
  kicker: "Made here. Ready to grow.",
  heading: "Start in Rwanda. Grow across East Africa.",
  cta: "Get setup",
} as const;

export const FOOTER = {
  tagline: "Tap. Serve. Grow.",
  location: "\u00a9 2026 ZanTap \u00b7 Kigali, Rwanda",
  privacyLabel: "Privacy",
  termsLabel: "Terms",
} as const;

export const STICKY_CTA = "Get setup";

/**
 * The full English copy tree. Localization (lib/i18n) addresses every
 * translatable string by its dot path into THIS object (arrays by index),
 * e.g. `hero.headline`, `offer.includes.2`. Renaming a key here renames the
 * translation key — keep the Ops-stored overrides in mind before refactoring.
 */
export const MARKETING_COPY = {
  meta: MARKETING_META,
  nav: NAV,
  hero: HERO,
  leadForm: LEAD_FORM,
  howItWorks: HOW_IT_WORKS,
  product: PRODUCT,
  scrollWorld: SCROLL_WORLD,
  comparison: COMPARISON,
  offer: OFFER,
  close: CLOSE,
  footer: FOOTER,
  stickyCta: STICKY_CTA,
} as const;

export type MarketingCopyTree = typeof MARKETING_COPY;
