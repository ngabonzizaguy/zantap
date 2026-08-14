import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);
await p.click('button[aria-label="Change language"]');
await p.waitForTimeout(400);
await p.screenshot({
  path: ".scratch/ops-kds-marketing-batch/deck-shots/lang-switcher-mobile.png",
  clip: { x: 0, y: 0, width: 390, height: 420 },
});
await b.close();
console.log("OK");
