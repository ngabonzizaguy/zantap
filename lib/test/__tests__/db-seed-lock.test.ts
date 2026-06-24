import { describe, expect, it } from "vitest";

import { withSeedLock } from "@/lib/test/db-seed-lock";

describe("withSeedLock", () => {
  it("runs tasks one at a time in call order", async () => {
    const order: number[] = [];

    const first = withSeedLock(async () => {
      await new Promise((r) => setTimeout(r, 30));
      order.push(1);
    });
    const second = withSeedLock(async () => {
      order.push(2);
    });

    await Promise.all([first, second]);
    expect(order).toEqual([1, 2]);
  });
});
