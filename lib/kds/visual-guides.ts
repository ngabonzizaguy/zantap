export const VISUAL_GUIDE_IDS = ["orders-flow"] as const;

export type VisualGuideId = (typeof VISUAL_GUIDE_IDS)[number];
export type VisualGuideStage =
  | "ACCEPTED"
  | "PREPARING"
  | "DISPATCH"
  | "COMPLETED";

export interface VisualGuideCallout {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VisualGuideFrame {
  stage: VisualGuideStage;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  instruction: string;
  callout: VisualGuideCallout;
}

export interface VisualGuideDefinition {
  id: VisualGuideId;
  title: string;
  summary: string;
  frames: readonly VisualGuideFrame[];
  showMe: {
    label: string;
    tab: "orders";
  };
}

export interface VisualGuideStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type VisualGuideStatus = "unseen" | "dismissed" | "complete";

const ORDER_FLOW_GUIDE: VisualGuideDefinition = {
  id: "orders-flow",
  title: "Move an order through the kitchen",
  summary: "See each step from a new paid order to completed delivery.",
  frames: [
    {
      stage: "ACCEPTED",
      imageSrc: "/guides/kds-order-accepted.png",
      imageAlt: "An expanded new paid order in the ZanTap kitchen dashboard",
      imageWidth: 403,
      imageHeight: 828,
      instruction: "Tap ACCEPTED when you see the new paid order.",
      callout: { left: 5.2, top: 54.8, width: 25.4, height: 6.5 },
    },
    {
      stage: "PREPARING",
      imageSrc: "/guides/kds-order-accepted.png",
      imageAlt: "An expanded paid order with kitchen stage controls",
      imageWidth: 403,
      imageHeight: 828,
      instruction: "Tap PREPARING when cooking starts, then READY when it is packed.",
      callout: { left: 31.6, top: 54.8, width: 25.4, height: 6.5 },
    },
    {
      stage: "DISPATCH",
      imageSrc: "/guides/kds-order-dispatch.png",
      imageAlt: "The ZanTap driver assignment sheet for a ready order",
      imageWidth: 565,
      imageHeight: 756,
      instruction: "Choose the driver, then confirm the assignment for delivery.",
      callout: { left: 4.2, top: 79.4, width: 93.2, height: 9.1 },
    },
    {
      stage: "COMPLETED",
      imageSrc: "/guides/kds-order-completed.png",
      imageAlt: "An out-for-delivery order with its assigned driver",
      imageWidth: 558,
      imageHeight: 768,
      instruction: "Tap Mark completed after the customer receives the order.",
      callout: { left: 5.4, top: 89.4, width: 88.3, height: 7.1 },
    },
  ],
  showMe: {
    label: "Show me Orders",
    tab: "orders",
  },
};

const VISUAL_GUIDES: Record<VisualGuideId, VisualGuideDefinition> = {
  "orders-flow": ORDER_FLOW_GUIDE,
};

export function getVisualGuide(id: VisualGuideId): VisualGuideDefinition {
  return VISUAL_GUIDES[id];
}

export function visualGuideStorageKey(
  vendorSlug: string,
  guideId: VisualGuideId
): string {
  return `zantap:kds-guide:v1:${encodeURIComponent(vendorSlug)}:${guideId}`;
}

export function isVisualGuideComplete(
  storage: VisualGuideStorage,
  vendorSlug: string,
  guideId: VisualGuideId
): boolean {
  return getVisualGuideStatus(storage, vendorSlug, guideId) === "complete";
}

export function getVisualGuideStatus(
  storage: VisualGuideStorage,
  vendorSlug: string,
  guideId: VisualGuideId
): VisualGuideStatus {
  const value = storage.getItem(visualGuideStorageKey(vendorSlug, guideId));
  return value === "complete" || value === "dismissed" ? value : "unseen";
}

export function markVisualGuideDismissed(
  storage: VisualGuideStorage,
  vendorSlug: string,
  guideId: VisualGuideId
): void {
  storage.setItem(visualGuideStorageKey(vendorSlug, guideId), "dismissed");
}

export function markVisualGuideComplete(
  storage: VisualGuideStorage,
  vendorSlug: string,
  guideId: VisualGuideId
): void {
  storage.setItem(visualGuideStorageKey(vendorSlug, guideId), "complete");
}
