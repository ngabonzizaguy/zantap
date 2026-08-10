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
  cta: "Get free setup",
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
  submit: "Request my free setup",
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
  },
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
  cta: "Request my free setup",
  smallPrint: "No long contract. No pressure.",
} as const;

export const CLOSE = {
  kicker: "Made here. Ready to grow.",
  heading: "Start in Rwanda. Grow across East Africa.",
  cta: "Get my free setup",
} as const;

export const FOOTER = {
  tagline: "Tap. Serve. Grow.",
  location: "\u00a9 2026 ZanTap \u00b7 Kigali, Rwanda",
} as const;

export const STICKY_CTA = "Get free setup";
