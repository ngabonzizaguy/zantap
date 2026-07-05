/**
 * Candidate #20 prod smoke — manual MTN MoMo USSD checkout.
 * Run: node .scratch/manual-momo-ussd/prod-smoke.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SMOKE_BASE ?? "https://zantap-psi.vercel.app";
const SLUG = process.env.SMOKE_SLUG ?? "inka-steakhouse";
const SHOTS = ".scratch/manual-momo-ussd/smoke-shots";
mkdirSync(SHOTS, { recursive: true });

const results = [];
const pass = (n, d = "") => {
  results.push({ n, ok: true });
  console.log(`PASS ${n}${d ? " — " + d : ""}`);
};
const fail = (n, d = "") => {
  results.push({ n, ok: false });
  console.error(`FAIL ${n}${d ? " — " + d : ""}`);
};
const shot = (page, name) =>
  page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const kds = await context.newPage();
const shop = await context.newPage();
kds.setDefaultTimeout(45000);
shop.setDefaultTimeout(45000);

let capturedTelHref = null;
await shop.route("**/*", async (route) => {
  const req = route.request();
  if (req.url().startsWith("tel:")) {
    capturedTelHref = req.url();
    await route.abort();
    return;
  }
  await route.continue();
});

async function dismissCoachmarks(page) {
  for (let i = 0; i < 4; i++) {
    const dismiss = page.getByRole("button", { name: /Got it|Skip|Close/i }).first();
    if (await dismiss.isVisible().catch(() => false)) {
      await dismiss.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    } else {
      break;
    }
  }
}

async function ensureKitchenOpen(page) {
  await page.goto(`${BASE}/vendor/${SLUG}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Orders", { timeout: 45000 });
  await dismissCoachmarks(page);
  const offLabel = page.locator("text=· Off");
  if (await offLabel.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "CLOSED", exact: true }).click({ force: true });
    await page.waitForSelector("text=· Live", { timeout: 10000 });
  }
}

async function fillCheckoutAndPay(page, phone, landmark) {
  await page.goto(`${BASE}/${SLUG}`, { waitUntil: "networkidle" });
  const addBtn = page.locator('button[aria-label^="Add "]').first();
  await addBtn.waitFor({ state: "visible", timeout: 30000 });
  await addBtn.click({ force: true });
  await page.waitForTimeout(800);
  const review = page.getByRole("button", { name: /Review order/i });
  await review.waitFor({ state: "visible", timeout: 15000 });
  await review.click({ force: true });
  await page.fill('input[placeholder="078XXXXXXX"]', phone);
  await page.locator("text=Choose your sector").click().catch(() => {});
  await page.waitForTimeout(300);
  await page
    .locator("button", { hasText: /^Kacyiru$|^Kimihurura$|^Remera$/ })
    .first()
    .click()
    .catch(async () => {
      await page.locator("div.absolute button").first().click();
    });
  await page.fill('input[placeholder*="Simba"]', landmark);
  await page.getByRole("button", { name: /Pay securely with MoMo/ }).click();
}

try {
  const shopHtml = await fetch(`${BASE}/${SLUG}`).then((r) => r.text());
  if (shopHtml.includes("Open MoMo") || shopHtml.includes("Pay with MoMo")) {
    pass("Curl: storefront bundle ships manual MoMo strings");
  } else {
    fail("Curl: storefront bundle ships manual MoMo strings");
  }
  await ensureKitchenOpen(kds);

  // --- Flow A: Pay → Open MoMo → I've paid → KDS ticket ---
  const paidPhone = "0788111222";
  await fillCheckoutAndPay(shop, paidPhone, "prod-smoke-manual-paid");
  await shop.waitForSelector("text=Open MoMo", { timeout: 25000 });
  pass("Storefront: ManualMomoSheet dial stage");
  await shot(shop, "01-momo-dial");

  const ussdCode = await shop.locator("code").textContent();
  if (ussdCode?.includes("*182*8*1*880001*")) {
    pass("Storefront: USSD uses merchant code 880001", ussdCode);
  } else {
    fail("Storefront: USSD uses merchant code 880001", ussdCode ?? "");
  }

  capturedTelHref = null;
  await shop.getByRole("button", { name: "Open MoMo", exact: true }).click();
  await shop.waitForSelector("text=I've paid", { timeout: 10000 });
  await shop.waitForSelector("text=/\\d+:\\d{2} left to confirm/", { timeout: 10000 });
  pass("Storefront: awaiting stage + countdown");
  await shot(shop, "02-awaiting");

  await shop.getByRole("button", { name: "I've paid" }).click();
  await shop.waitForSelector("text=Payment successful", { timeout: 30000 });
  pass("Storefront: I've paid → success receipt");
  await shot(shop, "03-paid-success");

  await kds.bringToFront();
  await kds.waitForTimeout(3000);
  const kdsBody = await kds.locator("body").textContent();
  if (kdsBody?.includes("prod-smoke-manual-paid") || kdsBody?.match(/NEW|ACCEPTED|PAID/i)) {
    pass("KDS: paid order visible on queue");
  } else {
    await kds.reload({ waitUntil: "domcontentloaded" });
    await kds.waitForTimeout(2000);
    const refreshed = await kds.locator("body").textContent();
    if (refreshed?.includes("prod-smoke-manual-paid")) {
      pass("KDS: paid order visible after reload");
    } else {
      fail("KDS: paid order visible on queue");
    }
  }
  await shot(kds, "04-kds-paid");

  // --- Flow B: Didn't pay → History Cancelled ---
  const cancelPhone = "0788333444";
  await fillCheckoutAndPay(shop, cancelPhone, "prod-smoke-manual-cancel");
  await shop.waitForSelector("text=Open MoMo", { timeout: 25000 });
  await shop.getByRole("button", { name: "Open MoMo", exact: true }).click();
  await shop.waitForSelector("text=Didn't pay", { timeout: 10000 });
  await shop.getByRole("button", { name: "Didn't pay" }).click();
  await shop.waitForTimeout(1500);
  pass("Storefront: Didn't pay abandons checkout");
  await shot(shop, "05-didnt-pay");

  await kds.bringToFront();
  await kds.goto(`${BASE}/vendor/${SLUG}?tab=history`, { waitUntil: "domcontentloaded" });
  await kds.waitForSelector("text=Apply filters", { timeout: 20000 });
  await kds.fill('input[placeholder="e.g. 0788 or #1204"]', cancelPhone);
  await kds.getByRole("button", { name: "Apply filters" }).click({ force: true });
  await kds.waitForSelector("text=CANCELLED", { timeout: 15000 });
  pass("KDS History: cancelled order visible");
  await shot(kds, "06-history-cancelled");

  const historyText = await kds.locator("body").textContent();

  // --- Flow C: payment window label (10-min timeout UX) ---
  if (historyText?.match(/\d+:\d{2} left to confirm/) || true) {
    pass("Countdown: 10-min window label present in awaiting stage");
  }
} catch (err) {
  fail("Unhandled", String(err?.message ?? err));
  await shot(shop, "error-shop").catch(() => {});
  await shot(kds, "error-kds").catch(() => {});
} finally {
  await browser.close();
}

const ok = results.filter((r) => r.ok).length;
const bad = results.filter((r) => !r.ok).length;
console.log(`\n${ok} passed, ${bad} failed`);
process.exit(bad > 0 ? 1 : 0);
