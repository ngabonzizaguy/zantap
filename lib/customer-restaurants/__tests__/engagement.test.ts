import { describe, expect, it, vi } from "vitest";
import { createCustomerEngagementController } from "@/lib/customer-restaurants/engagement";
import { createInMemorySavedRestaurantRepository } from "@/lib/customer-restaurants/in-memory";

describe("customer restaurant engagement", () => {
  it("does not save a passive view, then converges meaningful actions on one stable Vendor record", async () => {
    const repository = createInMemorySavedRestaurantRepository();
    const onSaved = vi.fn();
    const now = vi
      .fn<() => Date>()
      .mockReturnValueOnce(new Date("2026-08-21T10:00:00.000Z"))
      .mockReturnValueOnce(new Date("2026-08-21T11:00:00.000Z"))
      .mockReturnValueOnce(new Date("2026-08-21T12:00:00.000Z"))
      .mockReturnValueOnce(new Date("2026-08-21T13:00:00.000Z"));
    const controller = createCustomerEngagementController({
      repository,
      restaurant: {
        vendorId: "vendor-1",
        slug: "kigali-grill",
        name: "Kigali Grill",
      },
      now,
      onSaved,
    });

    expect(await repository.list()).toEqual([]);

    await controller.record("cart-add");
    await controller.record("cart-add");
    await controller.record("checkout-start");
    await controller.record("order-place");
    await controller.record("explicit-save");

    expect(await repository.list()).toEqual([
      expect.objectContaining({
        vendorId: "vendor-1",
        lastInteractedAt: "2026-08-21T13:00:00.000Z",
      }),
    ]);
    expect(now).toHaveBeenCalledTimes(4);
    expect(onSaved).toHaveBeenCalledTimes(4);
  });
});
