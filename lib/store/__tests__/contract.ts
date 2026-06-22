import { beforeEach, describe, expect, it } from "vitest";
import type { ResettableStore } from "@/lib/store/types";
import { DEMO_VENDOR_SLUG } from "@/lib/store/seed-data";

/**
 * The single behavioral contract every Store adapter must satisfy. Tests cross
 * the Store seam only and assert externally observable behavior — never adapter
 * internals, and never a specific id format. Issue 03 runs this same suite
 * against the Prisma adapter to prove the two cannot drift.
 */
export function runStoreContract(
  name: string,
  createStore: () => ResettableStore
): void {
  describe(`Store contract: ${name}`, () => {
    let store: ResettableStore;
    const slug = DEMO_VENDOR_SLUG;

    beforeEach(async () => {
      store = createStore();
      await store.reset();
    });

    async function placeOrderFromMenu() {
      const available = await store.getAvailableMenu(slug);
      expect(available.length).toBeGreaterThan(0);
      const item = available[0];
      return store.createOrder({
        vendorSlug: slug,
        customerPhone: "0788000111",
        deliverySector: "Kicukiro",
        landmark: "Test landmark",
        items: [{ menuItemId: item.id, quantity: 2 }],
      });
    }

    describe("vendor reads", () => {
      it("returns the seeded vendor by slug", async () => {
        const vendor = await store.getVendorBySlug(slug);
        expect(vendor).not.toBeNull();
        expect(vendor?.slug).toBe(slug);
      });

      it("returns null for an unknown vendor", async () => {
        expect(await store.getVendorBySlug("does-not-exist")).toBeNull();
      });
    });

    describe("menu", () => {
      it("exposes categories and a non-empty menu", async () => {
        expect((await store.getCategories(slug)).length).toBeGreaterThan(0);
        expect((await store.getMenu(slug)).length).toBeGreaterThan(0);
      });

      it("getAvailableMenu only returns available items", async () => {
        const available = await store.getAvailableMenu(slug);
        expect(available.every((item) => item.isAvailable)).toBe(true);
      });

      it("toggling availability hides an item from the available menu", async () => {
        const before = await store.getAvailableMenu(slug);
        const target = before[0];

        const toggled = await store.toggleItemAvailability(slug, target.id);
        expect(toggled?.isAvailable).toBe(false);

        const afterAvailable = await store.getAvailableMenu(slug);
        expect(afterAvailable.find((i) => i.id === target.id)).toBeUndefined();

        const afterFull = await store.getMenu(slug);
        expect(afterFull.find((i) => i.id === target.id)?.isAvailable).toBe(
          false
        );
      });

      it("setAllItemsAvailable makes every item available", async () => {
        const menu = await store.getMenu(slug);
        const unavailable = menu.find((i) => !i.isAvailable);
        expect(unavailable).toBeDefined();

        await store.setAllItemsAvailable(slug);
        const after = await store.getMenu(slug);
        expect(after.every((i) => i.isAvailable)).toBe(true);
      });
    });

    describe("order lifecycle", () => {
      it("creates an order that is later retrievable and listed", async () => {
        const created = await placeOrderFromMenu();

        expect(typeof created.id).toBe("string");
        expect(created.id.length).toBeGreaterThan(0);
        expect(created.status).toBe("PENDING");
        expect(created.totalAmount).toBeGreaterThan(0);

        const fetched = await store.getOrder(created.id);
        expect(fetched?.id).toBe(created.id);

        const listed = await store.listOrders(slug);
        expect(listed.find((o) => o.id === created.id)).toBeDefined();
      });

      it("a PENDING order is not active until it is PAID", async () => {
        const created = await placeOrderFromMenu();

        let active = await store.listActiveOrders(slug);
        expect(active.find((o) => o.id === created.id)).toBeUndefined();

        await store.updateOrderStatus(created.id, "PAID");
        active = await store.listActiveOrders(slug);
        expect(active.find((o) => o.id === created.id)).toBeDefined();
      });

      it("advances status through DISPATCHED to COMPLETED", async () => {
        const created = await placeOrderFromMenu();

        await store.updateOrderStatus(created.id, "PAID");
        await store.updateOrderStatus(created.id, "DISPATCHED");
        let active = await store.listActiveOrders(slug);
        expect(active.find((o) => o.id === created.id)).toBeDefined();

        const completed = await store.updateOrderStatus(
          created.id,
          "COMPLETED"
        );
        expect(completed?.status).toBe("COMPLETED");

        active = await store.listActiveOrders(slug);
        expect(active.find((o) => o.id === created.id)).toBeUndefined();
      });

      it("returns null when updating a missing order", async () => {
        expect(
          await store.updateOrderStatus("missing-order-id", "PAID")
        ).toBeNull();
      });

      it("rejects an order containing an unavailable item", async () => {
        const menu = await store.getMenu(slug);
        const unavailable = menu.find((i) => !i.isAvailable);
        expect(unavailable).toBeDefined();

        await expect(
          store.createOrder({
            vendorSlug: slug,
            customerPhone: "0788000111",
            deliverySector: "Kicukiro",
            landmark: "Test landmark",
            items: [{ menuItemId: unavailable!.id, quantity: 1 }],
          })
        ).rejects.toThrow();
      });
    });

    describe("today's gross", () => {
      it("counts an order only once it reaches a counted status", async () => {
        const baseline = await store.getTodayGross(slug);

        const created = await placeOrderFromMenu();
        expect(await store.getTodayGross(slug)).toBe(baseline);

        await store.updateOrderStatus(created.id, "PAID");
        expect(await store.getTodayGross(slug)).toBe(
          baseline + created.totalAmount
        );

        await store.updateOrderStatus(created.id, "DISPATCHED");
        expect(await store.getTodayGross(slug)).toBe(
          baseline + created.totalAmount
        );

        await store.updateOrderStatus(created.id, "COMPLETED");
        expect(await store.getTodayGross(slug)).toBe(
          baseline + created.totalAmount
        );
      });
    });

    describe("drivers", () => {
      it("lists the seeded drivers for the vendor", async () => {
        const drivers = await store.getDrivers(slug);
        expect(drivers.length).toBeGreaterThan(0);
      });
    });

    describe("kitchen state", () => {
      it("opens and closes, reflecting the latest value", async () => {
        expect(await store.isKitchenOpen(slug)).toBe(true);

        await store.setKitchenOpen(slug, false);
        expect(await store.isKitchenOpen(slug)).toBe(false);

        await store.setKitchenOpen(slug, true);
        expect(await store.isKitchenOpen(slug)).toBe(true);
      });
    });

    describe("reset", () => {
      it("returns the Store to its seeded state", async () => {
        const before = (await store.listOrders(slug)).length;
        await placeOrderFromMenu();
        expect((await store.listOrders(slug)).length).toBe(before + 1);

        await store.reset();
        expect((await store.listOrders(slug)).length).toBe(before);
      });
    });
  });
}
