import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3000/vendor/inka-steakhouse", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// Dismiss coachmark(s) and the setup drawer if they auto-opened
for (let i = 0; i < 5; i++) {
  const gotIt = page.getByRole("button", { name: /got it/i });
  if (await gotIt.count()) {
    await gotIt.first().click({ force: true });
    await page.waitForTimeout(400);
  } else break;
}
const close = page.locator('[aria-label="Close"]');
if (await close.count()) {
  await close.first().click({ force: true });
  await page.waitForTimeout(800);
}
await page.screenshot({ path: ".scratch/product-restructure/issue-01-shots/kds-header-clean.png" });
await browser.close();
console.log("done");
