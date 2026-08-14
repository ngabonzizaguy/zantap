import { chromium } from "playwright-core";
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2500);

// Jump to each scene with a screen media via the route dots (order=2, momo=3, kitchen=4)
const shots = [
  [1, "walk-scene2-order"],
  [2, "walk-scene3-momo"],
  [3, "walk-scene4-kitchen"],
];
for (const [idx, name] of shots) {
  await p.evaluate((i) => {
    document.querySelectorAll(".sw-route__dot")[i]?.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
  }, idx);
  await p.waitForTimeout(1800);
  await p.screenshot({
    path: `.scratch/ops-kds-marketing-batch/deck-shots/${name}.png`,
  });
}

// Assert: every screen media is inside a phone chassis, all same height,
// correct srcs, no legacy screen imgs left.
const info = await p.evaluate(() => {
  const phones = [...document.querySelectorAll(".sw-phone")];
  return {
    phoneCount: phones.length,
    heights: phones.map((el) => Math.round(el.getBoundingClientRect().height)),
    srcs: [...document.querySelectorAll(".sw-phone__screen img")].map((i) =>
      i.getAttribute("src"),
    ),
    legacy: document.querySelectorAll(
      ".sw-copy__media--screen > img",
    ).length,
  };
});
console.log(JSON.stringify(info, null, 2));
await b.close();
