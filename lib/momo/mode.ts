import type { MomoMode } from "@/lib/types";

/** Production defaults to manual USSD; local dev defaults to sandbox STK (ADR-0033). */
export function getMomoMode(): MomoMode {
  const explicit = process.env.MOMO_MODE?.trim().toLowerCase();
  if (explicit === "simulate" || explicit === "manual" || explicit === "openapi") {
    return explicit;
  }
  return process.env.NODE_ENV === "production" ? "manual" : "simulate";
}

export function isManualMomoMode(mode: MomoMode = getMomoMode()): boolean {
  return mode === "manual";
}

export function isOpenApiMomoMode(mode: MomoMode = getMomoMode()): boolean {
  return mode === "openapi";
}
