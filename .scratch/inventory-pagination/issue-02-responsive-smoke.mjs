import { chromium } from "file:///C:/Users/G/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs";

const baseUrl = "http://localhost:3000/vendor/inka-steakhouse";
const shots = "C:/Users/G/.codex/visualizations/2026/08/20/01a02028-1cbf-7c90-bb35-a0f3a1020aed";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const checks = [];

function check(name, condition, detail = "") {
  checks.push({ name, pass: Boolean(condition), detail });
}

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(
    `${baseUrl}?tab=orders&ordersPage=99&ordersStage=ready&ordersSort=oldest`,
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("ordersPage"));
  const setupDialog = page.getByRole("dialog", { name: "Setup guide" });
  if (await setupDialog.isVisible()) {
    await setupDialog.getByRole("button", { name: "Close", exact: true }).click();
  }
  const liveNav = page.getByRole("navigation", { name: "Live order pages" });
  check(`${viewport.name}: live pagination renders`, await liveNav.isVisible());
  check(
    `${viewport.name}: invalid live page clamps in URL`,
    !new URL(page.url()).searchParams.has("ordersPage"),
    page.url()
  );
  check(
    `${viewport.name}: live filter and sort remain URL-backed`,
    new URL(page.url()).searchParams.get("ordersStage") === "ready" &&
      new URL(page.url()).searchParams.get("ordersSort") === "oldest",
    page.url()
  );
  await page.getByRole("button", { name: /^All \(/ }).click();
  check(
    `${viewport.name}: filter change returns page one`,
    !new URL(page.url()).searchParams.has("ordersPage") &&
      !new URL(page.url()).searchParams.has("ordersStage"),
    page.url()
  );
  const selectMode = page.getByRole("button", { name: "Select", exact: true });
  if (await selectMode.isVisible()) {
    await selectMode.click();
    const selectAll = page.getByRole("button", { name: /^Select all \d+$/ });
    check(`${viewport.name}: visible-page select all is offered`, await selectAll.isVisible());
    await selectAll.click();
    check(
      `${viewport.name}: select all affects visible tickets`,
      (await page.getByText(/^\d+ selected$/).count()) === 1
    );
    await page.getByRole("button", { name: "Clear selection" }).click();
  }
  check(
    `${viewport.name}: live controls are accessible`,
    (await liveNav.getByRole("button", { name: "Previous" }).count()) === 1 &&
      (await liveNav.getByRole("button", { name: "Next" }).count()) === 1
  );
  check(
    `${viewport.name}: live page has no horizontal overflow`,
    (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0
  );
  check(
    `${viewport.name}: no framework error overlay`,
    (await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count()) === 0
  );
  await page.screenshot({ path: `${shots}/issue-02-${viewport.name}-orders.png`, fullPage: true });

  await page.goto(`${baseUrl}?tab=history&historyPage=99`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !document.body.innerText.includes("Loading orders…"));
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("historyPage"));
  const historyNav = page.getByRole("navigation", { name: "Order history pages" });
  const emptyHistory = await page.getByText("No orders found").count();
  check(
    `${viewport.name}: history resolves to records or a valid empty state`,
    (await historyNav.count()) === 1 || emptyHistory === 1
  );
  if ((await historyNav.count()) === 1) {
    check(
      `${viewport.name}: history controls are accessible`,
      (await historyNav.getByRole("button", { name: "Previous" }).count()) === 1 &&
        (await historyNav.getByRole("button", { name: "Next" }).count()) === 1
    );
    check(
      `${viewport.name}: history renders at most ten records`,
      (await page.getByRole("link", { name: "Receipt" }).count()) <= 10
    );
  }
  check(
    `${viewport.name}: invalid history page clamps in URL`,
    !new URL(page.url()).searchParams.has("historyPage"),
    page.url()
  );
  check(
    `${viewport.name}: history has no horizontal overflow`,
    (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0
  );
  check(`${viewport.name}: no console errors`, errors.length === 0, errors.join(" | "));
  await page.screenshot({ path: `${shots}/issue-02-${viewport.name}-history.png`, fullPage: true });
  await page.close();
}

await browser.close();
for (const result of checks) {
  console.log(`${result.pass ? "PASS" : "FAIL"} ${result.name}${result.detail ? ` — ${result.detail}` : ""}`);
}
const failures = checks.filter((result) => !result.pass);
if (failures.length > 0) process.exit(1);
