import {
  createHash,
  randomBytes,
  randomInt,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export function normalizeBriefingSecret(value: string): string {
  const normalized = value.trim().toLowerCase();
  return /^[\d\s_-]+$/.test(normalized)
    ? normalized.replace(/\D/g, "")
    : normalized.replace(/[\s_-]+/g, "-");
}

export function generateBriefingSecret(): string {
  return randomInt(10_000).toString().padStart(4, "0");
}

export function lookupBriefingSecret(value: string): string {
  return createHash("sha256").update(normalizeBriefingSecret(value)).digest("base64url");
}

export async function hashBriefingSecret(value: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(normalizeBriefingSecret(value), salt, 64)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyBriefingSecret(value: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltValue, hashValue] = storedHash.split("$");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, "base64url");
  const actual = (await scrypt(
    normalizeBriefingSecret(value),
    Buffer.from(saltValue, "base64url"),
    expected.length
  )) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
