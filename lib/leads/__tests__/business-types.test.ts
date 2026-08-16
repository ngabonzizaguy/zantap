import { describe, expect, it } from "vitest";
import {
  LEAD_BUSINESS_TYPE_VALUES,
  pairLeadBusinessTypeOptions,
} from "@/lib/leads/business-types";

describe("localized Lead business types", () => {
  it("keeps persisted values canonical while labels change", () => {
    const options = pairLeadBusinessTypeOptions([
      "Resitora",
      "Akabari na resitora",
      "Utegura amafunguro",
      "Ugemura ibiribwa mu rugo",
      "Ubundi bucuruzi bw'ibiribwa",
    ]);

    expect(options.map((option) => option.value)).toEqual(
      LEAD_BUSINESS_TYPE_VALUES
    );
    expect(options[0]).toEqual({ value: "Restaurant", label: "Resitora" });
  });

  it("falls back to the canonical label if a translation is missing", () => {
    expect(pairLeadBusinessTypeOptions([])[2]).toEqual({
      value: "Caterer",
      label: "Caterer",
    });
  });
});
