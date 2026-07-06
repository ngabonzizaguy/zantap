import { describe, expect, it } from "vitest";
import {
  assertOperatorApiKey,
  OperatorApiKeyError,
} from "@/lib/operator-control/assert-operator-api-key";

describe("assertOperatorApiKey", () => {
  it("accepts a matching bearer token", () => {
    process.env.OPERATOR_API_KEY = "test-operator-key";
    expect(() =>
      assertOperatorApiKey("Bearer test-operator-key")
    ).not.toThrow();
  });

  it("rejects a missing or wrong token", () => {
    process.env.OPERATOR_API_KEY = "test-operator-key";
    expect(() => assertOperatorApiKey("Bearer wrong")).toThrow(
      OperatorApiKeyError
    );
    expect(() => assertOperatorApiKey(null)).toThrow(OperatorApiKeyError);
  });
});
