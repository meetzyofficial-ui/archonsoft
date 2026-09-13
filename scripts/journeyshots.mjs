/**
 * The visitor's journey, photographed at every step on the real GPU —
 * desktop, phone portrait and phone landscape — with frame timing through
 * each step: spawn, the mark, the lobby, approaching a department, the
 * team's card, choosing a department, the teleport, the office, the brief,
 * and back to the world. Nothing is submitted.
 *
 *   node scripts/journeyshots.mjs [outDir]   (phones are Chrome emulation — not devices)
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const OUT = process.argv[2] ?? ".qa/final4/journey";
fs.mkdirSync(OUT, { recursive: true });
const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

for (const [tag, viewport, phone] of [
  ["desktop", { width: 1440, height: 860 }, false],
  ["portrait", { width: 390, height: 844 }, true],
  ["landscape", { width: 844, height: 390 }, true],
]) {
  const browser = await chromium.launch({ headless: false, channel: "chrome", args: [`--window-size=${viewport.width + 60},${viewport.height + 180}`, "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
  const ctx = await browser.newContext(phone ? { viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: ua } : { viewport });
  const page = await ctx.newPage();
  await page.bringToFront();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 160));
  });
  await page.addInitScript(() => {
    window.__gaps = [];
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      window.__gaps.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const timing = [];
  const step = async (name, action, wait = 1400) => {
    await page.evaluate(() => (window.__gaps.length = 0));
    await action();
    await page.waitForTimeout(wait);
    const gaps = await page.evaluate(() => window.__gaps.slice());
    const sorted = [...gaps].sort((a, b) => a - b);
    timing.push(`${name}: p95 ${sorted[Math.floor(sorted.length * 0.95)]?.toFixed(0)}ms max ${sorted[sorted.length - 1]?.toFixed(0)}ms`);
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png` });
  };
  const card = page.locator("[data-office-card]");

  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await step("01-opening", () => page.locator("[data-enter]").waitFor({ state: "visible", timeout: 45000 }), 1500);
  await step("02-spawn", () => enterWorld(page, "tr", 0), 3000);
  await step("03-logo", () => page.evaluate(() => { window.__archonPlace?.(0, 22, 0); window.__archonTurn?.(0, -18); }));
  await step("04-lobby", () => page.evaluate(() => { window.__archonTurn?.(0, 6); window.__archonPlace?.(-3, 16, 70); }));
  await step("05-approach", () => page.evaluate(() => window.__archonPlace?.(-8.5, 13, 90)));
  await step("06-dialogue", async () => {
    if (phone) await page.locator("[data-touch-act]").tap();
    else await page.keyboard.press("e");
  }, 1200);
  await step("07-services", async () => {
    if (phone) await card.locator("[data-department='commerce']").tap();
    else await page.keyboard.press("g");
  }, 600);
  await step("08-teleport", async () => {}, 900);
  await step("09-office", async () => {}, 3200);
  await step("10-service", async () => {
    const first = card.locator("[data-service]").first();
    if (phone) await first.tap();
    else await first.click();
  }, 900);
  await step("11-form", async () => {
    const more = card.locator("[data-office-more]");
    if (await more.count()) await (phone ? more.tap() : more.click());
  }, 700);
  await step("12-return", async () => {
    const close = card.locator("[data-office-close]");
    if (await close.count()) await (phone ? close.tap() : close.click());
  }, 1500);
  console.log(`${tag}: office ${await card.getAttribute("data-office").catch(() => null)} · errors ${JSON.stringify(errors)}`);
  for (const line of timing) console.log(`  ${line}`);
  await browser.close();
}
