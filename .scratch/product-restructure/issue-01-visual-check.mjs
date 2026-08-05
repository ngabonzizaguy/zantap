// Issue 01 visual check: Z brand rollout screenshots against local prod server.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = ".scratch/product-restructure/issue-01-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

// Favicon set responds
for (const path of ["/favicon.ico", "/icon.png", "/apple-icon.png"]) {
  const res = await page.request.get(BASE + path);
  console.log(path, res.status(), res.headers()["content-type"]);
}

await page.goto(BASE + "/onboard", { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/onboard-splash.png` });
console.log("onboard splash captured");

await page.goto(BASE + "/vendor/inka-steakhouse", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/kds-header.png` });
console.log("kds captured");

await page.goto(BASE + "/inka-steakhouse", { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/storefront.png` });
console.log("storefront captured");

await browser.close();
console.log("done");
