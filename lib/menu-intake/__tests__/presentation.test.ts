import { describe, expect, it } from "vitest";
import {
  appendSelectedFiles,
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
});
