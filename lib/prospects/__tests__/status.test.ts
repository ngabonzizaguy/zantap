import { describe, expect, it } from "vitest";
import {
  canTransitionProspectStatus,
  nextProspectStatuses,
} from "@/lib/prospects/status";

describe("prospect status transitions", () => {
  it("allows FOUND → CONTACTED / DECLINED / UNREACHABLE", () => {
    expect(nextProspectStatuses("FOUND")).toEqual([
      "CONTACTED",
      "DECLINED",
      "UNREACHABLE",
    ]);
  });

  it("allows IN_TALKS → CONVERTED", () => {
    expect(canTransitionProspectStatus("IN_TALKS", "CONVERTED")).toBe(true);
  });

  it("blocks CONVERTED → anything else", () => {
    expect(nextProspectStatuses("CONVERTED")).toEqual([]);
    expect(canTransitionProspectStatus("CONVERTED", "FOUND")).toBe(false);
  });

  it("allows UNREACHABLE to reopen", () => {
    expect(canTransitionProspectStatus("UNREACHABLE", "CONTACTED")).toBe(true);
  });
});
