/** Mobile stills on the real GPU: portrait and landscape, touch controls up. `GPU=1 node scripts/mobileshot.mjs` */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";
const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const gpu = process.env.GPU === "1";
const browser = gpu
  ? await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1200,1000"] })
  : await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] });
const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
fs.mkdirSync(".qa/world", { recursive: true });
for (const [tag, viewport] of [["portrait", { width: 390, height: 844 }], ["landscape", { width: 844, height: 390 }]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: ua });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  const t0 = Date.now();
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  const painted = Date.now() - t0;
  await enterWorld(page, "tr", 4000);
  await page.screenshot({ path: `.qa/world/mobile-${tag}.png` });
  /* Frame time while steering: push the stick and drag the view. */
  const stick = await page.locator("[data-joystick]").boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const cx = stick.x + stick.width / 2, cy = stick.y + stick.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy, id: 1 }, { x: viewport.width * 0.7, y: viewport.height * 0.45, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - 38, id: 1 }, { x: viewport.width * 0.6, y: viewport.height * 0.45, id: 2 }] });
  const frames = await page.evaluate(() => new Promise((r) => { const times = []; let last = performance.now(); const f = () => { const now = performance.now(); times.push(now - last); last = now; if (times.length < 90) requestAnimationFrame(f); else r(times); }; requestAnimationFrame(f); }));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.screenshot({ path: `.qa/world/mobile-${tag}-moving.png` });
  const sorted = [...frames].sort((a, b) => a - b);
  const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
  console.log(`${tag}: first paint ${painted}ms · steering frame ${avg.toFixed(1)}ms avg / ${sorted[Math.floor(sorted.length * 0.95)].toFixed(1)}ms p95 / ${sorted[sorted.length - 1].toFixed(1)}ms max · info ${JSON.stringify(await page.evaluate(() => window.__archonInfo?.()))} · errors ${JSON.stringify(errors)}`);
  await ctx.close();
}
await browser.close();
