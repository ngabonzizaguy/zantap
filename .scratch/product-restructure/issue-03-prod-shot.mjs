import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("https://zantap.app/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(3000);
await page.screenshot({
  path: ".scratch/product-restructure/issue-03-shots/prod-mobile-390-top.png",
});
await browser.close();
console.log("prod shot captured");
