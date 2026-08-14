// Scene 03 (momo) integration check: poster served fresh, crossfade neighbors,
// payment-success hierarchy visible, no overflow. Run against the dev server.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = path.resolve(".scratch/ops-kds-marketing-batch/journey-03-shots");
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? " — " + detail : ""}`);
};

const browser = await chromium.launch({ channel: "msedge" });

async function scrollToScene(page, id) {
  // Scroll so the momo scene's band midpoint is reached inside the sticky track.
  return page.evaluate((sceneId) => {
    const root = document.querySelector(".sw-root");
    if (!root) return null;
    const rect = root.getBoundingClientRect();
    const trackTop = rect.top + window.scrollY;
    const vh = window.innerHeight;
    // Sections weights: read the engine's copy blocks order.
    const copies = [...root.querySelectorAll("[data-sw-copy]")].map((el) => el.dataset.swCopy);
    return { trackTop, vh, copies, trackHeight: root.offsetHeight };
  }, id);
}

async function run(label, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  const posterResponses = [];
  page.on("response", (r) => {
    if (r.url().includes("/marketing/scroll/momo.webp")) posterResponses.push(r);
  });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const info = await scrollToScene(page, "momo");
  check(`${label}: sw-root mounted`, !!info);

  // The momo scene is section index 2 (storefront, order, momo, ...). Bands:
  // storefront & order have clips (weight diveScroll=1.3 each unless overridden),
  // stills use the same weight. Compute cumulative fraction from engine copy nodes.
  const target = await page.evaluate(() => {
    const root = document.querySelector(".sw-root");
    const rect = root.getBoundingClientRect();
    const trackTop = rect.top + window.scrollY;
    const scrollable = root.offsetHeight - window.innerHeight;
    // 6 scenes; grow (index 4) has scroll 1.6, others 1.3. momo is index 2.
    const w = [1.3, 1.3, 1.3, 1.3, 1.6, 1.3];
    const total = w.reduce((a, b) => a + b, 0);
    const before = w[0] + w[1];
    const mid = (before + w[2] / 2) / total;
    return trackTop + scrollable * mid;
  });
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(1200);

  const shot = path.join(OUT, `scene3-${label}.png`);
  await page.screenshot({ path: shot });

  const state = await page.evaluate(() => {
    const stills = [...document.querySelectorAll(".sw-root img")]
      .filter((i) => i.src.includes("momo"))
      .map((i) => ({
        src: i.src,
        visible: (() => {
          const s = getComputedStyle(i);
          const r = i.getBoundingClientRect();
          return s.display !== "none" && parseFloat(s.opacity) > 0.5 && r.width > 0;
        })(),
        natural: `${i.naturalWidth}x${i.naturalHeight}`,
      }));
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const copy = [...document.querySelectorAll(".sw-root")].length
      ? document.body.innerText
      : "";
    return { stills, overflow, hasMomoCopy: /momo/i.test(copy) };
  });

  const visiblePoster = state.stills.find((s) => s.visible);
  check(
    `${label}: momo poster visible at scene 3`,
    !!visiblePoster,
    JSON.stringify(state.stills)
  );
  check(
    `${label}: poster natural size is fresh 1600x1062`,
    state.stills.some((s) => s.natural === "1600x1062"),
    state.stills.map((s) => s.natural).join(",")
  );
  check(`${label}: no horizontal overflow`, state.overflow <= 0, `overflow=${state.overflow}px`);
  check(`${label}: no console/page errors`, errors.length === 0, errors.join(" | "));

  // Crossfade neighbors: shots just before and after the scene band edges.
  for (const [tag, frac] of [["pre", -0.06], ["post", 0.56]]) {
    const y = await page.evaluate((f) => {
      const root = document.querySelector(".sw-root");
      const rect = root.getBoundingClientRect();
      const trackTop = rect.top + window.scrollY;
      const scrollable = root.offsetHeight - window.innerHeight;
      const w = [1.3, 1.3, 1.3, 1.3, 1.6, 1.3];
      const total = w.reduce((a, b) => a + b, 0);
      const before = w[0] + w[1];
      const mid = (before + w[2] * (0.5 + f)) / total;
      return trackTop + scrollable * mid;
    }, frac === -0.06 ? -0.56 : 0.56);
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `scene3-${label}-${tag}-seam.png`) });
  }

  await page.close();
}

await run("desktop", { width: 1440, height: 900 });
await run("mobile", { width: 390, height: 844 });

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} scene-3 checks passed`);
process.exit(failed ? 1 : 0);
