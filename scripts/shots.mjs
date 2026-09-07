/**
 * Targeted element captures at full resolution, for looking at craft rather
 * than layout: `node scripts/shots.mjs <route> <selector> <outName> [viewport]`
 */
import { chromium } from "playwright";
import path from "node:path";

// Route is passed without a leading slash so the shell cannot rewrite it
// into a Windows path on the way in.
const [, , routeArg = "", selector = "body", name = "shot", width = "1512", height = "950"] =
  process.argv;
const route = routeArg ? `/${routeArg.replace(/^\//, "")}` : "/";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(height) },
  deviceScaleFactor: 1,
});

await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);

const view = Number(height);
const total = await page.evaluate(() => document.body.scrollHeight);
for (let i = 0; i < Math.ceil(total / (view * 0.7)); i += 1) {
  await page.mouse.wheel(0, view * 0.7);
  await page.waitForTimeout(150);
}
await page.waitForTimeout(800);

const target = page.locator(selector).first();
await target.scrollIntoViewIfNeeded();
await page.waitForTimeout(1200);
await target.screenshot({ path: path.join(process.cwd(), ".qa", `${name}.png`) });

console.log("captured", name);
await browser.close();
