import { describe, expect, it, vi } from "vitest";
import type { OrderHistoryItem } from "@/lib/types";
import {
  buildCsv,
  escapeCsvCell,
  EXPORT_CSV_HEADERS,
  EXPORT_MAX_ROWS,
  ExportRowCapError,
  fetchAllFilteredOrders,
  orderHistoryItemToRow,
} from "@/lib/vendor/export-orders";
import type { Store } from "@/lib/store/types";

function sampleItem(overrides?: Partial<OrderHistoryItem>): OrderHistoryItem {
  return {
    order: {
      id: "ord_test_1204",
      vendorId: "v1",
      customerPhone: "0788123456",
      deliverySector: "Kimironko",
      landmark: "Near mosque",
      totalAmount: 4500,
      status: "PAID",
      createdAt: new Date("2026-06-15T10:30:00.000Z"),
      orderItems: [
        {
          id: "oi1",
          orderId: "ord_test_1204",
          menuItemId: "m1",
          menuItem: { id: "m1", vendorId: "v1", name: "Brochette", priceRwf: 2500, category: "Grill", isAvailable: true },
          quantity: 1,
          unitPriceRwf: 2500,
        },
        {
          id: "oi2",
          orderId: "ord_test_1204",
          menuItemId: "m2",
          menuItem: { id: "m2", vendorId: "v1", name: "Chips", priceRwf: 2000, category: "Sides", isAvailable: true },
          quantity: 1,
          unitPriceRwf: 2000,
        },
      ],
    },
    paymentStatus: "SUCCESS",
    ...overrides,
  };
}

describe("escapeCsvCell", () => {
  it("quotes cells containing commas", () => {
    expect(escapeCsvCell("hello, world")).toBe('"hello, world"');
  });

  it("doubles embedded quotes", () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("quotes cells with newlines", () => {
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("buildCsv", () => {
  it("starts with the History-aligned header row", () => {
    const csv = buildCsv([]);
    expect(csv.split("\r\n")[0]).toBe(EXPORT_CSV_HEADERS.join(","));
  });

  it("escapes special characters in item summaries", () => {
    const item = sampleItem();
    item.order.orderItems[0].menuItem!.name = 'Brochette, "special"';
    const csv = buildCsv([item]);
    const lines = csv.trimEnd().split("\r\n");
    // header + 1 data row + blank separator + total footer = 4
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('""special""');
  });

  it("maps payment status labels consistently", () => {
    const row = orderHistoryItemToRow(sampleItem());
    expect(row["Payment Status"]).toBe("Paid");
    expect(row["Order ID"]).toBe("#1204");
    expect(row["Total (RWF)"]).toBe("4500");
  });
});

describe("fetchAllFilteredOrders", () => {
  it("throws ExportRowCapError when total exceeds the cap", async () => {
    const store = {
      listOrdersFiltered: vi.fn().mockResolvedValue({
        orders: [],
        total: EXPORT_MAX_ROWS + 1,
        page: 1,
        pageSize: 1,
      }),
    } as unknown as Store;

    await expect(
      fetchAllFilteredOrders(store, "demo", { datePreset: "last30" })
    ).rejects.toBeInstanceOf(ExportRowCapError);
  });

  it("fetches all matching rows in one query after the probe", async () => {
    const orders = [sampleItem(), sampleItem()];
    const listOrdersFiltered = vi
      .fn()
      .mockResolvedValueOnce({
        orders: [orders[0]],
        total: 2,
        page: 1,
        pageSize: 1,
      })
      .mockResolvedValueOnce({
        orders,
        total: 2,
        page: 1,
        pageSize: 2,
      });

    const store = { listOrdersFiltered } as unknown as Store;
    const result = await fetchAllFilteredOrders(store, "demo", {});

    expect(result).toHaveLength(2);
    expect(listOrdersFiltered).toHaveBeenCalledTimes(2);
    expect(listOrdersFiltered).toHaveBeenLastCalledWith(
      "demo",
      {},
      { page: 1, pageSize: 2 }
    );
  });
});

describe("ExportRowCapError", () => {
  it("includes the total in the message", () => {
    const error = new ExportRowCapError(12_345);
    expect(error.code).toBe("EXPORT_ROW_CAP");
    expect(error.message).toContain("12345");
    expect(error.message).toContain(String(EXPORT_MAX_ROWS));
  });
});
