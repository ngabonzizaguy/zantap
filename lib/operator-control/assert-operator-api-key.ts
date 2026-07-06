import { timingSafeEqual } from "node:crypto";

export class OperatorApiKeyError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "OperatorApiKeyError";
  }
}

function readConfiguredKey(): string | null {
  const key = process.env.OPERATOR_API_KEY?.trim();
  return key || null;
}

export function assertOperatorApiKey(
  authorization: string | null
): void {
  const configured = readConfiguredKey();
  if (!configured) {
    throw new OperatorApiKeyError();
  }

  const header = authorization?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const provided = match?.[1]?.trim() ?? "";
  if (!provided) {
    throw new OperatorApiKeyError();
  }

  const expected = Buffer.from(configured, "utf8");
  const candidate = Buffer.from(provided, "utf8");
  if (expected.length !== candidate.length) {
    throw new OperatorApiKeyError();
  }
  if (!timingSafeEqual(expected, candidate)) {
    throw new OperatorApiKeyError();
  }
}

export function isOperatorApiConfigured(): boolean {
  return Boolean(readConfiguredKey());
}
