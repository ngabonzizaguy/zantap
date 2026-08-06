// Capture a fresh Z-brand KDS screenshot (with a paid demo order on the queue)
// for the marketing page device frame. Selectors mirror candidate-22 smoke.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const SLUG = "inka-steakhouse";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
await context.addInitScript(() => {
  for (const id of ["menu-add", "kitchen-toggle", "dispatch-button"]) {
    localStorage.setItem(`zantap:kds-coachmark-${id}`, "1");
  }
});

// 1) Paid order via storefront (simulated MoMo, PIN 12345)
const shop = await context.newPage();
shop.setDefaultTimeout(45000);
await shop.goto(`${BASE}/${SLUG}`, { waitUntil: "networkidle" });
const addBtn = shop.locator('button[aria-label^="Add "]').first();
await addBtn.waitFor({ state: "visible" });
await addBtn.click({ force: true });
await shop.waitForTimeout(800);
await shop.getByRole("button", { name: /Review order/i }).click({ force: true });
await shop.fill('input[placeholder="078XXXXXXX"]', "0788123456");
await shop.locator("text=Choose your sector").click().catch(() => {});
await shop.waitForTimeout(300);
await shop
  .locator("button", { hasText: /^Kacyiru$|^Kimihurura$|^Remera$/ })
  .first()
  .click()
  .catch(async () => {
    await shop.locator("div.absolute button").first().click();
  });
await shop.locator("text=Total").first().click({ force: true }).catch(() => {});
await shop.waitForTimeout(400);
await shop.fill('input[placeholder*="Simba"]', "Near the roundabout");
await shop.locator("text=Total").first().click({ force: true }).catch(() => {});
await shop.waitForTimeout(400);
// A pending manual-MoMo order from a previous run may resume directly into
// the awaiting sheet; otherwise click Pay and take whichever path appears.
const ivePaid = shop.getByRole("button", { name: /I've paid/i });
if (!(await ivePaid.isVisible().catch(() => false))) {
  const payBtn = shop.getByRole("button", { name: /Pay securely with MoMo/ });
  await payBtn.scrollIntoViewIfNeeded();
  await payBtn.click({ force: true });
  await shop.waitForTimeout(2000);
}
const pin = shop.locator('input[type="password"]');
let mode = null;
for (let i = 0; i < 30 && !mode; i++) {
  if (await pin.isVisible().catch(() => false)) mode = "sim";
  else if (await ivePaid.isVisible().catch(() => false)) mode = "manual";
  else await shop.waitForTimeout(500);
}
if (!mode) {
  await shop.screenshot({ path: ".scratch/product-restructure/debug-no-payment-ui.png" });
  throw new Error("Neither sim PIN nor manual sheet appeared");
}
if (mode === "sim") {
  await pin.fill("12345");
  await shop.getByRole("button", { name: "Send", exact: true }).click();
} else {
  await ivePaid.click({ force: true });
}
await shop.waitForSelector("text=/Payment successful|success|received/i", { timeout: 30000 });
console.log("order paid");

// 2) KDS: dismiss overlays, screenshot with the NEW ticket on the queue
const kds = await context.newPage();
kds.setDefaultTimeout(45000);
await kds.goto(`${BASE}/vendor/${SLUG}`, { waitUntil: "networkidle" });
await kds.waitForTimeout(1500);
for (let i = 0; i < 5; i++) {
  const gotIt = kds.getByRole("button", { name: /got it/i });
  if (await gotIt.count()) {
    await gotIt.first().click({ force: true });
    await kds.waitForTimeout(400);
  } else break;
}
const closeSetup = kds.getByRole("button", { name: "Close setup guide" });
if (await closeSetup.isVisible().catch(() => false)) {
  await closeSetup.click({ force: true });
  await kds.waitForTimeout(600);
}
const close = kds.locator('[aria-label="Close"]');
if (await close.count()) {
  await close.first().click({ force: true }).catch(() => {});
  await kds.waitForTimeout(600);
}
await kds.waitForSelector("text=Paid via MoMo", { timeout: 20000 });
await kds.setViewportSize({ width: 390, height: 702 });
await kds.waitForTimeout(800);
await kds.screenshot({ path: "public/marketing/screen-kitchen.png" });
await browser.close();
console.log("captured public/marketing/screen-kitchen.png");
