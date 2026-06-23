import type { MenuItem, Order } from "@/lib/types";

export interface OnboardingChecklist {
  hasMenuItem: boolean;
  hasPhoto: boolean;
  kitchenOpen: boolean;
  hasFirstOrder: boolean;
  hasDispatch: boolean;
}

export interface OnboardingStep {
  id: keyof OnboardingChecklist;
  label: string;
  hint: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "hasMenuItem",
    label: "Add a menu item",
    hint: "Open Menu and tap + Add item.",
  },
  {
    id: "hasPhoto",
    label: "Add a photo",
    hint: "Edit an item and upload or link an image.",
  },
  {
    id: "kitchenOpen",
    label: "Open the kitchen",
    hint: "Tap OPEN in the header when you are ready for orders.",
  },
  {
    id: "hasFirstOrder",
    label: "Receive your first order",
    hint: "Share your storefront link; orders appear after MoMo payment.",
  },
  {
    id: "hasDispatch",
    label: "Dispatch an order",
    hint: "Expand a paid ticket and tap Dispatch moto driver.",
  },
];

const PAID_PLUS = new Set<Order["status"]>(["PAID", "DISPATCHED", "COMPLETED"]);
const DISPATCHED_PLUS = new Set<Order["status"]>(["DISPATCHED", "COMPLETED"]);

/** Pure derivation — safe on client (snapshot) and server (full order list). */
export function deriveOnboardingState(
  menu: MenuItem[],
  kitchenOpen: boolean,
  orders: Order[]
): OnboardingChecklist {
  return {
    hasMenuItem: menu.length > 0,
    hasPhoto: menu.some((item) => (item.images?.length ?? 0) > 0),
    kitchenOpen,
    hasFirstOrder: orders.some((order) => PAID_PLUS.has(order.status)),
    hasDispatch: orders.some((order) => DISPATCHED_PLUS.has(order.status)),
  };
}

export function countCompletedSteps(checklist: OnboardingChecklist): number {
  return ONBOARDING_STEPS.filter((step) => checklist[step.id]).length;
}
