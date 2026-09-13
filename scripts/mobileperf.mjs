/**
 * Phone budget on the real GPU, one fresh browser per orientation so no
 * window is throttled behind another: first contentful paint, the world's
 * first drawn frame, frame time idle and steering, draw calls, triangles and
 * where the calls go.
 *
 *   node scripts/mobileperf.mjs                (Chrome emulation — not a device)
 *   ARCHON_BASE=https://archonsoft.tr node scripts/mobileperf.mjs
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const OUT = process.env.OUT ?? ".qa/final2";
fs.mkdirSync(OUT, { recursive: true });
const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const stats = (times) => {
  const sorted = [...times].sort((a, b) => a - b);
  return {
    avg: +(times.reduce((a, b) => a + b, 0) / times.length).toFixed(1),
    p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
    max: +sorted[sorted.length - 1].toFixed(1),
  };
};
const orientations = (process.env.ONLY ?? "portrait,landscape").split(",");
for (const tag of orientations) {
  const viewport = tag === "portrait" ? { width: 390, height: 844 } : { width: 844, height: 390 };
  const browser = await chromium.launch({
    headless: false,
    channel: "chrome",
    args: [`--window-size=${viewport.width + 40},${viewport.height + 160}`, "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"],
  });
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: ua });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  page.on("requestfailed", (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(() => {
    window.__worldFirstFrame = 0;
    const look = () => {
      const info = window.__archonInfo?.();
      if (info && info.calls > 0) window.__worldFirstFrame = performance.now();
      else requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  });
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 5000);
  const paint = await page.evaluate(() => ({
    fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0),
    world: Math.round(window.__worldFirstFrame),
  }));
  const sample = (n) => page.evaluate((count) => new Promise((r) => { const times = []; let last = performance.now(); const f = () => { const now = performance.now(); times.push(now - last); last = now; if (times.length < count) requestAnimationFrame(f); else r(times); }; requestAnimationFrame(f); }), n);
  const idle = stats(await sample(180));
  const budget = async () => {
    let best = null;
    for (let i = 0; i < 6; i += 1) {
      const info = await page.evaluate(() => window.__archonInfo?.());
      if (!best || info.calls > best.calls) best = info;
      await page.waitForTimeout(120);
    }
    return best;
  };
  const spawn = await budget();
  const breakdown = await page.evaluate(() => window.__archonBreakdown?.());
  const lod = await page.evaluate(() => { const l = window.__archonLod?.(); return l && { tagged: l.tagged, shown: l.shown, tiers: l.tiers }; });
  await page.screenshot({ path: `${OUT}/mobile-${tag}.png` });
  /* Steering: push the stick and drag the view, then measure. */
  const stick = await page.locator("[data-joystick]").boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const cx = stick.x + stick.width / 2, cy = stick.y + stick.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy, id: 1 }, { x: viewport.width * 0.7, y: viewport.height * 0.45, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - 38, id: 1 }, { x: viewport.width * 0.66, y: viewport.height * 0.45, id: 2 }] });
  const steering = stats(await sample(240));
  const moving = await budget();
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.screenshot({ path: `${OUT}/mobile-${tag}-moving.png` });
  const quality = await page.evaluate(() => window.__archonQuality?.());
  const top = Object.entries(breakdown ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 18);
  console.log(JSON.stringify({ tag, paint, idle, steering, spawn: { calls: spawn.calls, triangles: spawn.triangles, programs: spawn.programs }, moving: { calls: moving.calls, triangles: moving.triangles }, lod, quality: { tier: quality.tier, dpr: quality.dpr }, errors, failed }));
  console.log(`  top: ${top.map(([k, v]) => `${k}=${v}`).join(" ")}`);
  await browser.close();
}
