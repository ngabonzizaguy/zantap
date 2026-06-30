import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertProvisionSecret,
  ProvisionSecretError,
} from "@/lib/vendor/provision-secret";

describe("assertProvisionSecret", () => {
  const original = process.env.PROVISION_SECRET;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PROVISION_SECRET;
    } else {
      process.env.PROVISION_SECRET = original;
    }
    vi.unstubAllEnvs();
  });

  it("accepts a matching secret", () => {
    process.env.PROVISION_SECRET = "test-provision-123";
    expect(() => assertProvisionSecret("test-provision-123")).not.toThrow();
  });

  it("rejects a missing client secret", () => {
    process.env.PROVISION_SECRET = "test-provision-123";
    expect(() => assertProvisionSecret("")).toThrow(ProvisionSecretError);
  });

  it("rejects a wrong secret", () => {
    process.env.PROVISION_SECRET = "test-provision-123";
    expect(() => assertProvisionSecret("wrong")).toThrow(ProvisionSecretError);
  });

  it("rejects when the server secret is unset", () => {
    delete process.env.PROVISION_SECRET;
    expect(() => assertProvisionSecret("anything")).toThrow(ProvisionSecretError);
  });
});
