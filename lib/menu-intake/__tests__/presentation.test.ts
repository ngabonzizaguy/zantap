import { describe, expect, it } from "vitest";
import {
  appendSelectedFiles,
  buildMenuIntakePhone,
  buildMenuIntakeWhatsAppUrl,
  formatMenuIntakePhone,
  getMenuIntakeDishIssues,
  paginateMenuIntakeDishes,
  removeSelectedFile,
} from "@/lib/menu-intake/presentation";

describe("menu intake presentation", () => {
  it("shows at most five dishes and clamps an out-of-range page", () => {
    const dishes = Array.from({ length: 12 }, (_, index) => `Dish ${index + 1}`);

    expect(paginateMenuIntakeDishes(dishes, 1)).toEqual({
      page: 1,
      pageCount: 3,
      startIndex: 5,
      items: ["Dish 6", "Dish 7", "Dish 8", "Dish 9", "Dish 10"],
    });
    expect(paginateMenuIntakeDishes(dishes.slice(0, 4), 3)).toEqual({
      page: 0,
      pageCount: 1,
      startIndex: 0,
      items: ["Dish 1", "Dish 2", "Dish 3", "Dish 4"],
    });
  });

  it("appends replacement files within the limit and removes only the selected file", () => {
    expect(appendSelectedFiles(["one", "two"], ["three", "four"], 3)).toEqual([
      "one",
      "two",
      "three",
    ]);
    expect(removeSelectedFile(["one", "two", "three"], 1)).toEqual([
      "one",
      "three",
    ]);
  });

  it("opens ZanTap's approved WhatsApp number with the intake reference", () => {
    expect(buildMenuIntakeWhatsAppUrl("MI-260830-ABC123", "Inka")).toBe(
      "https://wa.me/250784928786?text=Hello%20ZanTap.%20I%20sent%20my%20menu%20for%20Inka.%20Reference%3A%20MI-260830-ABC123",
    );
  });

  it("builds one canonical international contact number from the selected country", () => {
    expect(buildMenuIntakePhone("+250", "0788 123 456")).toBe(
      "250788123456",
    );
    expect(buildMenuIntakePhone("+254", "0712 345 678")).toBe(
      "254712345678",
    );
    expect(buildMenuIntakePhone("+44", "+1 415 555 2671")).toBe(
      "14155552671",
    );
    expect(formatMenuIntakePhone("254712345678")).toBe("+254 712 345 678");
  });

  it("describes the exact dishes that must be fixed before Send menu", () => {
    expect(
      getMenuIntakeDishIssues([
        { clientId: "dish-1", name: "Grilled chicken", category: "Mains", priceRwf: 4500 },
        { clientId: "dish-2", name: "Fresh juice", category: "Drinks", priceRwf: 0 },
        { clientId: "dish-3", name: "", category: "", priceRwf: 2500 },
      ]),
    ).toEqual([
      { clientId: "dish-2", message: "Fresh juice needs a price." },
      { clientId: "dish-3", message: "Dish 3 needs a name and category." },
    ]);
  });
});
