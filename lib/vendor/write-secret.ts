export class WriteSecretError extends Error {
  constructor(message = "Invalid or missing write secret") {
    super(message);
    this.name = "WriteSecretError";
  }
}

/** Rejects guarded vendor writes when the secret is missing or wrong. */
export function assertWriteSecret(secret: string): void {
  const expected = process.env.VENDOR_WRITE_SECRET;
  if (!expected || !secret || secret !== expected) {
    throw new WriteSecretError();
  }
}
