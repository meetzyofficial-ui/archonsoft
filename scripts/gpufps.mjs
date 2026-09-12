/** A real-GPU measurement: headed Chrome, hardware acceleration on. */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1600,950"] }).catch(async (e) => {
  console.log("chrome channel unavailable:", e.message.split("\n")[0]);
  return chromium.launch({ headless: false, args: ["--window-size=1600,950"] });
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto((process.env.ARCHON_BASE ?? "http://localhost:3210") + "/en", { waitUntil: "networkidle" });
const gpu = await page.evaluate(() => {
  const c = document.createElement("canvas");
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  const ext = gl?.getExtension("WEBGL_debug_renderer_info");
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER);
});
console.log("renderer:", gpu);
await enterWorld(page, "en", 6000);
/* The budget of a typical frame: the smallest of five samples, so a frame
   that also rendered the reflection cube does not stand for the rest. */
const budget = async () => {
  let best = null;
  for (let i = 0; i < 5; i += 1) {
    const info = await page.evaluate(() => window.__archonInfo?.());
    if (!best || info.calls < best.calls) best = info;
    await page.waitForTimeout(250);
  }
  return JSON.stringify(best);
};
const measure = () => page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(Math.round(n / 3)); }; requestAnimationFrame(f); }));
console.log("spawn fps:", await measure(), await budget());
if (process.env.BREAKDOWN) console.log("spawn breakdown:", JSON.stringify(await page.evaluate(() => window.__archonBreakdown?.())));
await page.mouse.click(800, 450);
await page.keyboard.down("Shift"); await page.keyboard.down("w"); await page.waitForTimeout(9000); await page.keyboard.up("w"); await page.keyboard.up("Shift");
console.log("shipped fps:", await measure(), await budget());
if (process.env.BREAKDOWN) console.log("shipped breakdown:", JSON.stringify(await page.evaluate(() => window.__archonBreakdown?.())));
await browser.close();
