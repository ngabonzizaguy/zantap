import { describe, expect, it } from "vitest";

import { validateMenuIntakeSubmission } from "@/lib/menu-intake/workflow";

describe("Menu intake submission", () => {
  it("accepts a structured self-build menu without publishing operational KDS fields", () => {
    const result = validateMenuIntakeSubmission({
      businessName: "Kigali Kitchen",
      contactName: "Aline",
      phone: "0781234567",
      locale: "en",
      alreadyOnZantap: false,
      content: {
        path: "SELF_BUILD",
        dishes: [
          {
            clientId: "dish-1",
            name: "Isombe",
            category: "Main dishes",
            description: "Cassava leaves with groundnuts",
            priceRwf: 3500,
          },
        ],
      },
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        businessName: "Kigali Kitchen",
        phone: "250781234567",
        content: {
          path: "SELF_BUILD",
          dishes: [
            {
              clientId: "dish-1",
              name: "Isombe",
              category: "Main dishes",
              description: "Cassava leaves with groundnuts",
              priceRwf: 3500,
            },
          ],
        },
      }),
    });
  });
});
