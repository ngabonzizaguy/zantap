import { describe, expect, it } from "vitest";
import {
  endOfDayInTimezone,
  ORDER_HISTORY_TIMEZONE,
  resolveDateRange,
  startOfDayInTimezone,
} from "@/lib/orders/history-filters";

const TZ = ORDER_HISTORY_TIMEZONE;
const FIXED_NOW = new Date("2026-06-23T14:30:00.000Z");

describe("resolveDateRange", () => {
  it("today spans the Kigali calendar day", () => {
    const range = resolveDateRange({ datePreset: "today" }, FIXED_NOW, TZ);
    expect(range).not.toBeNull();
    expect(range!.from).toEqual(startOfDayInTimezone(FIXED_NOW, TZ));
    expect(range!.to).toEqual(endOfDayInTimezone(FIXED_NOW, TZ));
  });

  it("yesterday is the prior Kigali calendar day", () => {
    const range = resolveDateRange({ datePreset: "yesterday" }, FIXED_NOW, TZ);
    expect(range).not.toBeNull();
    const yesterdayRef = new Date("2026-06-22T12:00:00.000Z");
    expect(range!.from).toEqual(startOfDayInTimezone(yesterdayRef, TZ));
    expect(range!.to).toEqual(endOfDayInTimezone(yesterdayRef, TZ));
  });

  it("last7 includes seven calendar days ending today", () => {
    const range = resolveDateRange({ datePreset: "last7" }, FIXED_NOW, TZ);
    expect(range).not.toBeNull();
    const fromRef = new Date("2026-06-17T12:00:00.000Z");
    expect(range!.from).toEqual(startOfDayInTimezone(fromRef, TZ));
    expect(range!.to).toEqual(endOfDayInTimezone(FIXED_NOW, TZ));
  });

  it("last30 includes thirty calendar days ending today", () => {
    const range = resolveDateRange({ datePreset: "last30" }, FIXED_NOW, TZ);
    expect(range).not.toBeNull();
    const fromRef = new Date("2026-05-25T12:00:00.000Z");
    expect(range!.from).toEqual(startOfDayInTimezone(fromRef, TZ));
    expect(range!.to).toEqual(endOfDayInTimezone(FIXED_NOW, TZ));
  });

  it("custom uses inclusive day boundaries", () => {
    const range = resolveDateRange(
      {
        datePreset: "custom",
        dateFrom: new Date("2026-06-10T08:00:00.000Z"),
        dateTo: new Date("2026-06-12T20:00:00.000Z"),
      },
      FIXED_NOW,
      TZ
    );
    expect(range).not.toBeNull();
    expect(range!.from).toEqual(
      startOfDayInTimezone(new Date("2026-06-10T12:00:00.000Z"), TZ)
    );
    expect(range!.to).toEqual(
      endOfDayInTimezone(new Date("2026-06-12T12:00:00.000Z"), TZ)
    );
  });

  it("returns null when no date constraint is set", () => {
    expect(resolveDateRange({}, FIXED_NOW, TZ)).toBeNull();
  });
});
