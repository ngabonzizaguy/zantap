import { describe, expect, it } from "vitest";

import {
  hashOwnerToken,
  mintOwnerToken,
  verifyOwnerToken,
} from "@/lib/vendor/owner-token";

describe("owner-token", () => {
  it("mints a random token with a matching hash", () => {
    const a = mintOwnerToken();
    const b = mintOwnerToken();

    expect(a.token).not.toBe(b.token);
    expect(a.hash).not.toBe(b.hash);
    expect(a.hash).toBe(hashOwnerToken(a.token));
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifies the correct token against its hash", () => {
    const { token, hash } = mintOwnerToken();
    expect(verifyOwnerToken(token, hash)).toBe(true);
  });

  it("rejects a wrong token", () => {
    const { hash } = mintOwnerToken();
    const other = mintOwnerToken();
    expect(verifyOwnerToken(other.token, hash)).toBe(false);
  });

  it("rejects missing token or hash without throwing", () => {
    const { token, hash } = mintOwnerToken();
    expect(verifyOwnerToken(undefined, hash)).toBe(false);
    expect(verifyOwnerToken(token, undefined)).toBe(false);
    expect(verifyOwnerToken("", "")).toBe(false);
    expect(verifyOwnerToken(null, null)).toBe(false);
  });

  it("hashing is deterministic", () => {
    expect(hashOwnerToken("abc")).toBe(hashOwnerToken("abc"));
    expect(hashOwnerToken("abc")).not.toBe(hashOwnerToken("abd"));
  });
});
