import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const BRIEFING_PREVIEW_COOKIE = "zantap_briefing_preview";

export interface BriefingPreviewConfig {
  recipient: string;
  expiresAt: Date;
}

function getSecret(): string | null {
  return process.env.BRIEFING_PREVIEW_SECRET?.trim() || null;
}

function sessionToken(secret: string): string {
  return createHmac("sha256", secret)
    .update("zantap-briefing-preview-session-v1")
    .digest("hex");
}

export function getBriefingPreviewConfig(): BriefingPreviewConfig | null {
  const secret = getSecret();
  const rawExpiry = process.env.BRIEFING_PREVIEW_EXPIRES_AT?.trim();
  if (!secret || !rawExpiry) return null;

  const expiresAt = new Date(rawExpiry);
  if (Number.isNaN(expiresAt.getTime())) return null;

  return {
    recipient:
      process.env.BRIEFING_PREVIEW_RECIPIENT?.trim() || "Invited viewer",
    expiresAt,
  };
}

export function isBriefingPreviewExpired(
  config: BriefingPreviewConfig,
  now = new Date()
): boolean {
  return config.expiresAt.getTime() <= now.getTime();
}

export function verifyBriefingPreviewSecret(candidate: string): boolean {
  const secret = getSecret();
  if (!secret) return false;
  const expected = Buffer.from(secret, "utf8");
  const provided = Buffer.from(candidate.trim(), "utf8");
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

export function createBriefingPreviewSessionToken(): string | null {
  const secret = getSecret();
  return secret ? sessionToken(secret) : null;
}

export async function hasBriefingPreviewSession(): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;
  const actual = (await cookies()).get(BRIEFING_PREVIEW_COOKIE)?.value ?? "";
  const expected = sessionToken(secret);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
