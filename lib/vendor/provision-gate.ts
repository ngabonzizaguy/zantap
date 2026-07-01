/**
 * Optional server-side kill-switch for self-serve provisioning (ADR-0022).
 *
 * Onboarding is gate-free by default — {@link provisionVendor} no longer takes a
 * provision secret. This env toggle is the emergency brake: flip it on to close
 * public signup wholesale (e.g. abuse spike) until real auth (#12) lands. It is
 * OFF by default (unset / falsy), so provisioning stays open.
 *
 * Implementation note: this is a dedicated var (`PROVISION_KILL_SWITCH`) rather
 * than overloading the existing `PROVISION_SECRET`. `PROVISION_SECRET` still
 * carries its candidate-#15 meaning ("show the /onboard wizard") for the not-yet
 * -migrated onboard page (Issue 3), so reusing it as an off-switch would invert
 * that meaning and could silently close signup in prod where it is already set.
 */

export class ProvisioningClosedError extends Error {
  readonly code = "PROVISIONING_CLOSED";
  constructor(
    message = "Vendor signup is temporarily closed. Please try again later."
  ) {
    super(message);
    this.name = "ProvisioningClosedError";
  }
}

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

/** True when the operator has engaged the provisioning kill-switch. */
export function isProvisioningClosed(): boolean {
  return isTruthyEnv(process.env.PROVISION_KILL_SWITCH);
}

/** Reject provisioning when the kill-switch is engaged; no-op otherwise. */
export function assertProvisioningOpen(): void {
  if (isProvisioningClosed()) {
    throw new ProvisioningClosedError();
  }
}
