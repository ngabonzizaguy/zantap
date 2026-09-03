import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  updateVendorProfile,
  uploadBrandingAsset,
} from "@/lib/actions/vendor-profile";
import { provisionVendor } from "@/lib/actions/vendor-provision";
import { getStore } from "@/lib/store";
import type { ResettableStore } from "@/lib/store/types";
import { OwnerTokenError } from "@/lib/vendor/owner-token-guard";
import { __resetRateLimits } from "@/lib/vendor/rate-limit";

const globalForStore = globalThis as unknown as { __zantapStore?: unknown };

describe("updateVendorProfile", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

  beforeEach(async () => {
    delete process.env.DATABASE_URL;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete globalForStore.__zantapStore;
    __resetRateLimits();
    const store = getStore() as ResettableStore;
    await store.reset();
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalBlobToken === undefined) {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    } else {
      process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
    }
    delete globalForStore.__zantapStore;
  });

  async function provisionTestVendor() {
    const { vendor, ownerToken } = await provisionVendor({
      name: "Profile Test Kitchen",
      slug: "profile-test-kitchen",
      phoneNumber: "+250 788 111 222",
      momoCode: "880001",
      businessCategory: "Restaurant",
    });
    return { vendor, ownerToken };
  }

  it("rejects invalid owner tokens", async () => {
    const { vendor } = await provisionTestVendor();
    await expect(
      updateVendorProfile("bad-token", vendor.slug, { tagline: "Hi" })
    ).rejects.toThrow(OwnerTokenError);
  });

  it("updates business fields and renames slug", async () => {
    const { vendor, ownerToken } = await provisionTestVendor();

    const updated = await updateVendorProfile(ownerToken, vendor.slug, {
      name: "Renamed Kitchen",
      slug: "renamed-kitchen",
      phoneNumber: "+250 788 333 444",
      businessCategory: "Café / Coffee",
    });

    expect(updated.name).toBe("Renamed Kitchen");
    expect(updated.slug).toBe("renamed-kitchen");
    expect(updated.phoneNumber).toBe("250788333444");
    expect(updated.businessCategory).toBe("Café / Coffee");
    expect(await getStore().getVendorBySlug("profile-test-kitchen")).toBeNull();
  });

  it("rejects slug collisions on rename", async () => {
    const { vendor, ownerToken } = await provisionTestVendor();
    await provisionVendor({
      name: "Other Vendor",
      slug: "other-vendor-slug",
      phoneNumber: "0788999000",
      momoCode: "880002",
    });

    await expect(
      updateVendorProfile(ownerToken, vendor.slug, { slug: "other-vendor-slug" })
    ).rejects.toThrow(/already taken/);
  });

  it("canonicalizes business phone on write (no double-zero national)", async () => {
    const { vendor, ownerToken } = await provisionTestVendor();

    const updated = await updateVendorProfile(ownerToken, vendor.slug, {
      phoneNumber: "+250 0788123456",
    });

    expect(updated.phoneNumber).toBe("250788123456");
  });

  it("stages a branding upload without publishing the profile field", async () => {
    const { vendor, ownerToken } = await provisionTestVendor();
    const formData = new FormData();
    formData.set(
      "file",
      new File([new Uint8Array([137, 80, 78, 71])], "logo.png", {
        type: "image/png",
      })
    );

    const uploadedUrl = await uploadBrandingAsset(
      ownerToken,
      vendor.slug,
      "logo",
      formData
    );

    expect(uploadedUrl).toMatch(/^\/api\/local-blob\/branding\//);
    expect((await getStore().getVendorBySlug(vendor.slug))?.logoUrl).toBeUndefined();
  });

  it("normalizes PHONE payout momoCode on write", async () => {
    const { vendor, ownerToken } = await provisionTestVendor();

    const updated = await updateVendorProfile(ownerToken, vendor.slug, {
      payoutMethod: "PHONE",
      momoCode: "+250 788 555 666",
    });

    expect(updated.payoutMethod).toBe("PHONE");
    expect(updated.momoCode).toBe("0788555666");
  });

  it("publishes qualifying profile saves and supports Don't announce", async () => {
    const { vendor, ownerToken } = await provisionTestVendor();
    await updateVendorProfile(ownerToken, vendor.slug, { tagline: "Fresh daily" });
    expect((await getStore().getVendorUpdateOverview(vendor.slug))?.activeBatch)
      .toEqual(expect.objectContaining({ revision: 1 }));

    await updateVendorProfile(
      ownerToken,
      vendor.slug,
      { description: "Quiet correction" },
      { announce: false }
    );
    expect((await getStore().getVendorUpdateOverview(vendor.slug))?.activeBatch)
      .toEqual(expect.objectContaining({ revision: 1 }));
  });
});
