export class ProvisionSecretError extends Error {
  constructor(message = "Invalid or missing provision secret") {
    super(message);
    this.name = "ProvisionSecretError";
  }
}

/** Rejects vendor provisioning when the secret is missing or wrong. */
export function assertProvisionSecret(secret: string): void {
  const expected = process.env.PROVISION_SECRET;
  if (!expected || !secret || secret !== expected) {
    throw new ProvisionSecretError();
  }
}
