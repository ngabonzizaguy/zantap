import { describe, expect, it } from "vitest";
import {
  shouldDeleteTerminalSource,
  validateMenuIntakeUpload,
} from "@/lib/menu-intake/uploads";

describe("menu intake upload policy", () => {
  it("enforces private-source formats, per-file, count, and total limits", () => {
    expect(
      validateMenuIntakeUpload({
        kind: "SOURCE",
        mime: "application/zip",
        byteLength: 100,
        existingFileCount: 0,
        existingTotalBytes: 0,
      }),
    ).toMatch(/JPEG/);
    expect(
      validateMenuIntakeUpload({
        kind: "SOURCE",
        mime: "application/pdf",
        byteLength: 16 * 1024 * 1024,
        existingFileCount: 0,
        existingTotalBytes: 0,
      }),
    ).toMatch(/15 MB/);
    expect(
      validateMenuIntakeUpload({
        kind: "SOURCE",
        mime: "image/jpeg",
        byteLength: 1024,
        existingFileCount: 30,
        existingTotalBytes: 0,
      }),
    ).toMatch(/30/);
    expect(
      validateMenuIntakeUpload({
        kind: "SOURCE",
        mime: "image/jpeg",
        byteLength: 2 * 1024 * 1024,
        existingFileCount: 1,
        existingTotalBytes: 74 * 1024 * 1024,
      }),
    ).toMatch(/75 MB/);
  });

  it("expires terminal private sources after 90 days unless retained for a dispute", () => {
    const terminal = new Date("2026-01-01T00:00:00Z");
    const later = new Date("2026-04-01T00:00:00Z");
    expect(shouldDeleteTerminalSource(terminal, later)).toBe(true);
    expect(shouldDeleteTerminalSource(terminal, later, true)).toBe(false);
  });
});
