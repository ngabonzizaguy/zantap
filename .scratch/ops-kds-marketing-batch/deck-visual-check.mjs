// Quick visual check of the ScreenCardDeck + sticky CTA + footer socials on dev.
import { chromium } from "playwright-core";

const shots = ".scratch/ops-kds-marketing-batch/deck-shots";
import { mkdirSync } from "node:fs";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });

// Mobile: hero (sticky must be absent) + footer socials
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await mob.waitForTimeout(1200);
const stickyOnHero = await mob.locator('a[href="#lead-form"].fixed').count();
console.log("sticky visible on hero (want 0):", stickyOnHero);
await mob.screenshot({ path: `${shots}/mobile-hero.png` });
await mob.locator("#footer").scrollIntoViewIfNeeded();
await mob.waitForTimeout(800);
await mob.screenshot({ path: `${shots}/mobile-footer.png` });
const socialCount = await mob.locator('nav[aria-label="Social links"] > *').count();
console.log("footer social icons rendered (want 7):", socialCount);

// Desktop: the deck section, two moments to confirm cycling
const desk = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await desk.goto("http://localhost:3000/", { waitUntil: "networkidle" });
const deck = desk.locator('[aria-roledescription="carousel"]');
await deck.scrollIntoViewIfNeeded();
await desk.waitForTimeout(1500);
await desk.screenshot({ path: `${shots}/deck-1.png` });
await desk.waitForTimeout(3800);
await desk.screenshot({ path: `${shots}/deck-2.png` });
const cardCount = await desk.locator("[data-deck-card]").count();
console.log("deck cards (want 3):", cardCount);

await browser.close();
console.log("DONE");
