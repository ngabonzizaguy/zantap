import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";

export const OPS_SESSION_COOKIE = "zantap_ops_session";

function readConfiguredSecret(): string | null {
  const secret = process.env.OPERATOR_UI_SECRET?.trim();
  return secret || null;
}

export function isOpsUiConfigured(): boolean {
  return Boolean(readConfiguredSecret());
}

export async function isOpsSessionValid(): Promise<boolean> {
  const configured = readConfiguredSecret();
  if (!configured) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(OPS_SESSION_COOKIE)?.value ?? "";
  if (!token) return false;

  const expected = Buffer.from(configured, "utf8");
  const candidate = Buffer.from(token, "utf8");
  if (expected.length !== candidate.length) return false;
  return timingSafeEqual(expected, candidate);
}

export function verifyOpsLoginSecret(secret: string): boolean {
  const configured = readConfiguredSecret();
  if (!configured) return false;

  const expected = Buffer.from(configured, "utf8");
  const candidate = Buffer.from(secret.trim(), "utf8");
  if (expected.length !== candidate.length) return false;
  return timingSafeEqual(expected, candidate);
}
