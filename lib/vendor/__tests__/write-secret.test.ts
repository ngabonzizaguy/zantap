import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertWriteSecret,
  WriteSecretError,
} from "@/lib/vendor/write-secret";

describe("assertWriteSecret", () => {
  const original = process.env.VENDOR_WRITE_SECRET;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.VENDOR_WRITE_SECRET;
    } else {
      process.env.VENDOR_WRITE_SECRET = original;
    }
    vi.unstubAllEnvs();
  });

  it("accepts a matching secret", () => {
    process.env.VENDOR_WRITE_SECRET = "test-secret-123";
    expect(() => assertWriteSecret("test-secret-123")).not.toThrow();
  });

  it("rejects a missing client secret", () => {
    process.env.VENDOR_WRITE_SECRET = "test-secret-123";
    expect(() => assertWriteSecret("")).toThrow(WriteSecretError);
  });

  it("rejects a wrong secret", () => {
    process.env.VENDOR_WRITE_SECRET = "test-secret-123";
    expect(() => assertWriteSecret("wrong")).toThrow(WriteSecretError);
  });

  it("rejects when the server secret is unset", () => {
    delete process.env.VENDOR_WRITE_SECRET;
    expect(() => assertWriteSecret("anything")).toThrow(WriteSecretError);
  });
});
