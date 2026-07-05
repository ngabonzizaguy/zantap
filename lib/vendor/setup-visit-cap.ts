import type { OnboardingChecklist } from "@/lib/vendor/onboarding";
import { countCompletedSteps } from "@/lib/vendor/onboarding";

export const SETUP_AUTO_OPEN_MAX = 2;

export function setupVisitStorageKey(vendorSlug: string): string {
  return `zantap:kds-setup-visits-${vendorSlug}`;
}

export function readSetupVisitCount(vendorSlug: string): number {
  if (typeof localStorage === "undefined") return SETUP_AUTO_OPEN_MAX;
  try {
    const raw = localStorage.getItem(setupVisitStorageKey(vendorSlug));
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return SETUP_AUTO_OPEN_MAX;
  }
}

export function incrementSetupVisitCount(vendorSlug: string): number {
  const next = Math.min(readSetupVisitCount(vendorSlug) + 1, SETUP_AUTO_OPEN_MAX);
  try {
    localStorage.setItem(setupVisitStorageKey(vendorSlug), String(next));
  } catch {
    // ignore quota / private-mode failures
  }
  return next;
}

export function isOnboardingChecklistIncomplete(
  checklist: OnboardingChecklist
): boolean {
  const totalSteps = Object.keys(checklist).length;
  return countCompletedSteps(checklist) < totalSteps;
}

/** True when the setup drawer may auto-open on load. */
export function shouldAutoOpenSetupDrawer(
  vendorSlug: string,
  checklist: OnboardingChecklist
): boolean {
  const totalSteps = Object.keys(checklist).length;
  if (countCompletedSteps(checklist) >= totalSteps) return false;
  return readSetupVisitCount(vendorSlug) < SETUP_AUTO_OPEN_MAX;
}
