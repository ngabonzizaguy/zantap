/**
 * Operator console prod smoke — desktop + mobile viewports.
 * Usage: OPERATOR_API_KEY=... OPERATOR_UI_SECRET=... node .scratch/operator-console/prod-smoke.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.SMOKE_BASE_URL ?? "https://zantap-psi.vercel.app";
const UI_SECRET = process.env.OPERATOR_UI_SECRET;
const OUT = path.join(".scratch", "operator-console", "smoke-shots");

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

async function shot(page, name) {
  await mkdir(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

async function runViewport({ name, width, height }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  const results = [];

  try {
    await page.goto(`${BASE}/ops/login`, { waitUntil: "networkidle" });
    await shot(page, `${name}-01-login`);

    if (!UI_SECRET) {
      results.push({ name, step: "login", ok: false, note: "OPERATOR_UI_SECRET unset" });
      return results;
    }

    await page.fill('input[name="secret"]', UI_SECRET);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/ops", { timeout: 15000 });
    await shot(page, `${name}-02-vendors`);

    const hasVendors = await page.getByText("Vendors").first().isVisible();
    results.push({ name, step: "vendors", ok: hasVendors });

    await page.goto(`${BASE}/ops/recovery`, { waitUntil: "networkidle" });
    await shot(page, `${name}-03-recovery`);
    results.push({
      name,
      step: "recovery",
      ok: await page.getByText("Recovery inbox").isVisible(),
    });
  } finally {
    await browser.close();
  }

  return results;
}

const all = [];
for (const vp of viewports) {
  all.push(...(await runViewport(vp)));
}

const failed = all.filter((r) => !r.ok);
console.log(JSON.stringify({ passed: all.length - failed.length, total: all.length, all }, null, 2));
if (failed.length) process.exit(1);
