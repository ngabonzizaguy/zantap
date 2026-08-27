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
