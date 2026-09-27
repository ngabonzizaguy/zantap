import type { CheckoutStage } from "@/lib/types";

export type StageEvent =
  | "open_cart"
  | "close_cart"
  | "pay_start"
  | "stk_success"
  | "stk_failed"
  | "manual_pay_success"
  | "momo_dial_opened"
  | "manual_confirm_success"
  | "manual_abandon"
  | "manual_expired"
  | "openapi_prompt_sent"
  | "openapi_paid"
  | "openapi_failed"
  | "openapi_cancel"
  | "pin_success"
  | "pin_failed"
  | "cancel_ussd"
  | "reset";

const transitions: Record<
  CheckoutStage,
  Partial<Record<StageEvent, CheckoutStage>>
> = {
  menu: {
    open_cart: "cart",
    reset: "menu",
  },
  cart: {
    close_cart: "menu",
    pay_start: "loading",
    reset: "menu",
  },
  loading: {
    stk_success: "ussd",
    stk_failed: "cart",
    manual_pay_success: "momo_dial",
    openapi_prompt_sent: "awaiting_prompt",
    openapi_paid: "success",
    reset: "menu",
  },
  ussd: {
    pin_success: "success",
    pin_failed: "ussd",
    cancel_ussd: "cart",
    reset: "menu",
  },
  momo_dial: {
    momo_dial_opened: "awaiting_confirmation",
    manual_abandon: "cart",
    reset: "menu",
  },
  awaiting_confirmation: {
    manual_confirm_success: "success",
    manual_abandon: "cart",
    manual_expired: "cart",
    momo_dial_opened: "awaiting_confirmation",
    reset: "menu",
  },
  awaiting_prompt: {
    openapi_paid: "success",
    openapi_failed: "cart",
    openapi_cancel: "cart",
    reset: "menu",
  },
  success: {
    reset: "menu",
  },
};

/**
 * Returns the next stage for a legal transition, or `null` when the event is
 * not allowed from the current stage (caller should keep the current stage).
 */
export function transition(
  stage: CheckoutStage,
  event: StageEvent
): CheckoutStage | null {
  return transitions[stage][event] ?? null;
}
