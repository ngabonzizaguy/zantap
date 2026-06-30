import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

import { createPrismaStore } from "@/lib/store/prisma";
import type { ResettableStore } from "@/lib/store/types";
import { DEMO_VENDOR_SLUG } from "@/lib/store/seed-data";
import { seedDatabase } from "@/prisma/seed";
import {
  runPaymentContract,
  runStoreContract,
} from "@/lib/store/__tests__/contract";
import { MOMO_SIM_VALID_PIN } from "@/lib/momo/constants";

/**
 * The same Store contract suite, run against the Prisma adapter on a disposable
 * test database, proving the in-memory and Prisma adapters cannot drift.
 *
 * Point `TEST_DATABASE_URL` at a throwaway Postgres database to enable it; the
 * suite pushes the schema, then reseeds before each test via the adapter's
 * reset hook. When the variable is absent (unit-speed local runs, CI without a
 * database) the whole suite is skipped.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

/**
 * #prisma — remote integration suite. Skipped when `SKIP_PRISMA_TESTS=1` (default
 * in `.env.example`) to avoid Supabase Free egress saturation and pooler stalls.
 * Re-enable locally with `SKIP_PRISMA_TESTS=0 npm test` when you need adapter parity.
 */
const RUN_PRISMA_SUITE =
  Boolean(TEST_DATABASE_URL) && process.env.SKIP_PRISMA_TESTS !== "1";

let client: PrismaClient;
let testUrl: string;

describe.skipIf(!RUN_PRISMA_SUITE)("Prisma adapter (integration) #prisma", () => {
  beforeAll(() => {
    testUrl = TEST_DATABASE_URL as string;

    // Bring the disposable database up to the current schema. --accept-data-loss
    // is safe here precisely because the target is a throwaway test database.
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: testUrl, DIRECT_URL: testUrl },
      stdio: "inherit",
    });

    client = new PrismaClient({ datasources: { db: { url: testUrl } } });
  });

  afterAll(async () => {
    await client?.$disconnect();
  });

  runStoreContract("prisma adapter", (): ResettableStore => {
    const base = createPrismaStore(client);
    return { ...base, reset: () => seedDatabase(client) };
  });

  runPaymentContract("prisma adapter", (): ResettableStore => {
    const base = createPrismaStore(client);
    return { ...base, reset: () => seedDatabase(client) };
  });

  describe("menu image cascade", () => {
    it("deletes MenuImage rows when the parent MenuItem is removed", async () => {
      await seedDatabase(client);

      const store = createPrismaStore(client);
      const created = await store.createMenuItem(DEMO_VENDOR_SLUG, {
        name: "Cascade Test",
        priceRwf: 4000,
      });
      await store.addMenuImage(DEMO_VENDOR_SLUG, created.id, {
        url: "https://example.com/cascade.jpg",
      });

      await client.menuItem.delete({ where: { id: created.id } });
      const remaining = await client.menuImage.count({
        where: { menuItemId: created.id },
      });
      expect(remaining).toBe(0);
    });
  });

  // The whole point of the Prisma adapter: data outlives the process. A module-
  // scoped in-memory Store would lose this Order on restart (and, on Vercel,
  // between serverless invocations) — the exact split-brain bug this slice
  // exists to kill. We prove durability by writing through one client, then
  // reading through a brand-new client that shares no in-process state.
  describe("durability across a server restart", () => {
    it("a paid Order placed by one instance is visible to a fresh instance (KDS)", async () => {
      await seedDatabase(client);

      // Instance A: a Customer places and pays for an Order.
      const storeA = createPrismaStore(client);
      const available = await storeA.getAvailableMenu(DEMO_VENDOR_SLUG);
      expect(available.length).toBeGreaterThan(0);
      const placed = await storeA.createOrder({
        vendorSlug: DEMO_VENDOR_SLUG,
        customerPhone: "0788123123",
        deliverySector: "Kicukiro",
        landmark: "Survives restart",
        items: [{ menuItemId: available[0].id, quantity: 1 }],
      });
      await storeA.updateOrderStatus(placed.id, "PAID");

      // Simulate a server restart / new serverless instance: a brand-new client
      // with no carried-over state, talking to the same Postgres.
      const freshClient = new PrismaClient({
        datasources: { db: { url: testUrl } },
      });
      try {
        const storeB = createPrismaStore(freshClient);

        const fetched = await storeB.getOrder(placed.id);
        expect(fetched?.id).toBe(placed.id);
        expect(fetched?.status).toBe("PAID");

        // And it shows up on the KDS's active-orders feed.
        const active = await storeB.listActiveOrders(DEMO_VENDOR_SLUG);
        expect(active.find((o) => o.id === placed.id)).toBeDefined();
      } finally {
        await freshClient.$disconnect();
      }
    });

    it("a Payment confirmed by one instance is visible and idempotent on a fresh instance", async () => {
      await seedDatabase(client);

      const storeA = createPrismaStore(client);
      const available = await storeA.getAvailableMenu(DEMO_VENDOR_SLUG);
      expect(available.length).toBeGreaterThan(0);
      const placed = await storeA.createOrder({
        vendorSlug: DEMO_VENDOR_SLUG,
        customerPhone: "0788999888",
        deliverySector: "Kicukiro",
        landmark: "Payment survives restart",
        items: [{ menuItemId: available[0].id, quantity: 1 }],
      });

      const ref = `ref_restart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const created = await storeA.createPayment({
        orderId: placed.id,
        amount: placed.totalAmount,
        transactionRef: ref,
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const confirmed = await storeA.confirmPayment(ref, MOMO_SIM_VALID_PIN);
      expect(confirmed.ok).toBe(true);

      const freshClient = new PrismaClient({
        datasources: { db: { url: testUrl } },
      });
      try {
        const storeB = createPrismaStore(freshClient);

        const fetched = await storeB.getPaymentByRef(ref);
        expect(fetched?.transactionRef).toBe(ref);
        expect(fetched?.status).toBe("SUCCESS");

        const order = await storeB.getOrder(placed.id);
        expect(order?.status).toBe("PAID");

        const repeat = await storeB.confirmPayment(ref, MOMO_SIM_VALID_PIN);
        expect(repeat.ok).toBe(true);
        if (!repeat.ok) return;
        expect(repeat.payment.status).toBe("SUCCESS");
        expect((await storeB.getOrder(placed.id))?.status).toBe("PAID");
      } finally {
        await freshClient.$disconnect();
      }
    });
  });
});
