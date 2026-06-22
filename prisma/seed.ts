import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  seedDrivers,
  seedMenuItems,
  seedOrders,
  seedVendor,
} from "../lib/store/seed-data";

/**
 * Reproduce the demo dataset in Postgres so a freshly migrated local database
 * matches the in-memory experience: the `inka-steakhouse` Vendor, its menu,
 * drivers, and the sample PAID orders. The mock ids from the seed data are
 * mapped onto Prisma-generated cuids — nothing downstream may assume an id
 * format. Safe to re-run: it wipes existing data first, so it also serves as
 * the reset hook for the Prisma contract test.
 */
export async function seedDatabase(client: PrismaClient): Promise<void> {
  // Clear in dependency order. Cascades would handle children, but being
  // explicit makes this a clean reset between contract-test runs.
  await client.payment.deleteMany();
  await client.orderItem.deleteMany();
  await client.order.deleteMany();
  await client.driver.deleteMany();
  await client.menuItem.deleteMany();
  await client.vendor.deleteMany();

  const vendor = await client.vendor.create({
    data: {
      name: seedVendor.name,
      slug: seedVendor.slug,
      phoneNumber: seedVendor.phoneNumber,
      momoCode: seedVendor.momoCode,
      isActive: seedVendor.isActive,
      kitchenOpen: true,
      tagline: seedVendor.tagline,
      location: seedVendor.location,
      deliveryTime: seedVendor.deliveryTime,
      rating: seedVendor.rating,
      createdAt: seedVendor.createdAt,
    },
  });

  // Map each mock menu-item id to its freshly generated cuid so sample orders
  // can reference the real rows.
  const menuIdByMockId = new Map<string, string>();
  for (const item of seedMenuItems) {
    const created = await client.menuItem.create({
      data: {
        vendorId: vendor.id,
        name: item.name,
        description: item.description,
        priceRwf: item.priceRwf,
        category: item.category,
        isAvailable: item.isAvailable,
        thumbFrom: item.thumbFrom,
        thumbTo: item.thumbTo,
      },
    });
    menuIdByMockId.set(item.id, created.id);
  }

  for (const driver of seedDrivers) {
    await client.driver.create({
      data: {
        vendorId: vendor.id,
        name: driver.name,
        phone: driver.phone,
        initials: driver.initials,
        hue: driver.hue,
      },
    });
  }

  for (const order of seedOrders) {
    await client.order.create({
      data: {
        vendorId: vendor.id,
        customerPhone: order.customerPhone,
        deliverySector: order.deliverySector,
        landmark: order.landmark,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        orderItems: {
          create: order.orderItems.map((line) => {
            const menuItemId = menuIdByMockId.get(line.menuItemId);
            if (!menuItemId) {
              throw new Error(
                `Seed order references unknown menu item: ${line.menuItemId}`
              );
            }
            return {
              menuItemId,
              quantity: line.quantity,
              unitPriceRwf: line.unitPriceRwf,
            };
          }),
        },
      },
    });
  }
}

async function main(): Promise<void> {
  const client = new PrismaClient();
  try {
    await seedDatabase(client);
    console.log(`Seeded demo vendor "${seedVendor.slug}".`);
  } finally {
    await client.$disconnect();
  }
}

// Run main only when executed directly (e.g. `prisma db seed`), not when the
// contract test imports `seedDatabase` for its reset hook.
const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
