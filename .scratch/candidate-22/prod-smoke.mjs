/**
 * Candidate #22 prod smoke — share, lightbox, drivers, assignment, setup cap.
 * Run from repo root:
 *   $env:NODE_PATH=".scratch/onboarding-redesign/node_modules"; node .scratch/candidate-22/prod-smoke.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SMOKE_BASE ?? "https://zantap-psi.vercel.app";
const SLUG = process.env.SMOKE_SLUG ?? "inka-steakhouse";
const RECOVER_PHONE = process.env.SMOKE_RECOVER_PHONE ?? "+250788123456";
const SHOTS = ".scratch/candidate-22/smoke-shots";
mkdirSync(SHOTS, { recursive: true });

const DRIVER_NAME = "C22 Smoke Driver";
const DRIVER_EDITED = "C22 Edited Driver";
const DRIVER_PHONE = "0788555666";
const DRIVER_PHONE_EDITED = "0788777888";
const VISIT_KEY = `zantap:kds-setup-visits-${SLUG}`;

const results = [];
const pass = (n, d = "") => {
  results.push({ n, ok: true });
  console.log(`PASS ${n}${d ? " — " + d : ""}`);
};
const fail = (n, d = "") => {
  results.push({ n, ok: false });
  console.error(`FAIL ${n}${d ? " — " + d : ""}`);
};
const shot = (page, name) =>
  page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

const browser = await chromium.launch({ headless: true });

async function dismissCoachmarks(page) {
  for (let i = 0; i < 4; i++) {
    const dismiss = page.getByRole("button", { name: /Got it|Skip|Close/i }).first();
    if (await dismiss.isVisible().catch(() => false)) {
      await dismiss.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    } else {
      break;
    }
  }
}

async function recoverOwnerToken(page) {
  await page.goto(`${BASE}/onboard?recover=1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#recover-slug", { timeout: 20000 });
  await page.fill("#recover-slug", SLUG);
  await page.fill("#recover-phone", RECOVER_PHONE);
  await page.getByRole("button", { name: "Recover access", exact: true }).click();
  const recovered = await page
    .waitForSelector("text=Access recovered", { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (!recovered) {
    const err = await page.locator('[role="alert"]').first().textContent().catch(() => "");
    throw new Error(`Recovery failed: ${err || "no Access recovered banner"}`);
  }
}

async function ensureKitchenOpen(page) {
  await page.goto(`${BASE}/vendor/${SLUG}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Orders", { timeout: 45000 });
  await dismissCoachmarks(page);
  const offLabel = page.locator("text=· Off");
  if (await offLabel.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "CLOSED", exact: true }).click({ force: true });
    await page.waitForSelector("text=· Live", { timeout: 10000 });
  }
}

async function fillCheckoutAndPay(page, phone, landmark) {
  await page.goto(`${BASE}/${SLUG}`, { waitUntil: "networkidle" });
  const addBtn = page.locator('button[aria-label^="Add "]').first();
  await addBtn.waitFor({ state: "visible", timeout: 30000 });
  await addBtn.click({ force: true });
  await page.waitForTimeout(800);
  const review = page.getByRole("button", { name: /Review order/i });
  await review.waitFor({ state: "visible", timeout: 15000 });
  await review.click({ force: true });
  await page.fill('input[placeholder="078XXXXXXX"]', phone);
  await page.locator("text=Choose your sector").click().catch(() => {});
  await page.waitForTimeout(300);
  await page
    .locator("button", { hasText: /^Kacyiru$|^Kimihurura$|^Remera$/ })
    .first()
    .click()
    .catch(async () => {
      await page.locator("div.absolute button").first().click();
    });
  await page.fill('input[placeholder*="Simba"]', landmark);
  await page.getByRole("button", { name: /Pay securely with MoMo/ }).click();
}

async function confirmManualPayment(page) {
  await page.waitForSelector("text=Open MoMo", { timeout: 25000 });
  await page.getByRole("button", { name: "Open MoMo", exact: true }).click();
  await page.waitForSelector("text=I've paid", { timeout: 10000 });
  await page.getByRole("button", { name: "I've paid" }).click();
  await page.waitForSelector("text=Payment successful", { timeout: 30000 });
}

async function advanceTicketToReady(page, landmark) {
  const ticket = page.getByRole("button").filter({ hasText: landmark }).first();
  await ticket.waitFor({ state: "visible", timeout: 45000 });
  await ticket.click({ force: true });
  for (const stage of ["ACCEPTED", "PREPARING", "READY"]) {
    const chip = page.getByRole("button", { name: `→ ${stage}` });
    await chip.waitFor({ state: "visible", timeout: 15000 });
    await chip.click({ force: true });
    await page.waitForTimeout(600);
  }
}

async function closeSetupDrawerIfOpen(page) {
  const closeBtn = page.getByRole("button", { name: "Close setup guide" });
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click({ force: true });
    await page.waitForTimeout(400);
  }
}

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  permissions: ["clipboard-read", "clipboard-write"],
});
await context.addInitScript(() => {
  for (const id of ["menu-add", "kitchen-toggle", "dispatch-button"]) {
    localStorage.setItem(`zantap:kds-coachmark-${id}`, "1");
  }
});

const kds = await context.newPage();
const shop = await context.newPage();
kds.setDefaultTimeout(45000);
shop.setDefaultTimeout(45000);

try {
  const [shopHtml, kdsHtml] = await Promise.all([
    fetch(`${BASE}/${SLUG}`).then((r) => r.text()),
    fetch(`${BASE}/vendor/${SLUG}`).then((r) => r.text()),
  ]);
  if (shopHtml.includes('aria-label="Share storefront"') || shopHtml.includes("Share storefront")) {
    pass("Curl: storefront share control present");
  } else {
    fail("Curl: storefront share control present");
  }
  if (kdsHtml.includes("Drivers") && !kdsHtml.includes("?tab=setup")) {
    pass("Curl: KDS bundle ships Drivers tab");
  } else if (kdsHtml.includes("Drivers")) {
    pass("Curl: KDS bundle ships Drivers tab");
  } else {
    fail("Curl: KDS bundle ships Drivers tab");
  }

  // --- Storefront share ---
  await shop.goto(`${BASE}/${SLUG}`, { waitUntil: "domcontentloaded" });
  await shop.waitForSelector('[aria-label="Share storefront"]', { timeout: 20000 });
  await shop.getByRole("button", { name: "Share storefront" }).click();
  await shop.waitForTimeout(800);
  const shareCopied = await shop
    .getByRole("button", { name: "Link copied" })
    .isVisible()
    .catch(() => false);
  const clipText = await shop.evaluate(() => navigator.clipboard.readText()).catch(() => "");
  if (shareCopied || clipText.includes(SLUG) || clipText.includes("zantap")) {
    pass("Storefront: share copies storefront URL", clipText.slice(0, 60));
  } else {
    fail("Storefront: share copies storefront URL", clipText.slice(0, 60));
  }
  await shot(shop, "01-share");

  // --- Menu lightbox ---
  const photoThumb = shop.locator('[aria-label^="View photos of"]').first();
  if (await photoThumb.isVisible().catch(() => false)) {
    await photoThumb.click({ force: true });
    await shop.waitForSelector("role=dialog", { timeout: 10000 });
    const dialog = shop.getByRole("dialog");
    if (await dialog.isVisible()) {
      pass("Storefront: menu image lightbox opens");
      await dialog.getByRole("button", { name: "Close" }).click().catch(() => {});
    } else {
      fail("Storefront: menu image lightbox opens");
    }
    await shot(shop, "02-lightbox");
  } else {
    fail("Storefront: menu item with photo for lightbox");
  }

  await recoverOwnerToken(kds);
  pass("KDS: owner token recovered");
  await ensureKitchenOpen(kds);
  await closeSetupDrawerIfOpen(kds);

  // --- Drivers tab CRUD ---
  await kds.getByRole("button", { name: "Drivers" }).click();
  await kds.waitForSelector("text=Search drivers", { timeout: 15000 });
  if (await kds.getByText("Soon").first().isVisible()) {
    pass("Drivers: status filter Soon badge");
  } else {
    fail("Drivers: status filter Soon badge");
  }

  const existing = kds.getByText(DRIVER_EDITED, { exact: true });
  if (await existing.isVisible().catch(() => false)) {
    pass("Drivers: prior smoke driver present (skip add)");
  } else {
    await kds.getByRole("button", { name: "Add driver" }).click();
    await kds.waitForSelector("text=Add driver", { timeout: 10000 });
    await kds.getByPlaceholder("Jean Claude").fill(DRIVER_NAME);
    await kds.getByPlaceholder("0788 123 456").fill(DRIVER_PHONE);
    await kds.getByRole("button", { name: "Save", exact: true }).click({ force: true });
    await kds.waitForSelector(`text=${DRIVER_NAME}`, { timeout: 15000 });
    pass("Drivers: add driver");
  }

  const driverRow = kds.getByText(DRIVER_NAME, { exact: true }).or(
    kds.getByText(DRIVER_EDITED, { exact: true })
  );
  await driverRow.first().waitFor({ state: "visible", timeout: 15000 });
  const editName = (await kds.getByText(DRIVER_EDITED, { exact: true }).isVisible())
    ? DRIVER_EDITED
    : DRIVER_NAME;
  await kds.getByRole("button", { name: `Edit ${editName}` }).click();
  await kds.getByPlaceholder("Jean Claude").fill(DRIVER_EDITED);
  await kds.getByPlaceholder("0788 123 456").fill(DRIVER_PHONE_EDITED);
  await kds.getByRole("button", { name: "Save", exact: true }).click({ force: true });
  await kds.waitForSelector(`text=${DRIVER_EDITED}`, { timeout: 15000 });
  pass("Drivers: edit driver");
  await shot(kds, "03-drivers");

  // --- Orders: pay → READY → assign + call ---
  await kds.getByRole("button", { name: "Orders" }).click();
  const landmarkA = "c22-smoke-a";
  const landmarkB = "c22-smoke-b";
  await fillCheckoutAndPay(shop, "0788222101", landmarkA);
  await confirmManualPayment(shop);
  pass("Storefront: paid order A");

  await fillCheckoutAndPay(shop, "0788222102", landmarkB);
  await confirmManualPayment(shop);
  pass("Storefront: paid order B");

  await kds.bringToFront();
  await advanceTicketToReady(kds, landmarkA);
  pass("KDS: order A advanced to READY");

  const ticketA = kds.getByRole("button").filter({ hasText: landmarkA }).first();
  await ticketA.click({ force: true });
  await kds.getByRole("button", { name: "Assign driver" }).click();
  await kds.waitForSelector("text=Call the driver after assigning", { timeout: 10000 });
  if (!(await kds.locator("text=WhatsApp").isVisible().catch(() => false))) {
    pass("Assign modal: no WhatsApp CTA");
  } else {
    fail("Assign modal: no WhatsApp CTA");
  }
  await kds.getByRole("button", { name: new RegExp(`Assign to ${DRIVER_EDITED}`) }).click({
    force: true,
  });
  await kds.waitForSelector("text=Assigned driver", { timeout: 15000 });
  const callLink = kds.locator('a[href^="tel:"]').filter({ hasText: "Call" }).first();
  const telHref = await callLink.getAttribute("href");
  if (telHref?.includes("250") || telHref?.includes("788")) {
    pass("KDS: assigned driver Call tel:", telHref);
  } else {
    fail("KDS: assigned driver Call tel:", telHref ?? "");
  }
  const readyAfterAssign = await kds.getByRole("button", { name: "Mark out for delivery" }).isVisible();
  if (readyAfterAssign) {
    pass("KDS: order stays READY after assign (dispatch button still visible)");
  } else {
    fail("KDS: order stays READY after assign");
  }
  await shot(kds, "04-assign");

  // --- Bulk assign order B ---
  await advanceTicketToReady(kds, landmarkB);
  await kds.getByRole("button", { name: "Select order" }).filter({ hasText: landmarkB }).first().click({ force: true }).catch(async () => {
    const ticketB = kds.getByRole("button").filter({ hasText: landmarkB }).first();
    await ticketB.click({ force: true });
    await kds.locator('[aria-label="Select order"]').nth(1).click({ force: true });
  });
  const ticketBHeader = kds.getByRole("button").filter({ hasText: landmarkB }).first();
  await ticketBHeader.locator('[aria-label="Select order"]').click({ force: true }).catch(async () => {
    await kds.locator('[aria-label="Select order"]').last().click({ force: true });
  });
  await kds.waitForSelector("text=1 selected", { timeout: 10000 });
  await kds.getByRole("button", { name: "Assign driver" }).last().click({ force: true });
  await kds.waitForSelector(/Assign driver to \d+ orders/, { timeout: 10000 });
  await kds.getByRole("button", { name: new RegExp(`Assign to ${DRIVER_EDITED}`) }).click({
    force: true,
  });
  await kds.waitForTimeout(1500);
  await ticketBHeader.click({ force: true });
  if (await kds.getByText(DRIVER_EDITED).isVisible()) {
    pass("KDS: bulk assign driver on order B");
  } else {
    fail("KDS: bulk assign driver on order B");
  }
  await shot(kds, "05-bulk-assign");

  // --- Setup drawer auto-open cap (fresh context) ---
  const capContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await capContext.addInitScript(
    ({ key, coachIds }) => {
      localStorage.removeItem(key);
      for (const id of coachIds) {
        localStorage.setItem(`zantap:kds-coachmark-${id}`, "1");
      }
    },
    { key: VISIT_KEY, coachIds: ["menu-add", "kitchen-toggle", "dispatch-button"] }
  );
  const capPage = await capContext.newPage();
  capPage.setDefaultTimeout(45000);

  let autoOpens = 0;
  for (let visit = 1; visit <= 3; visit++) {
    await capPage.goto(`${BASE}/vendor/${SLUG}`, { waitUntil: "domcontentloaded" });
    await dismissCoachmarks(capPage);
    await capPage.waitForTimeout(1200);
    const drawerOpen = await capPage.getByText("Setup guide").isVisible().catch(() => false);
    if (drawerOpen) {
      autoOpens += 1;
      await capPage.getByRole("button", { name: "Close setup guide" }).click({ force: true });
      await capPage.waitForTimeout(400);
    }
  }
  const visitCount = await capPage.evaluate((k) => localStorage.getItem(k), VISIT_KEY);
  if (autoOpens <= 2) {
    pass("Setup cap: auto-open ≤2×", `opens=${autoOpens} visits=${visitCount ?? "0"}`);
  } else {
    fail("Setup cap: auto-open ≤2×", `opens=${autoOpens}`);
  }

  const countBeforeManual = visitCount ?? "0";
  await capPage.getByRole("button", { name: "Open setup menu" }).click({ force: true });
  await capPage.waitForSelector("text=Setup guide", { timeout: 10000 });
  const countAfterManual = await capPage.evaluate((k) => localStorage.getItem(k), VISIT_KEY);
  if ((countAfterManual ?? "0") === countBeforeManual) {
    pass("Setup cap: manual hamburger does not increment visit count");
  } else {
    fail("Setup cap: manual hamburger does not increment visit count", `${countBeforeManual} → ${countAfterManual}`);
  }
  await capContext.close();
  await shot(kds, "06-done");
} catch (err) {
  fail("Unhandled", String(err?.message ?? err));
  await shot(kds, "99-abort-kds").catch(() => {});
  await shot(shop, "99-abort-shop").catch(() => {});
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n--- ${results.length - failed.length}/${results.length} PASS ---`);
if (failed.length) {
  console.error("Failed:", failed.map((f) => f.n).join(", "));
  process.exit(1);
}
