import { chromium } from "file:///C:/Users/G/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs";

const storefrontUrl = "http://localhost:3000/inka-steakhouse";
const shots = "C:/Users/G/.codex/visualizations/2026/08/20/01a0203d-061d-76d2-a5c1-16f495c28231";
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

  await page.goto(`${storefrontUrl}?from=kds&page=2`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");
  const menuNav = page.getByRole("navigation", { name: "Menu pages" });
  const menuCards = page.locator('[aria-label^="Customize "]');
  check(`${viewport.name}: pagination renders`, await menuNav.isVisible());
  check(
    `${viewport.name}: page two renders only its remaining dish`,
    (await menuCards.count()) === 1,
    `cards=${await menuCards.count()}`
  );
  check(
    `${viewport.name}: direct URL restores page two`,
    new URL(page.url()).searchParams.get("page") === "2",
    page.url()
  );

  await page.getByRole("button", { name: /^Add / }).click();
  await menuNav.getByRole("button", { name: "Previous" }).click();
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("page"));
  check(
    `${viewport.name}: page one contains at most ten dishes`,
    (await menuCards.count()) === 10,
    `cards=${await menuCards.count()}`
  );
  check(
    `${viewport.name}: cart survives page navigation`,
    (await page.getByText("1 item", { exact: true }).count()) === 1
  );

  await menuNav.getByRole("button", { name: "Next" }).click();
  await page.waitForFunction(() => new URL(location.href).searchParams.get("page") === "2");
  await page.waitForTimeout(500);
  check(
    `${viewport.name}: page change focuses Menu`,
    (await page.evaluate(() => document.activeElement?.id)) === "menu"
  );
  await page.goBack();
  await page.waitForFunction(() => !new URL(location.href).searchParams.has("page"));
  check(
    `${viewport.name}: browser Back restores prior menu page and cart`,
    (await menuCards.count()) === 10 &&
      (await page.getByText("1 item", { exact: true }).count()) === 1
  );
  await page.goForward();
  await page.waitForFunction(() => new URL(location.href).searchParams.get("page") === "2");

  const search = page.getByRole("searchbox", { name: "Search menu" });
  await search.fill("Loaded Fries");
  await page.waitForFunction(() => new URL(location.href).searchParams.get("search") === "Loaded Fries");
  check(
    `${viewport.name}: search is URL-backed and resets page one`,
    !new URL(page.url()).searchParams.has("page") && (await menuCards.count()) === 1,
    page.url()
  );
  await page.getByRole("button", { name: "Sides", exact: true }).click();
  check(
    `${viewport.name}: category is URL-backed`,
    new URL(page.url()).searchParams.get("category") === "Sides",
    page.url()
  );
  await search.fill("");
  check(
    `${viewport.name}: clearing search preserves category and page one`,
    !new URL(page.url()).searchParams.has("search") &&
      !new URL(page.url()).searchParams.has("page") &&
      new URL(page.url()).searchParams.get("category") === "Sides"
  );

  await page.goto(`${storefrontUrl}?from=kds&page=999`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => new URL(location.href).searchParams.get("page") === "2");
  check(`${viewport.name}: invalid page clamps safely`, true, page.url());
  await page.getByRole("searchbox", { name: "Search menu" }).fill("Tilapia");
  await page.getByText("No dishes found", { exact: true }).waitFor();
  check(
    `${viewport.name}: unavailable dish is excluded before search count`,
    (await page.getByText("0 dishes", { exact: true }).count()) === 1
  );
  check(
    `${viewport.name}: controls expose Previous and Next`,
    (await menuNav.getByRole("button", { name: "Previous" }).count()) === 1 &&
      (await menuNav.getByRole("button", { name: "Next" }).count()) === 1
  );
  check(
    `${viewport.name}: no horizontal overflow`,
    (await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )) <= 0
  );
  check(
    `${viewport.name}: no framework error overlay`,
    (await page
      .locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      .count()) === 0
  );
  check(`${viewport.name}: no console errors`, errors.length === 0, errors.join(" | "));
  await page.screenshot({
    path: `${shots}/issue-03-${viewport.name}-storefront.png`,
    fullPage: true,
  });
  await page.close();
}

await browser.close();
for (const result of checks) {
  console.log(
    `${result.pass ? "PASS" : "FAIL"} ${result.name}${result.detail ? ` — ${result.detail}` : ""}`
  );
}
const failures = checks.filter((result) => !result.pass);
if (failures.length > 0) process.exit(1);
