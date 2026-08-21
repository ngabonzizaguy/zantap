import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { chromium } from "file:///C:/Users/G/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs";

const db = new PrismaClient();
const baseUrl = "https://zantap.app";
const runId = Date.now().toString(36);
const slug = `release-25-${runId}`;
const ownerToken = randomBytes(24).toString("base64url");
const ownerTokenHash = createHash("sha256").update(ownerToken, "utf8").digest("hex");
const inventoryName = `Smoke rice ${runId}`;
const checks = [];
let vendorId;
let browser;

function check(name, condition, detail = "") {
  checks.push({ name, pass: Boolean(condition), detail });
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
}

async function seed() {
  const vendor = await db.vendor.create({
    data: {
      name: `Release 25 Smoke ${runId}`,
      slug,
      phoneNumber: "250788123456",
      momoCode: "880001",
      ownerTokenHash,
      businessCategory: "Restaurant",
    },
  });
  vendorId = vendor.id;

  const menuIds = Array.from({ length: 11 }, () => randomUUID());
  await db.menuItem.createMany({
    data: menuIds.map((id, index) => ({
      id,
      vendorId,
      name: `Smoke dish ${String(index + 1).padStart(2, "0")}`,
      description: "Candidate 25 release fixture",
      priceRwf: 1000 + index * 100,
      category: index < 6 ? "Mains" : "Sides",
      isAvailable: true,
      thumbFrom: "#1c1917",
      thumbTo: "#292524",
    })),
  });

  for (let index = 0; index < 12; index += 1) {
    const createdAt = new Date(Date.now() - index * 60_000);
    await db.order.create({
      data: {
        vendorId,
        customerPhone: "250788123456",
        deliverySector: "Kacyiru",
        landmark: `release-25-order-${index + 1}`,
        totalAmount: 1000,
        status: "PAID",
        kitchenStage: "NEW",
        paidAt: createdAt,
        createdAt,
        orderItems: {
          create: {
            menuItemId: menuIds[0],
            quantity: 1,
            unitPriceRwf: 1000,
          },
        },
        payment: {
          create: {
            amount: 1000,
            transactionRef: `release-25-${runId}-${index}`,
            status: "SUCCESS",
            createdAt,
          },
        },
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    await db.inventoryItem.create({
      data: {
        vendorId,
        name: `Seed supply ${String(index + 1).padStart(2, "0")}`,
        quantity: 5,
        unit: "pieces",
        lowStockThreshold: 1,
        category: "OTHER",
        adjustments: {
          create: {
            sequence: 1,
            type: "CORRECTION",
            quantity: 5,
            oldQuantity: 0,
            newQuantity: 5,
            note: "Release smoke opening quantity",
          },
        },
      },
    });
  }
}

async function cleanup() {
  if (!vendorId) return;
  await db.order.deleteMany({ where: { vendorId } });
  await db.menuItem.deleteMany({ where: { vendorId } });
  await db.vendor.deleteMany({ where: { id: vendorId } });
}

async function verify() {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(
    ({ slug: fixtureSlug, token }) => {
      localStorage.setItem(`zantap:owner-token:${fixtureSlug}`, token);
      localStorage.setItem(`zantap:kds-setup-visits-${fixtureSlug}`, "2");
      localStorage.setItem("zantap:pwa-install-hint-seen:kds", "1");
      localStorage.setItem("zantap:pwa-install-hint-seen:storefront", "1");
    },
    { slug, token: ownerToken }
  );
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  // Inventory: server-rendered page, guarded Server Actions, Store/Prisma persistence.
  await page.goto(`${baseUrl}/vendor/${slug}?tab=inventory`, { waitUntil: "domcontentloaded" });
  const inventoryNav = page.getByRole("navigation", { name: "Inventory pages" });
  await inventoryNav.waitFor();
  check("Inventory page 1 is capped at ten", (await page.locator("ul > li").count()) === 10);
  check("Inventory starts with one full ten-item page", await page.getByText("Page 1 of 1", { exact: true }).isVisible());
  await page.getByRole("button", { name: "+ Add item", exact: true }).click();
  const addDialog = page.getByRole("dialog", { name: "Add inventory item" });
  await addDialog.getByLabel("Item name").fill(inventoryName);
  await addDialog.getByLabel("Opening quantity").fill("0");
  await addDialog.getByLabel("Low-stock alert").fill("2");
  await addDialog.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("Inventory item added", { exact: true }).waitFor();
  await page.getByText("Page 1 of 2", { exact: true }).waitFor();
  check("Creating the eleventh item opens a second page", true);
  await page.getByLabel("Search inventory").fill(inventoryName);
  await page.getByText(inventoryName, { exact: true }).waitFor();
  check("Inventory create is discoverable through the screen search", await page.getByText(inventoryName, { exact: true }).isVisible());
  check("New zero-stock item raises the out alert", await page.getByText("Out", { exact: true }).first().isVisible());

  const itemRow = page.locator("li").filter({ hasText: inventoryName });
  await itemRow.getByRole("button", { name: "Adjust", exact: true }).click();
  const adjustDialog = page.getByRole("dialog", { name: `Adjust ${inventoryName}` });
  await adjustDialog.getByLabel("Quantity").fill("5");
  await adjustDialog.getByText("Note (optional)").locator("..").getByRole("textbox").fill("Production release smoke");
  await adjustDialog.getByRole("button", { name: "Record", exact: true }).click();
  await page.getByText("Stock quantity updated", { exact: true }).waitFor();
  await itemRow.getByText("5 pieces", { exact: false }).waitFor();
  check("Inventory adjustment updated the visible quantity", true);
  await itemRow.getByRole("button", { name: "History", exact: true }).click();
  const historyDialog = page.getByRole("dialog", { name: `${inventoryName} history` });
  await historyDialog.waitFor();
  check("Inventory history includes Received", await historyDialog.getByText("Received", { exact: true }).isVisible());
  check("Inventory history retains opening Correction", await historyDialog.getByText("Opening quantity", { exact: true }).isVisible());
  await historyDialog.getByRole("button", { name: "Close", exact: true }).click();
  await itemRow.getByRole("button", { name: "Archive", exact: true }).click();
  await page.getByText(`${inventoryName} archived`, { exact: true }).waitFor();
  await page.getByRole("button", { name: "View archived items", exact: true }).click();
  await page.getByText(inventoryName, { exact: true }).waitFor();
  await page.locator("li").filter({ hasText: inventoryName }).getByRole("button", { name: "Restore", exact: true }).click();
  await page.getByText(`${inventoryName} restored`, { exact: true }).waitFor();
  const persistedInventory = await db.inventoryItem.findFirst({
    where: { vendorId, name: inventoryName },
    include: { adjustments: true },
  });
  check("Inventory data reached Postgres", persistedInventory?.quantity.toString() === "5");
  check("Inventory immutable history reached Postgres", persistedInventory?.adjustments.length === 2);

  // Live Orders: 12 PAID fixtures exercise page 2 and URL state.
  await page.goto(`${baseUrl}/vendor/${slug}?tab=orders&ordersPage=2`, { waitUntil: "domcontentloaded" });
  const liveNav = page.getByRole("navigation", { name: "Live order pages" });
  await liveNav.waitFor();
  await page.getByText("Page 2 of 2", { exact: true }).first().waitFor();
  check("Live Orders page 2 is URL-backed", new URL(page.url()).searchParams.get("ordersPage") === "2");
  const liveTickets = liveNav
    .locator("xpath=preceding-sibling::div[1]")
    .locator(":scope > div");
  check("Live Orders page 2 contains the two remaining tickets", (await liveTickets.count()) === 2, `tickets=${await liveTickets.count()}`);
  await liveNav.getByRole("button", { name: "Previous", exact: true }).click();
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("ordersPage"));
  check("Live Orders page 1 restores through URL navigation", await page.getByText("Page 1 of 2", { exact: true }).first().isVisible());

  // History: Store-filtered server read with ten-row page size and clamping.
  await page.goto(`${baseUrl}/vendor/${slug}?tab=history&historyPage=2`, { waitUntil: "domcontentloaded" });
  const orderHistoryNav = page.getByRole("navigation", { name: "Order history pages" });
  await orderHistoryNav.waitFor();
  await page.getByText("Page 2 of 2", { exact: true }).waitFor();
  check("History page 2 is URL-backed", new URL(page.url()).searchParams.get("historyPage") === "2");
  check("History page 2 contains the two remaining records", (await page.getByRole("link", { name: "Receipt" }).count()) === 2);
  await page.goto(`${baseUrl}/vendor/${slug}?tab=history&historyPage=999`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => new URL(location.href).searchParams.get("historyPage") === "2");
  check("History invalid page clamps to the last valid page", true, page.url());

  // Storefront: available dishes filter before ten-card paging; cart survives navigation.
  await page.goto(`${baseUrl}/${slug}?page=2`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  const menuNav = page.getByRole("navigation", { name: "Menu pages" });
  await menuNav.waitFor();
  const menuCards = page.locator('[aria-label^="Customize "]');
  check("Storefront page 2 contains one remaining dish", (await menuCards.count()) === 1, `cards=${await menuCards.count()}`);
  await page.getByRole("button", { name: /^Add / }).click();
  await menuNav.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByText("Page 1 of 2", { exact: true }).waitFor({ timeout: 30_000 }).catch(() => {});
  check(
    "Storefront Previous restores page 1 and omits the default URL page",
    !new URL(page.url()).searchParams.has("page") && (await menuCards.count()) === 10,
    `url=${page.url()} cards=${await menuCards.count()}`
  );
  check("Storefront page 1 is capped at ten dishes", (await menuCards.count()) === 10, `cards=${await menuCards.count()}`);
  check("Storefront cart survives page navigation", await page.getByText("1 item", { exact: true }).isVisible());
  await menuNav.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForFunction(() => new URL(location.href).searchParams.get("page") === "2");
  await page.goBack();
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("page"));
  check("Storefront browser Back restores page and cart", (await menuCards.count()) === 10 && await page.getByText("1 item", { exact: true }).isVisible());
  await page.getByRole("searchbox", { name: "Search menu" }).fill("Smoke dish 11");
  await page.waitForFunction(() => new URL(location.href).searchParams.get("search") === "Smoke dish 11");
  check("Storefront search is URL-backed and resets page", !new URL(page.url()).searchParams.has("page") && (await menuCards.count()) === 1, page.url());

  check("No framework error overlay appeared", (await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count()) === 0);
  check("No browser console errors occurred", browserErrors.length === 0, browserErrors.join(" | "));
  check("Mobile layout has no horizontal overflow", (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);

  const desktop = await context.newPage();
  await desktop.setViewportSize({ width: 1280, height: 900 });
  await desktop.goto(`${baseUrl}/vendor/${slug}?tab=inventory`, { waitUntil: "domcontentloaded" });
  await desktop.getByRole("navigation", { name: "Inventory pages" }).waitFor();
  check("Desktop Inventory renders without overflow", (await desktop.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
  await desktop.goto(`${baseUrl}/${slug}?page=2`, { waitUntil: "domcontentloaded" });
  await desktop.getByRole("navigation", { name: "Menu pages" }).waitFor();
  check("Desktop storefront pagination renders", await desktop.getByText("Page 2 of 2", { exact: true }).isVisible());
  await desktop.close();
  await context.close();
}

try {
  await seed();
  await verify();
} finally {
  await browser?.close();
  await cleanup();
  await db.$disconnect();
}

for (const result of checks) {
  console.log(`${result.pass ? "PASS" : "FAIL"} ${result.name}${result.detail ? ` — ${result.detail}` : ""}`);
}
console.log(`PASS cleanup removed release fixture ${slug}`);
