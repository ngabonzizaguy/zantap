/**
 * Candidate #15 prod acceptance — live zantap-psi.vercel.app + prod Postgres.
 * Run: RUN_PROD_SMOKE=1 npx vitest run scripts/prod-onboard-acceptance.test.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "vite";
import { describe, expect, it } from "vitest";

function hydrateEnvFromDisk(): void {
  Object.assign(process.env, loadEnv("", process.cwd(), ""));
  for (const file of [".env", ".env.local"]) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, value] = match;
        if (!process.env[key]) {
          process.env[key] = value.replace(/^"|"$/g, "");
        }
      }
    } catch {
      // optional file
    }
  }
}

hydrateEnvFromDisk();

const PROD = "https://zantap-psi.vercel.app";
const runProdSmoke = process.env.RUN_PROD_SMOKE === "1";

async function fetchText(path: string): Promise<{ status: number; body: string }> {
  const res = await fetch(`${PROD}${path}`);
  return { status: res.status, body: await res.text() };
}

async function loadServerModules() {
  const [
    { provisionVendor },
    { placeOrder },
    { updateVendorProfile },
    { fetchKdsSnapshot },
    { deriveOnboardingState },
    { getStore },
    { MOMO_SIM_VALID_PIN },
  ] = await Promise.all([
    import("@/lib/actions/vendor-provision"),
    import("@/lib/actions/customer"),
    import("@/lib/actions/vendor-profile"),
    import("@/lib/kds/snapshot"),
    import("@/lib/vendor/onboarding"),
    import("@/lib/store"),
    import("@/lib/momo/constants"),
  ]);
  return {
    provisionVendor,
    placeOrder,
    updateVendorProfile,
    fetchKdsSnapshot,
    deriveOnboardingState,
    getStore,
    MOMO_SIM_VALID_PIN,
  };
}

describe.skipIf(!runProdSmoke)("prod onboard acceptance (#15)", () => {
  it("full path: provision → storefront → tagline → MoMo → KDS", async () => {
    hydrateEnvFromDisk();
    expect(
      process.env.DATABASE_URL,
      "DATABASE_URL required — smoke writes to prod Postgres"
    ).toBeTruthy();

    const {
      provisionVendor,
      placeOrder,
      updateVendorProfile,
      fetchKdsSnapshot,
      deriveOnboardingState,
      getStore,
      MOMO_SIM_VALID_PIN,
    } = await loadServerModules();

    const slug = `smoke-${Date.now().toString(36)}`;
    const businessName = `Smoke Test ${slug}`;
    const dishName = "Acceptance Platter";
    const tagline = `Fresh from ${slug}`;
    const landmark = `prod-smoke-onboard-${slug}`;

    const onboard = await fetchText("/onboard");
    expect(onboard.status).toBe(200);
    expect(onboard.body).not.toContain("Vendor signup is not open");

    const { vendor, menuItem, ownerToken } = await provisionVendor(
      {
        name: businessName,
        slug,
        phoneNumber: "0788000000",
        momoCode: "000000",
      },
      { name: dishName, priceRwf: 2500 }
    );
    expect(vendor.slug).toBe(slug);
    expect(menuItem?.id).toBeTruthy();
    expect(ownerToken).toBeTruthy();

    const persisted = await getStore().getVendorBySlug(slug);
    expect(persisted?.slug).toBe(slug);

    let storefront = await fetchText(`/${slug}`);
    for (let attempt = 0; attempt < 5 && storefront.status === 404; attempt++) {
      await new Promise((r) => setTimeout(r, 1500));
      storefront = await fetchText(`/${slug}`);
    }
    expect(storefront.status).toBe(200);
    expect(storefront.body).toContain(businessName);
    expect(storefront.body).toContain(dishName);

    const kds = await fetchText(`/vendor/${slug}?tab=setup`);
    expect(kds.status).toBe(200);

    const snapshot = await fetchKdsSnapshot(slug);
    const checklist = deriveOnboardingState(
      snapshot.menu,
      snapshot.kitchenOpen,
      snapshot.orders
    );
    expect(checklist.hasMenuItem).toBe(true);

    // Owner token from provision guards the profile write (ADR-0022).
    await updateVendorProfile(ownerToken, slug, { tagline });
    const afterTagline = await fetchText(`/${slug}`);
    expect(afterTagline.body).toContain(tagline);

    expect(menuItem).toBeTruthy();
    const order = await placeOrder({
      vendorSlug: slug,
      customerPhone: "0788111222",
      deliverySector: "Kacyiru",
      landmark,
      items: [{ menuItemId: menuItem!.id, quantity: 1 }],
    });

    const stkRes = await fetch(`${PROD}/api/momo/stk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        phone: "0788111222",
        amount: order.totalAmount,
        vendorName: businessName,
      }),
    });
    const stk = (await stkRes.json()) as { token: string; status: string };
    expect(stkRes.ok).toBe(true);
    expect(stk.status).toBe("PENDING");

    const pinRes = await fetch(`${PROD}/api/momo/stk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "confirm",
        token: stk.token,
        pin: MOMO_SIM_VALID_PIN,
      }),
    });
    const pin = (await pinRes.json()) as { status: string };
    expect(pinRes.ok).toBe(true);
    expect(pin.status).toBe("SUCCESS");

    const kdsAfterPay = await fetchKdsSnapshot(slug);
    const paid = kdsAfterPay.orders.find((o) => o.id === order.id);
    expect(paid?.status).toBe("PAID");
    expect(paid?.kitchenStage).toBe("NEW");

    const exportRes = await fetch(`${PROD}/api/vendor/${slug}/export?format=csv`);
    expect(exportRes.status).toBe(403);
  }, 120_000);
});
