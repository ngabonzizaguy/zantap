import { describe, expect, it } from "vitest";
import {
  mergePendingMenuImageFiles,
  type PendingMenuImageFile,
} from "@/lib/menu/pending-images";
import {
  formatSizePriceDraft,
  parseSizePriceDraft,
} from "@/lib/menu/size-price-draft";

function image(
  name: string,
  overrides: Partial<PendingMenuImageFile> = {}
): PendingMenuImageFile & { name: string } {
  return {
    name,
    size: 1_024,
    type: "image/jpeg",
    ...overrides,
  };
}

describe("pending menu image selection", () => {
  it("keeps selected images in order up to the six-photo limit", () => {
    const current = [image("one.jpg")];
    const incoming = [
      image("two.jpg"),
      image("three.jpg"),
      image("four.jpg"),
      image("five.jpg"),
      image("six.jpg"),
      image("seven.jpg"),
    ];

    const result = mergePendingMenuImageFiles(current, incoming);

    expect(result.files.map((file) => file.name)).toEqual([
      "one.jpg",
      "two.jpg",
      "three.jpg",
      "four.jpg",
      "five.jpg",
      "six.jpg",
    ]);
    expect(result.error).toBe("You can add up to 6 photos per item");
  });

  it("skips invalid files and explains the first rejected file", () => {
    const result = mergePendingMenuImageFiles([], [
      image("menu.gif", { type: "image/gif" }),
      image("valid.webp", { type: "image/webp" }),
    ]);

    expect(result.files.map((file) => file.name)).toEqual(["valid.webp"]);
    expect(result.error).toBe("Only JPEG, PNG, and WebP images are allowed");
  });
});

describe("size-price drafts", () => {
  it("recovers an empty or zero size price to the minimum valid RWF amount", () => {
    expect(parseSizePriceDraft("")).toBe(1);
    expect(parseSizePriceDraft("0")).toBe(1);
    expect(formatSizePriceDraft("")).toBe("1");
    expect(formatSizePriceDraft("0")).toBe("1");
  });

  it("keeps and formats a positive whole-number draft", () => {
    expect(parseSizePriceDraft("12,500")).toBe(12_500);
    expect(formatSizePriceDraft("12,500")).toBe("12,500");
  });
});
