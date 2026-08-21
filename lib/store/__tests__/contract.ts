import { beforeEach, describe, expect, it } from "vitest";
import type { ResettableStore } from "@/lib/store/types";
import { DEMO_VENDOR_SLUG } from "@/lib/store/seed-data";
import { MOMO_SIM_VALID_PIN } from "@/lib/momo/constants";
import { manualPaymentRef } from "@/lib/momo/ussd-dial";
import { DEFAULT_ORDER_HISTORY_PAGE_SIZE } from "@/lib/orders/history-filters";
import { mintOwnerToken } from "@/lib/vendor/owner-token";

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

      it("resolves only supplied stable Vendor IDs with current slug and availability", async () => {
        const first = await store.createVendor({
          name: "Saved One",
          slug: "saved-one-old",
          phoneNumber: "0788000001",
          momoCode: "SAVE001",
        });
        const second = await store.createVendor({
          name: "Saved Two",
          slug: "saved-two",
          phoneNumber: "0788000002",
          momoCode: "SAVE002",
        });
        await store.updateVendor(first.slug, { slug: "saved-one-new" });
        await store.setVendorActive(second.slug, false, "contract test");

        expect(
          await store.resolvePublicRestaurants([
            second.id,
            "missing-vendor",
            first.id,
            first.id,
          ])
        ).toEqual([
          expect.objectContaining({
            vendorId: second.id,
            slug: "saved-two",
            isAvailable: false,
          }),
          expect.objectContaining({
            vendorId: first.id,
            slug: "saved-one-new",
            isAvailable: true,
          }),
        ]);
      });
    });

    describe("vendor provision", () => {
      it("isSlugAvailable is true for unused slugs and false for the seed slug", async () => {
        expect(await store.isSlugAvailable("brand-new-slug")).toBe(true);
        expect(await store.isSlugAvailable(slug)).toBe(false);
        expect(await store.isSlugAvailable("INKA-STEAKHOUSE")).toBe(false);
      });

      it("isSlugAvailable rejects reserved route/marketing slugs (ADR-0049)", async () => {
        expect(await store.isSlugAvailable("ops")).toBe(false);
        expect(await store.isSlugAvailable("vendor")).toBe(false);
        expect(await store.isSlugAvailable("onboard")).toBe(false);
        expect(await store.isSlugAvailable("restaurants")).toBe(false);
        expect(await store.isSlugAvailable("pricing")).toBe(false);
      });

      it("createVendor persists required fields and round-trips via getVendorBySlug", async () => {
        const created = await store.createVendor({
          name: "Test Bistro",
          slug: "test-bistro-contract",
          phoneNumber: "0788999000",
          momoCode: "TEST001",
        });

        expect(created.name).toBe("Test Bistro");
        expect(created.slug).toBe("test-bistro-contract");
        expect(created.phoneNumber).toBe("0788999000");
        expect(created.momoCode).toBe("TEST001");
        expect(created.isActive).toBe(true);
        expect(typeof created.id).toBe("string");
        expect(created.id.length).toBeGreaterThan(0);
        expect(created.createdAt).toBeInstanceOf(Date);

        const fetched = await store.getVendorBySlug("test-bistro-contract");
        expect(fetched?.id).toBe(created.id);
        expect(fetched?.name).toBe("Test Bistro");
      });

      it("createVendor rejects a duplicate slug", async () => {
        await store.createVendor({
          name: "Dup One",
          slug: "dup-slug-test",
          phoneNumber: "0788111111",
          momoCode: "DUP001",
        });

        await expect(
          store.createVendor({
            name: "Dup Two",
            slug: "dup-slug-test",
            phoneNumber: "0788222222",
            momoCode: "DUP002",
          })
        ).rejects.toThrow(/Slug already taken/);
      });

      it("updateVendor patches tagline and location without changing slug", async () => {
        const created = await store.createVendor({
          name: "Update Test",
          slug: "update-test-vendor",
          phoneNumber: "0788333333",
          momoCode: "UPD001",
        });

        const updated = await store.updateVendor(created.slug, {
          tagline: "Fresh tagline",
          location: "Musanze",
        });
        expect(updated?.tagline).toBe("Fresh tagline");
        expect(updated?.location).toBe("Musanze");
        expect(updated?.slug).toBe(created.slug);

        const fetched = await store.getVendorBySlug(created.slug);
        expect(fetched?.tagline).toBe("Fresh tagline");
        expect(fetched?.location).toBe("Musanze");
      });

      it("updateVendor returns null for an unknown slug", async () => {
        expect(
          await store.updateVendor("no-such-vendor", { tagline: "x" })
        ).toBeNull();
      });

      it("createVendor persists onboarding fields and defaults payoutMethod", async () => {
        const withoutPayout = await store.createVendor({
          name: "Category Cafe",
          slug: "category-cafe",
          phoneNumber: "0788444444",
          momoCode: "CAT001",
          businessCategory: "Cafe",
          description: "Cozy corner cafe",
        });
        expect(withoutPayout.businessCategory).toBe("Cafe");
        expect(withoutPayout.description).toBe("Cozy corner cafe");
        expect(withoutPayout.payoutMethod).toBe("MERCHANT_CODE");

        const withPhone = await store.createVendor({
          name: "Phone Payout Grill",
          slug: "phone-payout-grill",
          phoneNumber: "0788555555",
          momoCode: "PHN001",
          payoutMethod: "PHONE",
        });
        expect(withPhone.payoutMethod).toBe("PHONE");

        const fetched = await store.getVendorBySlug("category-cafe");
        expect(fetched?.businessCategory).toBe("Cafe");
        expect(fetched?.payoutMethod).toBe("MERCHANT_CODE");
      });

      it("updateVendor patches logo, cover, description, and payoutMethod", async () => {
        const created = await store.createVendor({
          name: "Profile Fields Vendor",
          slug: "profile-fields-vendor",
          phoneNumber: "0788666666",
          momoCode: "PFV001",
        });

        const updated = await store.updateVendor(created.slug, {
          logoUrl: "https://cdn.example.com/logo.png",
          coverImageUrl: "https://cdn.example.com/cover.png",
          description: "Now with a description",
          payoutMethod: "PHONE",
        });
        expect(updated?.logoUrl).toBe("https://cdn.example.com/logo.png");
        expect(updated?.coverImageUrl).toBe("https://cdn.example.com/cover.png");
        expect(updated?.description).toBe("Now with a description");
        expect(updated?.payoutMethod).toBe("PHONE");

        const fetched = await store.getVendorBySlug(created.slug);
        expect(fetched?.logoUrl).toBe("https://cdn.example.com/logo.png");
        expect(fetched?.payoutMethod).toBe("PHONE");
      });

      it("updateVendor renames slug when the new slug is available", async () => {
        const created = await store.createVendor({
          name: "Rename Vendor",
          slug: "rename-vendor-a",
          phoneNumber: "0788777777",
          momoCode: "REN001",
        });

        const updated = await store.updateVendor(created.slug, {
          slug: "rename-vendor-b",
        });
        expect(updated?.slug).toBe("rename-vendor-b");
        expect(await store.getVendorBySlug("rename-vendor-a")).toBeNull();
        expect(await store.getVendorBySlug("rename-vendor-b")).not.toBeNull();
      });

      it("updateVendor throws when renaming to a taken slug", async () => {
        await store.createVendor({
          name: "Holder",
          slug: "slug-holder",
          phoneNumber: "0788888881",
          momoCode: "HLD001",
        });
        const target = await store.createVendor({
          name: "Target",
          slug: "slug-target",
          phoneNumber: "0788888882",
          momoCode: "TGT001",
        });

        await expect(
          store.updateVendor(target.slug, { slug: "slug-holder" })
        ).rejects.toThrow(/Slug already taken/);
      });
    });

    describe("owner token", () => {
      it("stores an owner-token hash at create and reads it back without leaking on Vendor", async () => {
        const minted = mintOwnerToken();
        const created = await store.createVendor({
          name: "Token Vendor",
          slug: "token-vendor",
          phoneNumber: "0788777777",
          momoCode: "TKN001",
          ownerTokenHash: minted.hash,
        });

        // The hash must never appear on the domain Vendor returned to callers.
        expect(
          (created as unknown as Record<string, unknown>).ownerTokenHash
        ).toBeUndefined();

        expect(await store.getVendorOwnerTokenHash("token-vendor")).toBe(
          minted.hash
        );
      });

      it("setVendorOwnerToken re-issues (rotates) the stored hash", async () => {
        const first = mintOwnerToken();
        await store.createVendor({
          name: "Rotate Vendor",
          slug: "rotate-vendor",
          phoneNumber: "0788888888",
          momoCode: "ROT001",
          ownerTokenHash: first.hash,
        });
        expect(await store.getVendorOwnerTokenHash("rotate-vendor")).toBe(
          first.hash
        );

        const second = mintOwnerToken();
        const rotated = await store.setVendorOwnerToken(
          "rotate-vendor",
          second.hash
        );
        expect(rotated?.slug).toBe("rotate-vendor");
        expect(
          (rotated as unknown as Record<string, unknown>).ownerTokenHash
        ).toBeUndefined();
        expect(await store.getVendorOwnerTokenHash("rotate-vendor")).toBe(
          second.hash
        );
      });

      it("returns null hash for an unknown vendor and null when rotating one", async () => {
        expect(await store.getVendorOwnerTokenHash("nope-vendor")).toBeNull();
        expect(
          await store.setVendorOwnerToken("nope-vendor", "deadbeef")
        ).toBeNull();
      });

      it("the seeded demo vendor has an owner-token hash", async () => {
        expect(await store.getVendorOwnerTokenHash(slug)).toBeTruthy();
      });
    });

    describe("recovery events", () => {
      it("records and lists recovery events newest-first", async () => {
        const vendor = await store.getVendorBySlug(slug);
        expect(vendor).not.toBeNull();
        const vendorId = vendor!.id;

        expect(await store.listRecoveryEvents(vendorId)).toEqual([]);

        const first = await store.recordRecoveryEvent({
          vendorId,
          context: "first recovery",
        });
        expect(first.vendorId).toBe(vendorId);
        expect(first.context).toBe("first recovery");
        expect(first.at).toBeInstanceOf(Date);

        const second = await store.recordRecoveryEvent({ vendorId });

        const events = await store.listRecoveryEvents(vendorId);
        expect(events).toHaveLength(2);
        expect(events.map((e) => e.id)).toContain(first.id);
        expect(events.map((e) => e.id)).toContain(second.id);
        // Newest-first ordering.
        expect(events[0].at.getTime()).toBeGreaterThanOrEqual(
          events[1].at.getTime()
        );
      });

      it("returns an empty list for a vendor with no recovery events", async () => {
        expect(await store.listRecoveryEvents("unknown-vendor-id")).toEqual([]);
      });
    });

    describe("operator console", () => {
      it("lists vendors including the seed vendor", async () => {
        const vendors = await store.listVendors();
        expect(vendors.some((v) => v.slug === slug)).toBe(true);
      });

      it("suspends a vendor and blocks new orders", async () => {
        await store.setVendorActive(slug, false, "test");
        const vendor = await store.getVendorBySlug(slug);
        expect(vendor?.isActive).toBe(false);

        await expect(
          store.createOrder({
            vendorSlug: slug,
            customerPhone: "0788000111",
            deliverySector: "Kicukiro",
            landmark: "Blocked",
            items: [{ menuItemId: (await store.getAvailableMenu(slug))[0].id, quantity: 1 }],
          })
        ).rejects.toThrow(/unavailable/i);

        await store.setVendorActive(slug, true);
      });

      it("records operator actions", async () => {
        const vendor = await store.getVendorBySlug(slug);
        expect(vendor).not.toBeNull();
        const action = await store.recordOperatorAction({
          vendorId: vendor!.id,
          action: "TEST",
          detail: '{"ok":true}',
        });
        expect(action.action).toBe("TEST");
        const audit = await store.listOperatorActions(slug);
        expect(audit.some((row) => row.id === action.id)).toBe(true);
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

    describe("inventory", () => {
      it("creates a supply item without adding a Menu dish", async () => {
        const menuBefore = await store.getMenu(slug);

        const created = await store.createInventoryItem(slug, {
          name: "Rice",
          quantity: 3,
          unit: "bags",
          lowStockThreshold: 1,
          category: "Ingredients",
        });

        const inventory = await store.listInventory(
          slug,
          {},
          { page: 1, pageSize: 10 }
        );

        expect(created.name).toBe("Rice");
        expect(created.quantity).toBe(3);
        expect(inventory.items.map((item) => item.id)).toContain(created.id);
        expect(await store.getMenu(slug)).toEqual(menuBefore);
      });

      it("records immutable quantity history and rejects stock below zero", async () => {
        const item = await store.createInventoryItem(slug, {
          name: "Tomato sauce",
          quantity: 12,
          unit: "bottles",
          lowStockThreshold: 3,
          category: "Ingredients",
        });

        await store.adjustInventoryItem(slug, item.id, {
          type: "RECEIVED",
          quantity: 4,
          note: "Supplier delivery",
        });
        await store.adjustInventoryItem(slug, item.id, {
          type: "USED",
          quantity: 5,
        });
        await store.adjustInventoryItem(slug, item.id, {
          type: "WASTED",
          quantity: 2,
        });
        await store.adjustInventoryItem(slug, item.id, {
          type: "CORRECTION",
          quantity: 10.5,
          note: "Counted by hand",
        });

        const detail = await store.getInventoryItem(slug, item.id);
        expect(detail?.item.quantity).toBe(10.5);
        expect(detail?.history.map((entry) => entry.type)).toEqual([
          "CORRECTION",
          "WASTED",
          "USED",
          "RECEIVED",
          "CORRECTION",
        ]);
        expect(detail?.history.at(-1)).toMatchObject({
          oldQuantity: 0,
          newQuantity: 12,
          note: "Opening quantity",
        });

        await expect(
          store.adjustInventoryItem(slug, item.id, {
            type: "USED",
            quantity: 11,
          })
        ).rejects.toThrow(/below zero/i);
        expect((await store.getInventoryItem(slug, item.id))?.item.quantity).toBe(10.5);
      });

      it("edits descriptive fields and archives/restores without losing history", async () => {
        const created = await store.createInventoryItem(slug, {
          name: "Takeaway boxes",
          quantity: 50,
          unit: "boxes",
          lowStockThreshold: 10,
          category: "Packaging",
        });
        await store.adjustInventoryItem(slug, created.id, {
          type: "USED",
          quantity: 5,
        });

        const updated = await store.updateInventoryItem(slug, created.id, {
          name: "Large takeaway boxes",
          unit: "custom",
          customUnit: "cartons",
          category: "Other",
          lowStockThreshold: 8,
          unitCostRwf: 1200,
          note: "Keep dry",
        });
        expect(updated?.item).toMatchObject({
          name: "Large takeaway boxes",
          unit: "cartons",
          category: "Other",
          quantity: 45,
          unitCostRwf: 1200,
        });

        expect((await store.archiveInventoryItem(slug, created.id))?.item.archivedAt).toBeInstanceOf(Date);
        expect((await store.listInventory(slug, {}, { page: 1, pageSize: 10 })).total).toBe(0);
        expect((await store.listInventory(slug, { archived: true }, { page: 1, pageSize: 10 })).total).toBe(1);

        const restored = await store.restoreInventoryItem(slug, created.id);
        expect(restored?.item.archivedAt).toBeUndefined();
        expect(restored?.history).toHaveLength(2);
      });

      it("filters, status-sorts, counts, paginates ten at a time, and clamps empty pages", async () => {
        const rows = [
          ["Zulu out", 0, "Ingredients"],
          ["Alpha low", 2, "Ingredients"],
          ["Bravo okay", 8, "Drinks"],
          ["Charlie", 8, "Packaging"],
          ["Delta", 8, "Cleaning"],
          ["Echo", 8, "Other"],
          ["Foxtrot", 8, "Other"],
          ["Golf", 8, "Other"],
          ["Hotel", 8, "Other"],
          ["India", 8, "Other"],
          ["Juliet", 8, "Other"],
        ] as const;
        for (const [name, quantity, category] of rows) {
          await store.createInventoryItem(slug, {
            name,
            quantity,
            unit: "pieces",
            lowStockThreshold: 3,
            category,
          });
        }

        const first = await store.listInventory(slug, {}, { page: 1, pageSize: 10 });
        expect(first.items).toHaveLength(10);
        expect(first.items.slice(0, 3).map((item) => item.name)).toEqual([
          "Zulu out",
          "Alpha low",
          "Bravo okay",
        ]);
        expect(first.counts).toEqual({ active: 11, low: 1, out: 1 });

        const second = await store.listInventory(slug, {}, { page: 2, pageSize: 10 });
        expect(second.items).toHaveLength(1);
        expect(second.total).toBe(11);

        const filtered = await store.listInventory(
          slug,
          { category: "Ingredients", search: "alpha" },
          { page: 99, pageSize: 10 }
        );
        expect(filtered.page).toBe(1);
        expect(filtered.items.map((item) => item.name)).toEqual(["Alpha low"]);
      });

      it("accepts decimal quantities and custom units while rejecting invalid fields", async () => {
        const created = await store.createInventoryItem(slug, {
          name: "Cooking oil",
          quantity: 2.75,
          unit: "custom",
          customUnit: "jerrycans",
          lowStockThreshold: 0.5,
          category: "Ingredients",
          unitCostRwf: 18_000,
        });
        expect(created).toMatchObject({ quantity: 2.75, unit: "jerrycans" });

        await expect(
          store.createInventoryItem(slug, {
            name: "Bad quantity",
            quantity: -1,
            unit: "pieces",
            lowStockThreshold: 0,
            category: "Other",
          })
        ).rejects.toThrow(/quantity/i);
        await expect(
          store.createInventoryItem(slug, {
            name: "Missing custom unit",
            quantity: 1,
            unit: "custom",
            lowStockThreshold: 0,
            category: "Other",
          })
        ).rejects.toThrow(/custom unit/i);
        await expect(
          store.createInventoryItem(slug, {
            name: "Too precise",
            quantity: 1.2345,
            unit: "kg",
            lowStockThreshold: 0,
            category: "Ingredients",
          })
        ).rejects.toThrow(/3 decimal/i);
        await expect(
          store.createInventoryItem(slug, {
            name: "Fractional RWF",
            quantity: 1,
            unit: "pieces",
            lowStockThreshold: 0,
            category: "Other",
            unitCostRwf: 10.5,
          })
        ).rejects.toThrow(/unit cost/i);
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

      it("persists special-instructions notes on order line items", async () => {
        const available = await store.getAvailableMenu(slug);
        const item = available[0];

        const created = await store.createOrder({
          vendorSlug: slug,
          customerPhone: "0788000111",
          deliverySector: "Kicukiro",
          landmark: "Test landmark",
          items: [
            {
              menuItemId: item.id,
              quantity: 2,
              notes: "  No onions please  ",
            },
          ],
        });

        expect(created.orderItems[0]?.notes).toBe("No onions please");

        const fetched = await store.getOrder(created.id);
        expect(fetched?.orderItems[0]?.notes).toBe("No onions please");

        const kdsOrders = await store.listKdsOrders(slug);
        const onKds = kdsOrders.find((o) => o.id === created.id);
        expect(onKds).toBeUndefined();

        await store.updateOrderStatus(created.id, "PAID");
        const visible = await store.listKdsOrders(slug);
        expect(
          visible.find((o) => o.id === created.id)?.orderItems[0]?.notes
        ).toBe("No onions please");
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

      it("sets kitchenStage NEW and paidAt when an order becomes PAID", async () => {
        const created = await placeOrderFromMenu();
        expect(created.kitchenStage).toBeUndefined();
        expect(created.paidAt).toBeUndefined();

        const paid = await store.updateOrderStatus(created.id, "PAID");
        expect(paid?.status).toBe("PAID");
        expect(paid?.kitchenStage).toBe("NEW");
        expect(paid?.paidAt).toBeInstanceOf(Date);

        const repeat = await store.updateOrderStatus(created.id, "PAID");
        expect(repeat?.paidAt?.getTime()).toBe(paid?.paidAt?.getTime());
      });

      it("syncs kitchenStage when advancing status to DISPATCHED or COMPLETED", async () => {
        const created = await placeOrderFromMenu();
        await store.updateOrderStatus(created.id, "PAID");

        const dispatched = await store.updateOrderStatus(created.id, "DISPATCHED");
        expect(dispatched?.kitchenStage).toBe("OUT_FOR_DELIVERY");

        const completed = await store.updateOrderStatus(
          created.id,
          "COMPLETED"
        );
        expect(completed?.kitchenStage).toBe("COMPLETED");
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

    describe("yesterday's gross", () => {
      it("does not include today's paid orders", async () => {
        const yesterdayBaseline = await store.getYesterdayGross(slug);
        const todayBaseline = await store.getTodayGross(slug);

        const created = await placeOrderFromMenu();
        await store.updateOrderStatus(created.id, "PAID");

        expect(await store.getYesterdayGross(slug)).toBe(yesterdayBaseline);
        expect(await store.getTodayGross(slug)).toBe(
          todayBaseline + created.totalAmount
        );
      });

      it("uses the same counted statuses as today's gross", async () => {
        const baseline = await store.getYesterdayGross(slug);
        const created = await placeOrderFromMenu();

        expect(await store.getYesterdayGross(slug)).toBe(baseline);

        await store.updateOrderStatus(created.id, "PAID");
        const todayAfterPay = await store.getTodayGross(slug);
        expect(await store.getYesterdayGross(slug)).toBe(baseline);
        expect(todayAfterPay).toBeGreaterThan(baseline);
      });
    });

    describe("drivers", () => {
      it("lists the seeded drivers for the vendor", async () => {
        const drivers = await store.getDrivers(slug);
        expect(drivers.length).toBeGreaterThan(0);
      });

      it("creates, updates, deletes, and assigns a driver to an order", async () => {
        const created = await store.createDriver(slug, {
          name: "Smoke Driver",
          phone: "0788001122",
        });
        expect(created.name).toBe("Smoke Driver");
        expect(created.initials).toBe("SD");

        const listed = await store.getDrivers(slug);
        expect(listed.some((driver) => driver.id === created.id)).toBe(true);

        const updated = await store.updateDriver(slug, created.id, {
          name: "Smoke Driver Updated",
        });
        expect(updated?.name).toBe("Smoke Driver Updated");

        const order = await placeOrderFromMenu();
        await store.updateOrderStatus(order.id, "PAID");
        await store.updateKitchenStage(order.id, "READY");

        const assigned = await store.assignOrderDriver(order.id, created.id);
        expect(assigned?.driverId).toBe(created.id);
        expect(assigned?.assignedDriver?.name).toBe("Smoke Driver Updated");
        expect(assigned?.kitchenStage).toBe("READY");

        const deleted = await store.deleteDriver(slug, created.id);
        expect(deleted).toBe(true);
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

    describe("kitchen stage", () => {
      it("advances forward through kitchen stages and rejects backward moves", async () => {
        const created = await placeOrderFromMenu();
        await store.updateOrderStatus(created.id, "PAID");

        const accepted = await store.updateKitchenStage(created.id, "ACCEPTED");
        expect(accepted?.kitchenStage).toBe("ACCEPTED");
        expect(accepted?.status).toBe("PAID");

        const preparing = await store.updateKitchenStage(
          created.id,
          "PREPARING"
        );
        expect(preparing?.kitchenStage).toBe("PREPARING");

        const backward = await store.updateKitchenStage(created.id, "NEW");
        expect(backward).toBeNull();

        const stillPreparing = await store.getOrder(created.id);
        expect(stillPreparing?.kitchenStage).toBe("PREPARING");
      });

      it("jumps forward to a later stage in one action", async () => {
        const created = await placeOrderFromMenu();
        await store.updateOrderStatus(created.id, "PAID");

        const ready = await store.updateKitchenStage(created.id, "READY");
        expect(ready?.kitchenStage).toBe("READY");
        expect(ready?.status).toBe("PAID");
      });

      it("sets DISPATCHED when kitchen stage becomes OUT_FOR_DELIVERY", async () => {
        const created = await placeOrderFromMenu();
        await store.updateOrderStatus(created.id, "PAID");

        const out = await store.updateKitchenStage(
          created.id,
          "OUT_FOR_DELIVERY"
        );
        expect(out?.kitchenStage).toBe("OUT_FOR_DELIVERY");
        expect(out?.status).toBe("DISPATCHED");
      });

      it("sets COMPLETED when kitchen stage becomes COMPLETED", async () => {
        const created = await placeOrderFromMenu();
        await store.updateOrderStatus(created.id, "PAID");
        await store.updateKitchenStage(created.id, "READY");

        const done = await store.updateKitchenStage(created.id, "COMPLETED");
        expect(done?.kitchenStage).toBe("COMPLETED");
        expect(done?.status).toBe("COMPLETED");
      });

      it("bulk updates only orders that can advance to the target stage", async () => {
        const first = await placeOrderFromMenu();
        const second = await placeOrderFromMenu();
        await store.updateOrderStatus(first.id, "PAID");
        await store.updateOrderStatus(second.id, "PAID");
        await store.updateKitchenStage(second.id, "READY");

        const updated = await store.bulkUpdateKitchenStage(
          [first.id, second.id, "missing"],
          "PREPARING"
        );
        expect(updated).toHaveLength(1);
        expect(updated[0].id).toBe(first.id);
        expect(updated[0].kitchenStage).toBe("PREPARING");

        const skipped = await store.getOrder(second.id);
        expect(skipped?.kitchenStage).toBe("READY");
      });

      it("confirmPayment sets kitchenStage NEW and paidAt", async () => {
        const order = await placeOrderFromMenu();
        const ref = `stage_${Date.now()}`;
        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });

        const confirmed = await store.confirmPayment(ref, MOMO_SIM_VALID_PIN);
        expect(confirmed.ok).toBe(true);
        if (!confirmed.ok) return;

        const paid = await store.getOrder(order.id);
        expect(paid?.status).toBe("PAID");
        expect(paid?.kitchenStage).toBe("NEW");
        expect(paid?.paidAt).toBeInstanceOf(Date);
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

    describe("lead capture", () => {
      it("creates and lists a canonical WhatsApp routing recipient", async () => {
        expect(await store.listLeadRoutingRecipients()).toEqual([]);

        const created = await store.createLeadRoutingRecipient({
          name: "Primary operator",
          phone: "+250 784 928 786",
          enabled: true,
        });

        expect(created).toMatchObject({
          name: "Primary operator",
          phone: "250784928786",
          enabled: true,
        });
        expect(created.id).toEqual(expect.any(String));
        expect(created.createdAt).toBeInstanceOf(Date);
        expect(created.updatedAt).toBeInstanceOf(Date);
        expect(await store.listLeadRoutingRecipients()).toEqual([created]);
      });

      it("rejects a duplicate active WhatsApp recipient", async () => {
        await store.createLeadRoutingRecipient({
          name: "Primary operator",
          phone: "0784 928 786",
          enabled: true,
        });

        await expect(
          store.createLeadRoutingRecipient({
            name: "Duplicate operator",
            phone: "+250 784 928 786",
            enabled: false,
          })
        ).rejects.toThrow("already exists");
      });

      it("edits and independently disables a routing recipient", async () => {
        const created = await store.createLeadRoutingRecipient({
          name: "Primary operator",
          phone: "0784 928 786",
          enabled: true,
        });

        const updated = await store.updateLeadRoutingRecipient(created.id, {
          name: "Kigali operator",
          phone: "+250 784 928 786",
          enabled: false,
        });

        expect(updated).toMatchObject({
          id: created.id,
          name: "Kigali operator",
          phone: "250784928786",
          enabled: false,
        });
        expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
          created.updatedAt.getTime()
        );
        expect(
          await store.updateLeadRoutingRecipient("missing-recipient", {
            enabled: true,
          })
        ).toBeNull();
      });

      it("rejects editing a recipient to another active WhatsApp number", async () => {
        const first = await store.createLeadRoutingRecipient({
          name: "First operator",
          phone: "0784 928 786",
          enabled: true,
        });
        const second = await store.createLeadRoutingRecipient({
          name: "Second operator",
          phone: "0788 000 222",
          enabled: true,
        });

        await expect(
          store.updateLeadRoutingRecipient(second.id, { phone: first.phone })
        ).rejects.toThrow("already exists");
      });

      it("removes a routing recipient from future configuration", async () => {
        const created = await store.createLeadRoutingRecipient({
          name: "Temporary operator",
          phone: "0788 000 111",
          enabled: false,
        });

        expect(await store.removeLeadRoutingRecipient(created.id)).toBe(true);
        expect(await store.listLeadRoutingRecipients()).toEqual([]);
        expect(await store.removeLeadRoutingRecipient(created.id)).toBe(false);
      });

      it("assigns a persisted Lead to one enabled recipient and records a snapshot", async () => {
        const recipient = await store.createLeadRoutingRecipient({
          name: "Primary operator",
          phone: "0784 928 786",
          enabled: true,
        });
        await store.createLeadRoutingRecipient({
          name: "Unavailable operator",
          phone: "0788 000 222",
          enabled: false,
        });
        const lead = await store.createLead({
          businessName: "Assigned Cafe",
          businessType: "Cafe",
          contactName: "Grace",
          phone: "0788 123 456",
          area: "Kigali",
          consentAt: new Date(),
        });

        const assignment = await store.assignLeadRoutingRecipient(lead.id);

        expect(assignment).toMatchObject({
          recipientId: recipient.id,
          recipientName: "Primary operator",
          recipientPhone: "250784928786",
        });
        expect(assignment?.assignedAt).toBeInstanceOf(Date);
        expect((await store.listLeads())[0]?.routingAssignment).toEqual(
          assignment
        );
      });

      it("round-robins enabled recipients and never reassigns the same Lead", async () => {
        const firstRecipient = await store.createLeadRoutingRecipient({
          name: "First operator",
          phone: "0784 928 786",
          enabled: true,
        });
        const secondRecipient = await store.createLeadRoutingRecipient({
          name: "Second operator",
          phone: "0788 000 222",
          enabled: true,
        });
        await store.createLeadRoutingRecipient({
          name: "Disabled operator",
          phone: "0788 000 999",
          enabled: false,
        });

        const leads = await Promise.all(
          ["One", "Two", "Three"].map((businessName, index) =>
            store.createLead({
              businessName,
              businessType: "Restaurant",
              contactName: `Contact ${index}`,
              phone: `07880000${10 + index}`,
              area: "Kigali",
              consentAt: new Date(),
            })
          )
        );

        const assignments = [];
        for (const lead of leads) {
          assignments.push(await store.assignLeadRoutingRecipient(lead.id));
        }

        expect(assignments.map((row) => row?.recipientId)).toEqual([
          firstRecipient.id,
          secondRecipient.id,
          firstRecipient.id,
        ]);
        expect(await store.assignLeadRoutingRecipient(leads[0].id)).toEqual(
          assignments[0]
        );
      });

      it("keeps round-robin balanced when Leads are assigned concurrently", async () => {
        const first = await store.createLeadRoutingRecipient({
          name: "First operator",
          phone: "0784 928 786",
          enabled: true,
        });
        const second = await store.createLeadRoutingRecipient({
          name: "Second operator",
          phone: "0788 000 222",
          enabled: true,
        });
        const leads = await Promise.all(
          Array.from({ length: 12 }, (_, index) =>
            store.createLead({
              businessName: `Concurrent ${index}`,
              businessType: "Restaurant",
              contactName: `Contact ${index}`,
              phone: `078811${String(index).padStart(4, "0")}`,
              area: "Kigali",
              consentAt: new Date(),
            })
          )
        );

        const assignments = await Promise.all(
          leads.map((lead) => store.assignLeadRoutingRecipient(lead.id))
        );
        const counts = assignments.reduce<Record<string, number>>(
          (result, assignment) => {
            if (assignment) {
              result[assignment.recipientId] =
                (result[assignment.recipientId] ?? 0) + 1;
            }
            return result;
          },
          {}
        );

        expect(counts).toEqual({ [first.id]: 6, [second.id]: 6 });
      });

      it("keeps the Lead assignment snapshot after recipient edits and removal", async () => {
        const recipient = await store.createLeadRoutingRecipient({
          name: "Original operator",
          phone: "0784 928 786",
          enabled: true,
        });
        const lead = await store.createLead({
          businessName: "Snapshot Bistro",
          businessType: "Restaurant",
          contactName: "Alice",
          phone: "0788 123 456",
          area: "Kigali",
          consentAt: new Date(),
        });
        const assignment = await store.assignLeadRoutingRecipient(lead.id);

        await store.updateLeadRoutingRecipient(recipient.id, {
          name: "Renamed operator",
          phone: "0788 000 222",
        });
        await store.removeLeadRoutingRecipient(recipient.id);

        expect((await store.listLeads())[0]?.routingAssignment).toEqual(
          assignment
        );
        expect(assignment).toMatchObject({
          recipientName: "Original operator",
          recipientPhone: "250784928786",
        });
      });

      it("creates a NEW lead with a canonical phone and lists it newest-first", async () => {
        const first = await store.createLead({
          businessName: "Kigali Kitchen",
          businessType: "Restaurant",
          contactName: "Aline",
          phone: "0788 123 456",
          area: "Kimihurura",
          message: "Please call after lunch",
          source: "marketing-root",
          consentAt: new Date("2026-08-06T08:00:00.000Z"),
        });
        const second = await store.createLead({
          businessName: "Nyamirambo Grill",
          businessType: "Bar & grill",
          contactName: "Eric",
          phone: "+250 780 123 456",
          area: "Nyamirambo",
          consentAt: new Date("2026-08-06T09:00:00.000Z"),
        });

        expect(first).toMatchObject({
          businessName: "Kigali Kitchen",
          phone: "250788123456",
          status: "NEW",
          message: "Please call after lunch",
          source: "marketing-root",
        });
        expect(first.id).toEqual(expect.any(String));
        expect(first.createdAt).toBeInstanceOf(Date);
        expect(first.consentAt).toEqual(
          new Date("2026-08-06T08:00:00.000Z")
        );

        const leads = await store.listLeads();
        expect(leads.map((lead) => lead.id)).toEqual([second.id, first.id]);
      });

      it("updates a lead's follow-up status and returns null for a missing lead", async () => {
        const created = await store.createLead({
          businessName: "Kacyiru Caterers",
          businessType: "Caterer",
          contactName: "Diane",
          phone: "0788 555 444",
          area: "Kacyiru",
          consentAt: new Date(),
        });

        const contacted = await store.updateLeadStatus(
          created.id,
          "CONTACTED"
        );
        expect(contacted?.status).toBe("CONTACTED");
        expect((await store.listLeads())[0]?.status).toBe("CONTACTED");
        expect(
          await store.updateLeadStatus("missing-lead", "CLOSED")
        ).toBeNull();
      });
    });

    describe("feature flags (ADR-0056)", () => {
      it("vendor created via createVendor defaults all flags false", async () => {
        const vendor = await store.createVendor({
          name: "Flag Test",
          slug: "flag-test-vendor",
          phoneNumber: "0788111222",
          momoCode: "FLG001",
        });
        expect(vendor.featureWhatsappNotify).toBe(false);
        expect(vendor.featureStockTracking).toBe(false);
        expect(vendor.featureProfitInsights).toBe(false);
      });

      it("seeded vendor has flags false", async () => {
        const vendor = await store.getVendorBySlug(slug);
        expect(vendor?.featureWhatsappNotify).toBe(false);
        expect(vendor?.featureStockTracking).toBe(false);
        expect(vendor?.featureProfitInsights).toBe(false);
      });

      it("operatorUpdateVendor can enable feature flags", async () => {
        await store.operatorUpdateVendor(slug, {
          featureWhatsappNotify: true,
          featureStockTracking: true,
        });
        const vendor = await store.getVendorBySlug(slug);
        expect(vendor?.featureWhatsappNotify).toBe(true);
        expect(vendor?.featureStockTracking).toBe(true);
        expect(vendor?.featureProfitInsights).toBe(false);
      });
    });

    describe("stock tracking", () => {
      it("updateMenuItem sets stockCount, lowStockThreshold, costPriceRwf; null clears", async () => {
        const item = await store.createMenuItem(slug, {
          name: "Stock Test Item",
          priceRwf: 5000,
          category: "Test",
        });
        expect(item.stockCount).toBeUndefined();

        const withStock = await store.updateMenuItem(slug, item.id, {
          stockCount: 10,
          lowStockThreshold: 3,
          costPriceRwf: 2000,
        });
        expect(withStock?.stockCount).toBe(10);
        expect(withStock?.lowStockThreshold).toBe(3);
        expect(withStock?.costPriceRwf).toBe(2000);

        const cleared = await store.updateMenuItem(slug, item.id, {
          stockCount: null,
          lowStockThreshold: null,
          costPriceRwf: null,
        });
        expect(cleared?.stockCount).toBeUndefined();
        expect(cleared?.lowStockThreshold).toBeUndefined();
        expect(cleared?.costPriceRwf).toBeUndefined();
      });

      it("payment decrements numeric stock even when the legacy vendor flag is off", async () => {
        await store.operatorUpdateVendor(slug, { featureStockTracking: false });
        const item = (await store.getAvailableMenu(slug))[0];
        await store.updateMenuItem(slug, item.id, { stockCount: 5 });

        const order = await store.createOrder({
          vendorSlug: slug,
          customerPhone: "0788000111",
          deliverySector: "Kicukiro",
          landmark: "Stock test",
          items: [{ menuItemId: item.id, quantity: 2 }],
        });

        const ref = `stock_${Date.now()}`;
        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });
        await store.confirmPayment(ref, MOMO_SIM_VALID_PIN);

        const updated = await store.getMenuItem(slug, item.id);
        expect(updated?.stockCount).toBe(3);
      });

      it("stock decrement floors at 0", async () => {
        const item = (await store.getAvailableMenu(slug))[0];
        await store.updateMenuItem(slug, item.id, { stockCount: 1 });

        const order = await store.createOrder({
          vendorSlug: slug,
          customerPhone: "0788000111",
          deliverySector: "Kicukiro",
          landmark: "Floor test",
          items: [{ menuItemId: item.id, quantity: 3 }],
        });

        const ref = `floor_${Date.now()}`;
        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });
        await store.confirmPayment(ref, MOMO_SIM_VALID_PIN);

        const updated = await store.getMenuItem(slug, item.id);
        expect(updated?.stockCount).toBe(0);
      });

      it("items without stockCount are unchanged on payment", async () => {
        const item = (await store.getAvailableMenu(slug))[0];
        const beforeStock = (await store.getMenuItem(slug, item.id))?.stockCount;

        const order = await store.createOrder({
          vendorSlug: slug,
          customerPhone: "0788000111",
          deliverySector: "Kicukiro",
          landmark: "No-stock test",
          items: [{ menuItemId: item.id, quantity: 1 }],
        });

        const ref = `nostock_${Date.now()}`;
        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });
        await store.confirmPayment(ref, MOMO_SIM_VALID_PIN);

        const updated = await store.getMenuItem(slug, item.id);
        expect(updated?.stockCount).toBe(beforeStock);
      });
    });

    describe("prospects (ADR-0054)", () => {
      it("creates → lists (sorted) → adds interaction → transitions status → converts", async () => {
        const created = await store.createProspect({
          businessName: "Kigali Kitchen",
          contactName: "Alice",
          phone: "0788111222",
          area: "Kimihurura",
          source: "Instagram",
          nextFollowUpAt: new Date("2030-01-15"),
        });
        expect(created.id).toBeTruthy();
        expect(created.status).toBe("FOUND");
        expect(created.businessName).toBe("Kigali Kitchen");
        expect(created.nextFollowUpAt).toEqual(new Date("2030-01-15"));

        const second = await store.createProspect({
          businessName: "Musanze Grill",
          nextFollowUpAt: new Date("2029-12-01"),
        });

        const listed = await store.listProspects();
        expect(listed.length).toBe(2);
        expect(listed[0].id).toBe(second.id);

        const interaction = await store.addProspectInteraction(created.id, {
          channel: "WHATSAPP",
          note: "Sent intro message",
        });
        expect(interaction?.channel).toBe("WHATSAPP");

        const fetched = await store.getProspect(created.id);
        expect(fetched?.interactions).toHaveLength(1);
        expect(fetched?.interactions?.[0].note).toBe("Sent intro message");

        const contacted = await store.updateProspect(created.id, {
          status: "CONTACTED",
        });
        expect(contacted?.status).toBe("CONTACTED");

        await expect(
          store.updateProspect(created.id, { status: "CONVERTED" })
        ).rejects.toThrow(/Invalid status transition/);

        const inTalks = await store.updateProspect(created.id, {
          status: "IN_TALKS",
        });
        expect(inTalks?.status).toBe("IN_TALKS");

        const vendor = await store.getVendorBySlug(slug);
        const converted = await store.convertProspect(
          created.id,
          vendor!.id,
          "lead_xyz"
        );
        expect(converted?.status).toBe("CONVERTED");
        expect(converted?.convertedVendorId).toBe(vendor!.id);
        expect(converted?.convertedLeadId).toBe("lead_xyz");
      });

      it("bulkCreateProspects creates multiple prospects", async () => {
        const results = await store.bulkCreateProspects({
          rows: [
            { businessName: "Bulk A" },
            { businessName: "Bulk B" },
          ],
        });
        expect(results).toHaveLength(2);
        expect(results[0].businessName).toBe("Bulk A");
      });

      it("listProspects filters by status", async () => {
        await store.createProspect({ businessName: "A" });
        const b = await store.createProspect({ businessName: "B" });
        await store.updateProspect(b.id, { status: "CONTACTED" });

        const found = await store.listProspects("FOUND");
        expect(found.every((p) => p.status === "FOUND")).toBe(true);

        const contacted = await store.listProspects("CONTACTED");
        expect(contacted).toHaveLength(1);
        expect(contacted[0].id).toBe(b.id);
      });
    });

    describe("marketing site settings", () => {
      it("round-trips settings upsert", async () => {
        const initial = await store.getMarketingSiteSettings();
        expect(initial.id).toBe("default");

        const updated = await store.updateMarketingSiteSettings({
          publicPhone: "0784928786",
          socialInstagram: "@zantap",
        });
        expect(updated.publicPhone).toBe("0784928786");
        expect(updated.socialInstagram).toBe("@zantap");

        const fetched = await store.getMarketingSiteSettings();
        expect(fetched.publicPhone).toBe("0784928786");

        const cleared = await store.updateMarketingSiteSettings({
          publicPhone: null,
        });
        expect(cleared.publicPhone).toBeUndefined();
      });
    });

    describe("site translations", () => {
      it("upserts, lists, filters by locale, and deletes overrides", async () => {
        await store.upsertSiteTranslation("rw", "hero.headline", "Umutwe mushya");
        await store.upsertSiteTranslation("fr", "hero.headline", "Nouveau titre");

        const rw = await store.listSiteTranslations("rw");
        expect(rw.some((t) => t.key === "hero.headline" && t.value === "Umutwe mushya")).toBe(true);
        expect(rw.every((t) => t.locale === "rw")).toBe(true);

        // Upsert replaces, never duplicates.
        await store.upsertSiteTranslation("rw", "hero.headline", "Umutwe wa kabiri");
        const rwAgain = await store.listSiteTranslations("rw");
        expect(rwAgain.filter((t) => t.key === "hero.headline")).toHaveLength(1);
        expect(rwAgain.find((t) => t.key === "hero.headline")?.value).toBe("Umutwe wa kabiri");

        const all = await store.listSiteTranslations();
        expect(all.length).toBeGreaterThanOrEqual(2);

        expect(await store.deleteSiteTranslation("rw", "hero.headline")).toBe(true);
        expect(await store.deleteSiteTranslation("rw", "hero.headline")).toBe(false);
        const afterDelete = await store.listSiteTranslations("rw");
        expect(afterDelete.some((t) => t.key === "hero.headline")).toBe(false);
      });
    });

    describe("marketing funnel events", () => {
      it("records privacy-minimal events and filters them by date", async () => {
        const created = await store.recordMarketingFunnelEvent({
          sessionId: "session-a",
          event: "cta_click",
          target: "hero-lead-cta",
          locale: "rw",
          path: "/",
          utmSource: "instagram",
        });
        expect(created.id).toBeTruthy();
        const rows = await store.listMarketingFunnelEvents(
          new Date(Date.now() - 60_000)
        );
        expect(rows).toContainEqual(expect.objectContaining({
          sessionId: "session-a",
          event: "cta_click",
          target: "hero-lead-cta",
        }));
        expect(await store.listMarketingFunnelEvents(new Date(Date.now() + 60_000))).toEqual([]);
      });
    });

    describe("vendor expenses", () => {
      it("creates, lists, and deletes expenses", async () => {
        const created = await store.createVendorExpense(slug, {
          amountRwf: 5000,
          category: "Ingredients",
          note: "Tomatoes",
        });
        expect(created.amountRwf).toBe(5000);
        expect(created.category).toBe("Ingredients");

        const listed = await store.listVendorExpenses(slug);
        expect(listed.some((e) => e.id === created.id)).toBe(true);

        const deleted = await store.deleteVendorExpense(slug, created.id);
        expect(deleted).toBe(true);

        const afterDelete = await store.listVendorExpenses(slug);
        expect(afterDelete.some((e) => e.id === created.id)).toBe(false);
      });
    });

    describe("all-time paid revenue", () => {
      it("increases after an order is paid", async () => {
        const baseline = await store.getAllTimePaidRevenue(slug);
        const order = await placeOrderFromMenu();

        expect(await store.getAllTimePaidRevenue(slug)).toBe(baseline);

        const ref = `alltime_${Date.now()}`;
        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });
        await store.confirmPayment(ref, MOMO_SIM_VALID_PIN);

        expect(await store.getAllTimePaidRevenue(slug)).toBe(
          baseline + order.totalAmount
        );
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

    describe("manual MoMo payment (ADR-0033)", () => {
      it("confirmManualPayment marks order PAID with matching phone", async () => {
        const order = await placeOrderFromMenu();
        const ref = manualPaymentRef(order.id);

        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: ref,
        });

        const confirmed = await store.confirmManualPayment(
          order.id,
          order.customerPhone
        );
        expect(confirmed.ok).toBe(true);
        if (!confirmed.ok) return;
        expect(confirmed.payment.status).toBe("SUCCESS");
        expect(confirmed.order.status).toBe("PAID");
      });

      it("abandonManualPayment cancels order and fails payment", async () => {
        const order = await placeOrderFromMenu();
        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: manualPaymentRef(order.id),
        });

        const abandoned = await store.abandonManualPayment(
          order.id,
          order.customerPhone
        );
        expect(abandoned.ok).toBe(true);
        if (!abandoned.ok) return;
        expect(abandoned.payment.status).toBe("FAILED");
        expect(abandoned.order.status).toBe("CANCELLED");
      });

      it("confirmManualPayment rejects phone mismatch", async () => {
        const order = await placeOrderFromMenu();
        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: manualPaymentRef(order.id),
        });

        const result = await store.confirmManualPayment(order.id, "0788000000");
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.code).toBe("PHONE_MISMATCH");
      });

      it("findResumableManualOrder returns pending checkout for same phone", async () => {
        const order = await placeOrderFromMenu();
        await store.createPayment({
          orderId: order.id,
          amount: order.totalAmount,
          transactionRef: manualPaymentRef(order.id),
        });

        const resumable = await store.findResumableManualOrder(
          slug,
          order.customerPhone
        );
        expect(resumable?.order.id).toBe(order.id);
        expect(resumable?.ussdDial).toContain("*182*");
      });
    });
  });
}
