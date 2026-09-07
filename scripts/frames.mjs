/**
 * Captures a scroll-driven section as a sequence of viewport frames, which is
 * the only way to actually look at choreography rather than at a tall page.
 *
 *   node scripts/frames.mjs <route> <selector> <name> <count> [w] [h]
 */
import { chromium } from "playwright";
import path from "node:path";

const [, , routeArg = "", selector = "body", name = "frames", countArg = "5", w = "1512", h = "950"] =
  process.argv;
const route = routeArg ? `/${routeArg.replace(/^\//, "")}` : "/";
const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const count = Number(countArg);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
});
await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1600);

const box = await page.locator(selector).first().evaluate((el) => {
  const rect = el.getBoundingClientRect();
  return { top: rect.top + window.scrollY, height: rect.height };
});

const span = Math.max(0, box.height - Number(h));
for (let i = 0; i < count; i += 1) {
  const target = box.top + (span * i) / (count - 1);
  await page.evaluate((y) => window.scrollTo(0, y), target);
  // Momentum scrolling owns the position, so nudge it there with wheel events.
  for (let n = 0; n < 40; n += 1) {
    const current = await page.evaluate(() => window.scrollY);
    const delta = target - current;
    if (Math.abs(delta) < 6) break;
    await page.mouse.wheel(0, Math.max(-600, Math.min(600, delta)));
    await page.waitForTimeout(45);
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(process.cwd(), ".qa", `${name}-${i}.png`) });
}

console.log(`captured ${count} frames of ${name}`);
await browser.close();
