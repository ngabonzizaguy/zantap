// Visual check of the marketing page at mobile (390) and desktop (1440).
import { chromium } from "playwright";

const browser = await chromium.launch();

for (const [name, viewport] of [
  ["mobile-390", { width: 390, height: 844 }],
  ["desktop-1440", { width: 1440, height: 900 }],
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);

  // Horizontal overflow check
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  console.log(`${name}: horizontal overflow = ${overflow}px`);

  await page.screenshot({
    path: `.scratch/product-restructure/issue-03-shots/landing-${name}-top.png`,
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: `.scratch/product-restructure/issue-03-shots/landing-${name}-mid.png`,
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: `.scratch/product-restructure/issue-03-shots/landing-${name}-bottom.png`,
  });
  if (errors.length) console.log(`${name}: console/page errors:`, errors.slice(0, 5));
  else console.log(`${name}: no console errors`);
  await page.close();
}

await browser.close();
console.log("visual check done");
