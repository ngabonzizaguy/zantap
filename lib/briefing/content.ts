export const BRIEFING_CHAPTERS = [
  { id: "why", label: "Why now" },
  { id: "product", label: "The product" },
  { id: "journey", label: "One order" },
  { id: "proof", label: "Evidence" },
  { id: "future", label: "The opportunity" },
] as const;
export const ORDER_JOURNEY = [
  {
    step: "Discover",
    title: "One link opens the menu.",
    body: "Customers see the food, prices and availability from the phone already in their hand.",
  },
  {
    step: "Choose",
    title: "The order stays clear.",
    body: "Sizes, extras, notes and delivery details arrive together instead of across scattered messages.",
  },
  {
    step: "Pay",
    title: "MoMo fits the moment.",
    body: "The customer follows a familiar mobile-money flow before the kitchen starts the order.",
  },
  {
    step: "Prepare",
    title: "The kitchen sees what matters.",
    body: "New, preparing and ready orders move through one shared view built for a busy service.",
  },
  {
    step: "Deliver",
    title: "Handoff becomes visible.",
    body: "The team can assign delivery, share a clear slip and complete the order without losing context.",
  },
  {
    step: "Learn",
    title: "Today becomes useful tomorrow.",
    body: "Sales, stock and costs give the food business a clearer view of what is working.",
  },
] as const;

export const EVIDENCE = [
  {
    label: "Working product",
    value: "Live",
    detail: "Storefront, ordering, MoMo handoff and kitchen workflow run together on zantap.app.",
  },
  {
    label: "Designed for",
    value: "Rwanda",
    detail: "Rwanda-first phone formats, RWF prices and familiar MTN MoMo behavior shape the product.",
  },
  {
    label: "Early offer",
    value: "Guided",
    detail: "Selected early food businesses receive hands-on setup rather than a software handoff.",
  },
] as const;

export const DOCUMENTS = [
  {
    title: "What a food business receives",
    body: "A branded mobile storefront, menu and availability controls, order and kitchen workflow, delivery handoff, sales history, stock tools and guided setup. Capabilities can grow without asking customers to install another app.",
  },
  {
    title: "How the commercial model develops",
    body: "Selected early partners receive free guided setup. ZanTap's stated long-term model is a per-order commission. Exact pricing has not been published and is not represented here.",
  },
  {
    title: "What is deliberately transparent",
    body: "Production payment currently uses a manual MTN MoMo USSD handoff while direct provider integration remains future work. The Briefing separates working capability, interim operations and roadmap rather than presenting them as the same thing.",
  },
  {
    title: "What participation can unlock",
    body: "Vendors bring real operating insight. Partners can extend distribution and trust. Sponsors can support digital access and guided adoption. Investors can help ZanTap turn a proven product loop into a durable Rwanda-first business.",
  },
] as const;

export interface BriefingDocument {
  chapterOrder: Array<"why" | "product" | "journey" | "proof" | "future">;
  hiddenChapters: Array<"why" | "product" | "journey" | "proof" | "future">;
  media: {
    hero: string;
    storefront: string;
    dashboard: string;
    journey: string;
    future: string;
  };
  hero: { kicker: string; title: string; emphasis: string; summary: string };
  opportunity: {
    kicker: string;
    title: string;
    cards: Array<{ title: string; body: string }>;
  };
  product: { kicker: string; title: string; body: string; includes: string };
  journey: {
    kicker: string;
    title: string;
    caption: string;
    steps: Array<{ step: string; title: string; body: string }>;
  };
  proof: {
    kicker: string;
    title: string;
    evidence: Array<{ label: string; value: string; detail: string }>;
    documents: Array<{ title: string; body: string }>;
  };
  future: { kicker: string; title: string; body: string; points: string[] };
  closing: { kicker: string; title: string; body: string };
}

export const DEFAULT_BRIEFING_DOCUMENT: BriefingDocument = {
  chapterOrder: ["why", "product", "journey", "proof", "future"],
  hiddenChapters: [],
  media: {
    hero: "/marketing/kigali-vendor-hero.png",
    storefront: "/brand/UI-screens/new-UI-screens%20%26%20video%20walkthrough/storefront.png",
    dashboard: "/brand/UI-screens/new-UI-screens%20%26%20video%20walkthrough/kds-inventoryStock.png",
    journey: "/marketing/scroll/kitchen.webp",
    future: "/marketing/scroll/grow.webp",
  },
  hero: {
    kicker: "Private briefing · Rwanda, 2026",
    title: "Good food already moves people.",
    emphasis: "ZanTap helps the business move with it.",
    summary:
      "One simple link connects a customer's choice, a familiar MoMo moment and a kitchen that knows what comes next.",
  },
  opportunity: {
    kicker: "The opportunity",
    title: "A busy service should not depend on finding the right message.",
    cards: [
      { title: "Orders arrive everywhere", body: "Calls, chats and paper can each hold a different piece of the same order." },
      { title: "Payment needs certainty", body: "The kitchen needs to know when to begin without chasing a conversation." },
      { title: "Growth needs memory", body: "Sales, stock and costs become useful only when today leaves a clear record." },
    ],
  },
  product: {
    kicker: "Meet ZanTap",
    title: "From their phone to your kitchen—without losing the order between.",
    body: "ZanTap gives a local food business its own mobile storefront and a live kitchen view. Customers do not need another app. The team does not need to search through a thread.",
    includes: "Menu and branding, order customization, MoMo handoff, kitchen stages, order history, receipts, inventory and profit tools, guided onboarding and an installable experience.",
  },
  journey: {
    kicker: "One order, start to finish",
    title: "Six ordinary moments. One continuous view.",
    caption: "Designed around the rhythm of service—not the rhythm of a software demo.",
    steps: ORDER_JOURNEY.map((row) => ({ ...row })),
  },
  proof: {
    kicker: "Evidence so far · August 2026",
    title: "The product loop exists. The next work is adoption.",
    evidence: EVIDENCE.map((row) => ({ ...row })),
    documents: DOCUMENTS.map((row) => ({ ...row })),
  },
  future: {
    kicker: "Rwanda first",
    title: "Start close enough to learn. Build strong enough to travel.",
    body: "ZanTap's early path is deliberately practical: help real food businesses go live, learn from service, and grow a per-order model around value that can be seen in the kitchen.",
    points: [
      "Vendors shape the product through real daily use.",
      "Partners extend reach, trust and operating capability.",
      "Sponsors can widen access to guided digital adoption.",
      "Investors can help a working loop become a durable company.",
    ],
  },
  closing: {
    kicker: "Continue the conversation",
    title: "What could ZanTap make possible with you?",
    body: "Choose the perspective closest to yours and tell us what you would like to explore.",
  },
};

export function briefingDocumentFromJson(value: unknown): BriefingDocument {
  if (!value || typeof value !== "object" || !("hero" in value)) {
    return structuredClone(DEFAULT_BRIEFING_DOCUMENT);
  }
  const document = value as Partial<BriefingDocument>;
  return {
    ...structuredClone(DEFAULT_BRIEFING_DOCUMENT),
    ...document,
    media: { ...DEFAULT_BRIEFING_DOCUMENT.media, ...document.media },
  } as BriefingDocument;
}
