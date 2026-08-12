/**
 * QA for the zero-credit scroll-world preview (Issue 03, skill Step 8).
 * Desktop: blob seekability, currentTime tracks scroll, seam continuity
 * screenshots, copy overlay + CTA, reduced-motion fallback.
 * Mobile 390px: stable viewport, touch scrub, safe copy bounds, rotation,
 * and overflow checks. The preview still uses desktop footage; native 9:16
 * footage remains a separate owner-approved production asset pass.
 * Run with the dev server up: node .scratch/product-restructure/scroll-world/preview-qa.mjs
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.QA_BASE_URL || "http://localhost:3000";
const SHOTS =
  process.env.QA_SHOTS || ".scratch/product-restructure/scroll-world/qa-shots";
mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? " — " + detail : ""}`);
};

const browser = await chromium.launch({ channel: "msedge" });

// ---------- Desktop ----------
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  const world = page.locator(".sw-root");
  check("sw-root mounted", (await world.count()) === 1);
  const wordmarks = await page.locator('img[alt="ZanTap"]').evaluateAll((imgs) =>
    imgs.map((img) => img.currentSrc || img.getAttribute("src") || ""),
  );
  check(
    "dark-surface wordmark wired in masthead + footer",
    wordmarks.length >= 2 && wordmarks.every((src) => src.includes("zantap-wordmark-logo2-darkbg")),
    JSON.stringify(wordmarks),
  );

  const band = await page.evaluate(() => {
    const el = document.querySelector(".sw-root");
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height, vh: window.innerHeight };
  });
  // Σ weights = 5×1.3 + 1.6 = 8.1; +1 viewport for the sticky release.
  check("container height ≈ (Σw+1)vh", Math.abs(band.height - 9.1 * band.vh) < 4, `h=${band.height} vh=${band.vh}`);

  const scrollTo = async (y) => {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(700);
  };

  // Enter the band so the accepted preview clips load; wait for blob-ready videos.
  await scrollTo(band.top + 0.2 * band.vh);
  await page.waitForFunction(
    () => {
      const vids = [...document.querySelectorAll(".sw-scene video")];
      return vids.length >= 1 && vids.every((v) => v.readyState >= 1);
    },
    { timeout: 30000 },
  );
  const seek = await page.evaluate(() => {
    const vids = [...document.querySelectorAll(".sw-scene video")];
    return vids.map((v) => ({ seekableEnd: v.seekable.length ? v.seekable.end(0) : 0, dur: v.duration }));
  });
  check("blob seekable (all loaded clips)", seek.length >= 1 && seek.every((s) => s.seekableEnd > 0), JSON.stringify(seek));

  // currentTime tracks scroll within scene 1.
  await scrollTo(band.top + 0.3 * 1.3 * band.vh);
  await page.waitForFunction(
    () => {
      const video = document.querySelector(".sw-scene video");
      return Boolean(video && !video.seeking && video.currentTime > 0.1);
    },
    { timeout: 12000 },
  );
  const t1 = await page.evaluate(() => document.querySelector(".sw-scene video")?.currentTime ?? -1);
  await scrollTo(band.top + 0.85 * 1.3 * band.vh);
  await page.waitForFunction(
    (before) => {
      const video = document.querySelector(".sw-scene video");
      return Boolean(video && !video.seeking && video.currentTime > before + 1);
    },
    t1,
    { timeout: 12000 },
  );
  const t2 = await page.evaluate(() => document.querySelector(".sw-scene video")?.currentTime ?? -1);
  check("currentTime tracks scroll", t2 > t1 + 1, `t1=${t1.toFixed(2)} t2=${t2.toFixed(2)}`);

  // Seam/composition shots: the video seam (1→2), then the two intentional
  // still-crossfade handoffs (2→3, 3→4). Weights: all 1.3 except grow 1.6.
  const w = [1.3, 1.3, 1.3, 1.3, 1.3, 1.6];
  const seamAt = (i) => w.slice(0, i + 1).reduce((a, b) => a + b, 0);
  for (const [i, name] of [
    [0, "seam1-storefront-order"],
    [1, "seam2-order-momo"],
    [2, "seam3-momo-kitchen"],
  ]) {
    const s = band.top + seamAt(i) * band.vh;
    await scrollTo(s - 0.12 * band.vh);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOTS}/${name}-before.png` });
    await scrollTo(s + 0.12 * band.vh);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOTS}/${name}-after.png` });
  }
  console.log("seam shots written (eyeball for composition continuity)");

  // Mid-scene shots incl. overlay media (order screen, momo logo) + finale CTA.
  const mids = [
    [0.65, "scene1-storefront"],
    [1.95, "scene2-order"],
    [3.25, "scene3-momo"],
    [4.55, "scene4-kitchen"],
    [5.85, "scene5-dispatch"],
    [7.3, "scene6-grow"],
  ];
  for (const [off, name] of mids) {
    await scrollTo(band.top + off * band.vh);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOTS}/${name}.png` });
  }

  const momoLogoVisible = await page.evaluate(() => {
    const img = document.querySelector('.sw-copy__media--logo img');
    return img ? img.complete && img.naturalWidth > 0 : false;
  });
  check("MoMo logo rendered in overlay", momoLogoVisible);

  const cta = page.locator('.sw-copy__cta a[href="#lead-form"]');
  check("finale CTA → #lead-form", (await cta.count()) === 1);
  await scrollTo(band.top + 7.6 * band.vh);
  const ctaVisible = await cta.isVisible();
  check("finale CTA visible & clickable at end", ctaVisible);

  // Page below the band still renders (sticky released cleanly).
  await scrollTo(band.top + band.height + 200);
  await page.screenshot({ path: `${SHOTS}/after-band-product-section.png` });

  check("no console/page errors (desktop)", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

// ---------- Reduced motion ----------
{
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const band = await page.evaluate(() => {
    const el = document.querySelector(".sw-root");
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, vh: window.innerHeight };
  });
  await page.evaluate((v) => window.scrollTo(0, v), band.top + 2 * band.vh);
  await page.waitForTimeout(1500);
  const vids = await page.locator(".sw-scene video").count();
  check("reduced-motion: zero videos loaded", vids === 0, `videos=${vids}`);
  const stillVisible = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll(".sw-scene__still")];
    return imgs.some((i) => i.complete && i.naturalWidth > 0);
  });
  check("reduced-motion: stills shown", stillVisible);
  await page.screenshot({ path: `${SHOTS}/reduced-motion.png` });
  await page.close();
}

// ---------- 390px touch/mobile ----------
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check("390px: no horizontal overflow", overflow <= 0, `overflow=${overflow}px`);
  const band = await page.evaluate(() => {
    const el = document.querySelector(".sw-root");
    const viewport = document.querySelector(".sw-viewport");
    const r = el.getBoundingClientRect();
    return {
      top: r.top + window.scrollY,
      vh: viewport?.getBoundingClientRect().height || window.innerHeight,
      height: r.height,
    };
  });
  check(
    "390px: track math uses stable sticky viewport",
    Math.abs(band.height - 9.1 * band.vh) < 4,
    `track=${band.height} viewport=${band.vh}`,
  );

  // Enter the first clip, prime it with a real touch, then fast-flick through
  // the scene. The coalesced seek must settle near the latest touch position.
  await page.evaluate((v) => window.scrollTo(0, v), band.top + 0.18 * band.vh);
  await page.waitForFunction(
    () => {
      const video = document.querySelector(".sw-scene video");
      return video && video.readyState >= 1;
    },
    { timeout: 30000 },
  );
  await page.touchscreen.tap(96, 180);
  const mobileT1 = await page.evaluate(
    () => document.querySelector(".sw-scene video")?.currentTime ?? -1,
  );
  await page.evaluate(
    ({ top, vh }) => {
      for (const progress of [0.32, 0.48, 0.64, 0.82]) {
        window.scrollTo(0, top + progress * 1.3 * vh);
        window.dispatchEvent(new TouchEvent("touchmove"));
      }
      window.dispatchEvent(new TouchEvent("touchend"));
    },
    band,
  );
  // Edge's mobile decoder can need one final GOP seek after the coalesced
  // catch-up reaches the latest touch position, especially against cold
  // production media. Wait on the bounded decoder-settled condition rather
  // than assuming a fixed local-disk deadline.
  await page.waitForFunction(
    (before) => {
      const video = document.querySelector(".sw-scene video");
      return Boolean(video && !video.seeking && video.currentTime > before + 1);
    },
    mobileT1,
    { timeout: 12000 },
  );
  const mobileSeek = await page.evaluate(() => {
    const video = document.querySelector(".sw-scene video");
    return video
      ? { currentTime: video.currentTime, duration: video.duration, seeking: video.seeking }
      : { currentTime: -1, duration: 0, seeking: false };
  });
  check(
    "390px: touch scrub advances and settles",
    mobileSeek.currentTime > mobileT1 + 1 && !mobileSeek.seeking,
    `t1=${mobileT1.toFixed(2)} t2=${mobileSeek.currentTime.toFixed(2)} dur=${mobileSeek.duration.toFixed(2)}`,
  );

  // First-scene copy should remain readable and clear the sticky conversion
  // control/safe area at the point where it is meant to peak.
  await page.evaluate((v) => window.scrollTo(0, v), band.top + 0.18 * band.vh);
  await page.waitForTimeout(600);
  const copyBounds = await page.evaluate(() => {
    const copy = [...document.querySelectorAll(".sw-copy")].find(
      (x) => parseFloat(x.style.opacity || "0") > 0.5,
    );
    if (!copy) return null;
    const r = copy.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, viewport: window.innerHeight };
  });
  check(
    "390px: active copy stays inside viewport",
    Boolean(copyBounds && copyBounds.top >= 0 && copyBounds.bottom <= copyBounds.viewport - 54),
    JSON.stringify(copyBounds),
  );

  await page.evaluate((v) => window.scrollTo(0, v), band.top + 0.18 * band.vh);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/mobile-390-scene1.png` });
  await page.evaluate((v) => window.scrollTo(0, v), band.top + 7.3 * band.vh);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/mobile-390-finale.png` });
  const copyVisible = await page.evaluate(() => {
    const c = [...document.querySelectorAll(".sw-copy")].find(
      (x) => parseFloat(x.style.opacity || "0") > 0.5,
    );
    return Boolean(c);
  });
  check("390px: copy overlay visible", copyVisible);
  const stickyCta = await page.evaluate(() => {
    const link = [...document.querySelectorAll('a[href="#lead-form"]')].find(
      (a) => getComputedStyle(a).position === "fixed",
    );
    if (!link) return null;
    const style = getComputedStyle(link);
    return {
      text: link.textContent?.replace(/\s+/g, " ").trim() || "",
      visible: style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0",
    };
  });
  check(
    "390px: sticky conversion CTA keeps visible label",
    Boolean(stickyCta?.visible && stickyCta.text.includes("Get free setup")),
    JSON.stringify(stickyCta),
  );

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(500);
  const landscape = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    viewportHeight: document.querySelector(".sw-viewport")?.getBoundingClientRect().height || 0,
  }));
  check(
    "mobile landscape recomposes without overflow",
    landscape.overflow <= 0 && landscape.viewportHeight > 0,
    JSON.stringify(landscape),
  );
  check("mobile: no page/console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await context.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
