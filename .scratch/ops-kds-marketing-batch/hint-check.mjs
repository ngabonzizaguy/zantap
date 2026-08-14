import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
await p.evaluate(() => {
  const heading = [...document.querySelectorAll("h2")].find((h) =>
    h.textContent?.includes("Walk through it"),
  );
  if (heading) {
    window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY - 60);
  }
});
await p.waitForTimeout(1200);
await p.screenshot({
  path: ".scratch/ops-kds-marketing-batch/deck-shots/hint-mobile-fixed.png",
});
await b.close();
console.log("OK");
