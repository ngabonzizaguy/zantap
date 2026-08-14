import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "msedge", headless: true });

const desk = await b.newPage({ viewport: { width: 1280, height: 900 } });
await desk.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await desk.waitForTimeout(2000);
await desk.locator("#lead-form").scrollIntoViewIfNeeded();
await desk.waitForTimeout(800);
await desk.screenshot({
  path: ".scratch/ops-kds-marketing-batch/deck-shots/splash-desktop.png",
});

const mob = await b.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await mob.waitForTimeout(2000);
await mob.locator("#lead-form").scrollIntoViewIfNeeded();
await mob.waitForTimeout(800);
await mob.screenshot({
  path: ".scratch/ops-kds-marketing-batch/deck-shots/splash-mobile.png",
});

await b.close();
console.log("OK");
