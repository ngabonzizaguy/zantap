import { beforeEach, describe, expect, it } from "vitest";
import type { ResettableStore } from "@/lib/store/types";
import { DEMO_VENDOR_SLUG } from "@/lib/store/seed-data";
import { MOMO_SIM_VALID_PIN } from "@/lib/momo/constants";
import { DEFAULT_ORDER_HISTORY_PAGE_SIZE } from "@/lib/orders/history-filters";

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

    describe("menu CRUD", () => {
      it("creates, updates, archives, and restores an item", async () => {
        const created = await store.createMenuItem(slug, {
          name: "Test Bowl",
          priceRwf: 4200,
          description: "Fresh test dish",
          category: "Sides",
        });

        expect(created.name).toBe("Test Bowl");
        expect(created.priceRwf).toBe(4200);
        expect(created.category).toBe("Sides");
        expect(created.archivedAt).toBeUndefined();

        const onMenu = await store.getMenu(slug);
        expect(onMenu.find((i) => i.id === created.id)).toBeDefined();

        const updated = await store.updateMenuItem(slug, created.id, {
          priceRwf: 4500,
        });
        expect(updated?.priceRwf).toBe(4500);

        const archived = await store.archiveMenuItem(slug, created.id);
        expect(archived?.archivedAt).toBeInstanceOf(Date);

        const activeAfterArchive = await store.getMenu(slug);
        expect(activeAfterArchive.find((i) => i.id === created.id)).toBeUndefined();

        const availableAfterArchive = await store.getAvailableMenu(slug);
        expect(
          availableAfterArchive.find((i) => i.id === created.id)
        ).toBeUndefined();

        const archivedList = await store.getArchivedMenu(slug);
        expect(archivedList.find((i) => i.id === created.id)).toBeDefined();

        const restored = await store.restoreMenuItem(slug, created.id);
        expect(restored?.archivedAt).toBeUndefined();
        expect((await store.getMenu(slug)).find((i) => i.id === created.id)).toBeDefined();
      });

      it("rejects invalid create input", async () => {
        await expect(
          store.createMenuItem(slug, { name: "", priceRwf: 100 })
        ).rejects.toThrow();
        await expect(
          store.createMenuItem(slug, { name: "Bad price", priceRwf: 0 })
        ).rejects.toThrow();
      });

      it("getMenuItem returns a single row", async () => {
        const menu = await store.getMenu(slug);
        const item = menu[0];
        const fetched = await store.getMenuItem(slug, item.id);
        expect(fetched?.id).toBe(item.id);
        expect(await store.getMenuItem(slug, "missing-id")).toBeNull();
      });

      it("renameCategory bulk-updates active items", async () => {
        const created = await store.createMenuItem(slug, {
          name: "Rename Me",
          priceRwf: 3000,
          category: "RenameCat",
        });
        const count = await store.renameCategory(slug, "RenameCat", "Renamed");
        expect(count).toBeGreaterThanOrEqual(1);
        const item = await store.getMenuItem(slug, created.id);
        expect(item?.category).toBe("Renamed");
      });

      it("archived items stay on historical orders", async () => {
        const available = await store.getAvailableMenu(slug);
        const target = available[0];
        const order = await store.createOrder({
          vendorSlug: slug,
          customerPhone: "0788000222",
          deliverySector: "Kicukiro",
          landmark: "Archive test",
          items: [{ menuItemId: target.id, quantity: 1 }],
        });

        await store.archiveMenuItem(slug, target.id);
        const fetched = await store.getOrder(order.id);
        expect(fetched?.orderItems[0]?.menuItem?.id).toBe(target.id);
      });
    });

    describe("menu images", () => {
      async function createItemForImages() {
        return store.createMenuItem(slug, {
          name: "Gallery Test Dish",
          priceRwf: 5000,
          category: "Test",
        });
      }

      it("adds URL images with first image primary and dual-writes imageUrl", async () => {
        const item = await createItemForImages();
        const first = await store.addMenuImage(slug, item.id, {
          url: "https://example.com/a.jpg",
        });
        const second = await store.addMenuImage(slug, item.id, {
          url: "https://example.com/b.jpg",
        });

        expect(first.isPrimary).toBe(true);
        expect(second.isPrimary).toBe(false);

        const fetched = await store.getMenuItem(slug, item.id);
        expect(fetched?.images).toHaveLength(2);
        expect(fetched?.imageUrl).toBe("https://example.com/a.jpg");
        expect(fetched?.images?.filter((image) => image.isPrimary)).toHaveLength(
          1
        );
      });

      it("rejects a seventh image", async () => {
        const item = await createItemForImages();
        for (let index = 0; index < 6; index += 1) {
          await store.addMenuImage(slug, item.id, {
            url: `https://example.com/${index}.jpg`,
          });
        }
        await expect(
          store.addMenuImage(slug, item.id, {
            url: "https://example.com/overflow.jpg",
          })
        ).rejects.toThrow(/Maximum 6 images/);
      });

      it("reorders images by sortOrder", async () => {
        const item = await createItemForImages();
        const a = await store.addMenuImage(slug, item.id, {
          url: "https://example.com/a.jpg",
        });
        const b = await store.addMenuImage(slug, item.id, {
          url: "https://example.com/b.jpg",
        });
        const reordered = await store.reorderMenuImages(slug, item.id, [
          b.id,
          a.id,
        ]);
        expect(reordered.map((image) => image.id)).toEqual([b.id, a.id]);
        expect(reordered[0].sortOrder).toBe(0);
        expect(reordered[1].sortOrder).toBe(1);
      });

      it("set-primary updates imageUrl dual-write", async () => {
        const item = await createItemForImages();
        const a = await store.addMenuImage(slug, item.id, {
          url: "https://example.com/a.jpg",
        });
        const b = await store.addMenuImage(slug, item.id, {
          url: "https://example.com/b.jpg",
        });
        await store.setPrimaryMenuImage(slug, item.id, b.id);
        const fetched = await store.getMenuItem(slug, item.id);
        expect(fetched?.imageUrl).toBe("https://example.com/b.jpg");
        expect(fetched?.images?.find((image) => image.id === b.id)?.isPrimary).toBe(
          true
        );
        expect(fetched?.images?.find((image) => image.id === a.id)?.isPrimary).toBe(
          false
        );
      });

      it("removing the primary promotes the next image and clears imageUrl when empty", async () => {
        const item = await createItemForImages();
        const a = await store.addMenuImage(slug, item.id, {
          url: "https://example.com/a.jpg",
        });
        const b = await store.addMenuImage(slug, item.id, {
          url: "https://example.com/b.jpg",
        });
        await store.removeMenuImage(slug, item.id, a.id);
        let fetched = await store.getMenuItem(slug, item.id);
        expect(fetched?.images).toHaveLength(1);
        expect(fetched?.images?.[0].id).toBe(b.id);
        expect(fetched?.images?.[0].isPrimary).toBe(true);
        expect(fetched?.imageUrl).toBe("https://example.com/b.jpg");

        await store.removeMenuImage(slug, item.id, b.id);
        fetched = await store.getMenuItem(slug, item.id);
        expect(fetched?.images ?? []).toHaveLength(0);
        expect(fetched?.imageUrl).toBeUndefined();
      });

      it("uploadMenuImageBlob stores blobPath", async () => {
        const item = await createItemForImages();
        const buffer = Buffer.from("fake-image-bytes");
        const uploaded = await store.uploadMenuImageBlob(
          slug,
          item.id,
          buffer,
          "image/png"
        );
        expect(uploaded.blobPath).toBeTruthy();
        expect(uploaded.url).toContain(uploaded.blobPath!);
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

    describe("order history filters", () => {
      it("returns paginated orders newest-first with default page size", async () => {
        const page1 = await store.listOrdersFiltered(slug, {}, { page: 1, pageSize: 0 });
        expect(page1.pageSize).toBe(DEFAULT_ORDER_HISTORY_PAGE_SIZE);
        expect(page1.total).toBeGreaterThan(0);
        expect(page1.orders.length).toBeLessThanOrEqual(page1.pageSize);

        if (page1.orders.length >= 2) {
          const first = page1.orders[0].order.createdAt.getTime();
          const second = page1.orders[1].order.createdAt.getTime();
          expect(first).toBeGreaterThanOrEqual(second);
        }
      });

      it("filters by order status", async () => {
        const created = await placeOrderFromMenu();
        await store.updateOrderStatus(created.id, "COMPLETED");

        const completed = await store.listOrdersFiltered(
          slug,
          { status: "COMPLETED" },
          { page: 1, pageSize: 50 }
        );
        expect(
          completed.orders.some((row) => row.order.id === created.id)
        ).toBe(true);

        const pending = await store.listOrdersFiltered(
          slug,
          { status: "PENDING" },
          { page: 1, pageSize: 50 }
        );
        expect(
          pending.orders.some((row) => row.order.id === created.id)
        ).toBe(false);
      });

      it("filters by payment status via Payment join", async () => {
        const order = await placeOrderFromMenu();
        const ref = `hist_${Date.now()}`;
        const payment = await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });
        expect(payment.ok).toBe(true);

        const pending = await store.listOrdersFiltered(
          slug,
          { paymentStatus: "PENDING" },
          { page: 1, pageSize: 50 }
        );
        expect(pending.orders.some((row) => row.order.id === order.id)).toBe(
          true
        );

        const confirmed = await store.confirmPayment(ref, MOMO_SIM_VALID_PIN);
        expect(confirmed.ok).toBe(true);

        const success = await store.listOrdersFiltered(
          slug,
          { paymentStatus: "SUCCESS" },
          { page: 1, pageSize: 50 }
        );
        expect(success.orders.some((row) => row.order.id === order.id)).toBe(
          true
        );
      });

      it("searches by phone fragment and order id", async () => {
        const created = await store.createOrder({
          vendorSlug: slug,
          customerPhone: "0788999777",
          deliverySector: "Kicukiro",
          landmark: "Search landmark",
          items: [{ menuItemId: (await store.getAvailableMenu(slug))[0].id, quantity: 1 }],
        });

        const byPhone = await store.listOrdersFiltered(
          slug,
          { search: "9977" },
          { page: 1, pageSize: 20 }
        );
        expect(byPhone.orders.some((row) => row.order.id === created.id)).toBe(
          true
        );

        const byId = await store.listOrdersFiltered(
          slug,
          { search: created.id },
          { page: 1, pageSize: 20 }
        );
        expect(byId.orders.some((row) => row.order.id === created.id)).toBe(
          true
        );
      });

      it("applies today preset to seeded recent orders", async () => {
        const today = await store.listOrdersFiltered(
          slug,
          { datePreset: "today" },
          { page: 1, pageSize: 50 }
        );
        expect(today.total).toBeGreaterThan(0);
      });

      it("paginates with correct total and slice", async () => {
        const baseline = await store.listOrders(slug);
        for (let i = 0; i < 3; i++) {
          await placeOrderFromMenu();
        }

        const pageSize = 2;
        const page1 = await store.listOrdersFiltered(
          slug,
          {},
          { page: 1, pageSize }
        );
        expect(page1.orders.length).toBe(pageSize);
        expect(page1.total).toBe(baseline.length + 3);

        const page2 = await store.listOrdersFiltered(
          slug,
          {},
          { page: 2, pageSize }
        );
        expect(page2.page).toBe(2);
        expect(page1.orders[0].order.id).not.toBe(page2.orders[0]?.order.id);
      });

      it("returns empty results for an unknown vendor", async () => {
        const result = await store.listOrdersFiltered(
          "missing-vendor",
          {},
          { page: 1, pageSize: 20 }
        );
        expect(result.total).toBe(0);
        expect(result.orders).toEqual([]);
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

/**
 * Payment/idempotency contract — issue 01 runs this against the in-memory adapter
 * only; issue 02 wires the same suite into the Prisma integration tests.
 */
export function runPaymentContract(
  name: string,
  createStore: () => ResettableStore
): void {
  describe(`Payment contract: ${name}`, () => {
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

    function uniqueRef() {
      return `ref_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

    describe("createPayment", () => {
      it("creates a PENDING Payment retrievable by ref", async () => {
        const order = await placeOrderFromMenu();
        const ref = uniqueRef();

        const created = await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });

        expect(created.ok).toBe(true);
        if (!created.ok) return;

        expect(created.payment.status).toBe("PENDING");
        expect(created.payment.transactionRef).toBe(ref);
        expect(created.payment.orderId).toBe(order.id);

        const fetched = await store.getPaymentByRef(ref);
        expect(fetched?.transactionRef).toBe(ref);
        expect(fetched?.status).toBe("PENDING");
      });

      it("reuses an existing PENDING Payment for the same order (idempotent STK push)", async () => {
        const order = await placeOrderFromMenu();
        const firstRef = uniqueRef();

        const first = await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: firstRef,
        });
        expect(first.ok).toBe(true);
        if (!first.ok) return;

        const secondRef = uniqueRef();
        const second = await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: secondRef,
        });

        expect(second.ok).toBe(true);
        if (!second.ok) return;
        expect(second.payment.transactionRef).toBe(first.payment.transactionRef);
        expect(second.payment.id).toBe(first.payment.id);
      });

      it("reuses an existing SUCCESS Payment for the same order (idempotent STK push after pay)", async () => {
        const order = await placeOrderFromMenu();
        const ref = uniqueRef();

        const first = await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });
        expect(first.ok).toBe(true);
        if (!first.ok) return;

        await store.confirmPayment(ref, MOMO_SIM_VALID_PIN);

        const secondRef = uniqueRef();
        const second = await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: secondRef,
        });

        expect(second.ok).toBe(true);
        if (!second.ok) return;
        expect(second.payment.status).toBe("SUCCESS");
        expect(second.payment.transactionRef).toBe(first.payment.transactionRef);
      });
    });

    describe("confirmPayment idempotency", () => {
      it("marks the Order PAID once and leaves today's gross unchanged on repeat confirm", async () => {
        const baseline = await store.getTodayGross(slug);
        const order = await placeOrderFromMenu();
        const ref = uniqueRef();

        const created = await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });
        expect(created.ok).toBe(true);
        if (!created.ok) return;

        const first = await store.confirmPayment(ref, MOMO_SIM_VALID_PIN);
        expect(first.ok).toBe(true);
        if (!first.ok) return;
        expect(first.payment.status).toBe("SUCCESS");

        const paid = await store.getOrder(order.id);
        expect(paid?.status).toBe("PAID");
        expect(await store.getTodayGross(slug)).toBe(
          baseline + order.totalAmount
        );

        const second = await store.confirmPayment(ref, MOMO_SIM_VALID_PIN);
        expect(second.ok).toBe(true);
        if (!second.ok) return;
        expect(second.payment.status).toBe("SUCCESS");
        expect(await store.getTodayGross(slug)).toBe(
          baseline + order.totalAmount
        );
      });

      it("keeps Payment PENDING on invalid PIN and does not mark the Order PAID", async () => {
        const order = await placeOrderFromMenu();
        const ref = uniqueRef();

        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });

        const result = await store.confirmPayment(ref, "wrong-pin");
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.code).toBe("INVALID_PIN");
        expect(result.payment?.status).toBe("PENDING");

        const unpaid = await store.getOrder(order.id);
        expect(unpaid?.status).toBe("PENDING");
      });

      it("fails cleanly for an unknown ref without throwing", async () => {
        const result = await store.confirmPayment(uniqueRef(), MOMO_SIM_VALID_PIN);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.code).toBe("NOT_FOUND");
      });
    });
  });
}
