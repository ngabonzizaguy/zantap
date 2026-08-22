import { chromium } from "file:///C:/Users/G/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs";

const baseUrl = "https://zantap.app";
const checks = [];
const errors = [];
let browser;

function pass(name, detail = "") {
  checks.push({ name, detail });
  console.log(`PASS ${name}${detail ? ` — ${detail}` : ""}`);
}

try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  await page.goto(`${baseUrl}/inka-steakhouse`, { waitUntil: "networkidle", timeout: 60_000 });
  if ((await page.locator('link[rel="manifest"]').getAttribute("href")) !== "/manifest.webmanifest") {
    throw new Error("Storefront does not advertise the unified customer manifest");
  }
  pass("Issue 01 unified customer manifest");

  const save = page.getByRole("button", { name: /Save restaurant|Restaurant saved/ });
  await save.waitFor();
  if ((await save.textContent())?.includes("Save restaurant")) await save.click();
  await page.getByRole("button", { name: "Restaurant saved" }).waitFor();
  await page.waitForFunction(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("zantap-customer", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const rows = await new Promise((resolve, reject) => {
      const request = database
        .transaction("savedRestaurants", "readonly")
        .objectStore("savedRestaurants")
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return rows.some((row) => row.slug === "inka-steakhouse");
  });
  pass("Issue 01 explicit save persists");

  await page.getByRole("link", { name: "Your restaurants" }).click();
  await page.waitForURL(`${baseUrl}/restaurants`);
  await page.getByRole("heading", { name: "Good food, remembered." }).waitFor();
  await page.getByRole("link", { name: /Open Inka Steakhouse/ }).waitFor();
  await page.getByText(/Inka Steakhouse/).first().waitFor();
  pass("Issue 01 saved-only restaurant hub", "saved Vendor resolves and opens");

  const savedVendorId = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("zantap-customer", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const rows = await new Promise((resolve, reject) => {
      const request = database
        .transaction("savedRestaurants", "readonly")
        .objectStore("savedRestaurants")
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return rows.find((row) => row.slug === "inka-steakhouse")?.vendorId ?? null;
  });
  if (!savedVendorId) throw new Error("Saved Vendor ID was not persisted");
  const feed = await page.evaluate(async (vendorId) => {
    const response = await fetch(`/api/customer/updates?ids=${encodeURIComponent(vendorId)}`);
    if (!response.ok) throw new Error(`Update feed returned ${response.status}`);
    return response.json();
  }, savedVendorId);
  const publicVendor = feed.updates?.[0];
  const activeBatch = publicVendor?.batches?.[0];
  if (!activeBatch) throw new Error("No active Inka update batch is available for Issue 03 smoke");
  if (Object.hasOwn(activeBatch, "openCount") || Object.hasOwn(activeBatch, "menuVisitCount")) {
    throw new Error("Public feed leaked aggregate counters");
  }
  pass("Issue 03 bounded public feed", `active revision ${activeBatch.revision}`);

  await page.getByRole("heading", { name: "New changes" }).waitFor();
  await page.getByRole("button", { name: "View updates from Inka Steakhouse" }).click();
  const viewer = page.getByRole("dialog", { name: "Inka Steakhouse updates" });
  await viewer.waitFor();
  await viewer.getByRole("link", { name: "View menu" }).waitFor();
  pass("Issue 03 update viewer", "displayed revision and current menu link render");
  await viewer.getByRole("button", { name: "Close updates" }).click();
  await page.getByRole("heading", { name: "0 new updates" }).waitFor();
  pass("Issue 03 displayed-seen state", "opening the rendered revision clears unseen count");

  await page.goto(`${baseUrl}/vendor/inka-steakhouse?tab=menu`, { waitUntil: "networkidle", timeout: 60_000 });
  const updatesPanel = page.locator("section, div").filter({ hasText: "Share meaningful menu changes" }).last();
  await page.getByRole("heading", { name: "Share meaningful menu changes" }).waitFor();
  await page.getByText("Active batch preview", { exact: true }).waitFor();
  pass("Issue 02 update overview renders", "preview and aggregate controls are live");

  const unlock = page.getByRole("button", { name: "Unlock editing" }).first();
  await unlock.waitFor();
  await unlock.click();
  const recoveryDialog = page.getByRole("dialog");
  await recoveryDialog.locator("#recover-slug").fill("inka-steakhouse");
  await recoveryDialog.locator("#recover-phone").fill("250788123456");
  await recoveryDialog.getByRole("button", { name: "Unlock editing" }).click();
  await recoveryDialog.waitFor({ state: "hidden", timeout: 30_000 });
  await page.getByText("Unlock editing to change update settings.").waitFor({ state: "hidden" });
  pass("Issue 02 direct access recovery", "completed in place with plain-language inputs");

  const toggle = page.getByRole("switch");
  await toggle.waitFor();
  const initial = await toggle.getAttribute("aria-checked");
  await toggle.click();
  await page.waitForFunction(
    (expected) => document.querySelector('[role="switch"]')?.getAttribute("aria-checked") === expected,
    initial === "true" ? "false" : "true"
  );
  await toggle.click();
  await page.waitForFunction(
    (expected) => document.querySelector('[role="switch"]')?.getAttribute("aria-checked") === expected,
    initial
  );
  pass("Issue 02 vendor update toggle round-trip", `restored to ${initial === "true" ? "on" : "off"}`);

  const bodyWidth = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  if (bodyWidth.scroll > bodyWidth.client) throw new Error(`Mobile overflow ${bodyWidth.scroll} > ${bodyWidth.client}`);
  pass("Mobile viewport has no horizontal overflow");

  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`RESULT ${checks.length}/${checks.length} PASS`);
} finally {
  await browser?.close();
}
