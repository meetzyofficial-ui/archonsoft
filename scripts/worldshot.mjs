/**
 * Walk into Archon World and take stills: `node scripts/worldshot.mjs <tag> [steps...]`
 * A step is `key:ms` (hold a key), `turn:deg` (yaw), or `wait:ms`.
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3210";
const [, , tag = "world", ...steps] = process.argv;
const out = path.join(process.cwd(), ".qa", "world");
fs.mkdirSync(out, { recursive: true });

/* `GPU=1` runs headed Chrome on the real graphics card; the default is the
   software renderer, which is enough for layout but not for judging light. */
const browser = process.env.GPU
  ? await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1460,900"] })
  : await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("console.error:", m.text().slice(0, 200)); });
await page.goto(BASE + "/en", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await enterWorld(page, process.env.LANG_WORLD || "en", 7000);
await page.screenshot({ path: path.join(out, `${tag}-0.png`) });

let shot = 1;
for (const step of steps) {
  const [kind, value] = step.split(":");
  if (kind === "wait") await page.waitForTimeout(Number(value));
  else if (kind === "shot") { await page.screenshot({ path: path.join(out, `${tag}-${shot++}.png`) }); }
  else if (kind === "press") { await page.keyboard.press(value); await page.waitForTimeout(900); }
  else if (kind === "shiftdown") { await page.keyboard.down("Shift"); }
  else if (kind === "shiftup") { await page.keyboard.up("Shift"); }
  else if (kind === "zoom") { const [b, u] = String(value).split(",").map(Number); await page.evaluate(([bb, uu]) => window.__archonZoom?.(bb, uu), [b, u]); await page.waitForTimeout(900); }
  else if (kind === "info") { console.log("INFO:", JSON.stringify(await page.evaluate(() => window.__archonInfo?.()))); }
  else if (kind === "text") { console.log("TEXT:", (await page.locator(".world-overlay").innerText()).replace(/\s+/g, " ").slice(0, 600)); }
  else if (kind === "turn") {
    // No pointer lock in headless; yaw through the exposed debug hook if present.
    const [deg, pitch] = String(value).split(",").map(Number);
    await page.evaluate(([d, p]) => window.__archonTurn?.(d, p), [deg, pitch]);
    await page.waitForTimeout(200);
  } else {
    await page.keyboard.down(kind);
    await page.waitForTimeout(Number(value));
    await page.keyboard.up(kind);
    await page.waitForTimeout(400);
  }
}
const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n / 2)); }; requestAnimationFrame(f); }));
console.log(tag, "fps~", fps);
await browser.close();
