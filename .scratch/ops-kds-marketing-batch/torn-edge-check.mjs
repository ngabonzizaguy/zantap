import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);

// Top seam: scroll so the walkthrough footage's first frame is entering view
await p.evaluate(() => {
  const heading = [...document.querySelectorAll("h2")].find((h) =>
    h.textContent?.includes("Walk through it"),
  );
  if (heading) {
    window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY - 300);
  }
});
await p.waitForTimeout(1000);
await p.screenshot({
  path: ".scratch/ops-kds-marketing-batch/deck-shots/torn-edge-top.png",
});

await b.close();
console.log("OK");
