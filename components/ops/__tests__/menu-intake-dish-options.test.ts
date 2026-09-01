import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MenuIntakeDishOptions } from "@/components/ops/MenuIntakeDishOptions";

describe("Menu Intake Ops dish options", () => {
  it("shows every submitted size and extras choice for review", () => {
    const markup = renderToStaticMarkup(
      createElement(MenuIntakeDishOptions, {
        sizeOptions: [
          { id: "small", label: "Small", priceRwf: 4500, isAvailable: true },
          { id: "large", label: "Large", priceRwf: 7000, isAvailable: false },
        ],
        addOnGroups: [
          {
            id: "sauces",
            name: "Sauces",
            required: true,
            selection: "SINGLE",
            choices: [
              { id: "chilli", label: "Chilli", priceRwf: 0, isAvailable: true },
              { id: "cheese", label: "Cheese", priceRwf: 500, isAvailable: false },
            ],
          },
        ],
      }),
    );

    expect(markup).toContain("Sizes");
    expect(markup).toContain("Small");
    expect(markup).toContain("4,500 RWF");
    expect(markup).toContain("Large");
    expect(markup).toContain("Unavailable");
    expect(markup).toContain("Extras");
    expect(markup).toContain("Sauces");
    expect(markup).toContain("Required · Choose one");
    expect(markup).toContain("Chilli");
    expect(markup).toContain("Included");
    expect(markup).toContain("Cheese");
    expect(markup).toContain("+ 500 RWF");
  });
});
