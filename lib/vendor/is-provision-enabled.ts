/** True when operator has configured a provision secret (required for /onboard). */
export function isProvisionEnabled(): boolean {
  return Boolean(process.env.PROVISION_SECRET);
}
