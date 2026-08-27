import { describe, expect, it } from "vitest";

import {
  submitBriefingInterest,
  type BriefingInterest,
} from "@/lib/briefing/interest";

describe("Briefing interest submission", () => {
  it("normalizes and persists the submission for Ops", async () => {
    const created: BriefingInterest[] = [];

    const result = await submitBriefingInterest(
      {
        name: "  Aline  ",
        contact: "  aline@example.com ",
        interestType: "Sponsor",
        message: "  Let us discuss digital adoption.  ",
      },
      {
        create: async (input) => {
          const interest = {
            id: "interest-1",
            ...input,
            createdAt: new Date("2026-08-27T12:00:00Z"),
          };
          created.push(interest);
          return interest;
        },
      }
    );

    expect(created).toEqual([
      expect.objectContaining({
        name: "Aline",
        contact: "aline@example.com",
        message: "Let us discuss digital adoption.",
      }),
    ]);
    expect(result.id).toBe("interest-1");
  });

  it("rejects incomplete submissions before persistence", async () => {
    let persisted = false;
    await expect(submitBriefingInterest(
      {
        name: "Jean",
        contact: "",
        interestType: "Vendor",
        message: "Please call me.",
      },
      {
        create: async (input) => {
          persisted = true;
          return { id: "interest-2", ...input, createdAt: new Date() };
        },
      }
    )).rejects.toThrow("Name, contact details, and a message are required");

    expect(persisted).toBe(false);
  });
});
