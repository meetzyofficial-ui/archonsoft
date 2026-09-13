/**
 * Desktop frame rate at fixed places, for comparing two builds fairly:
 * the same five standpoints, measured in turn, several rounds, medians.
 *
 *   node scripts/benchfps.mjs http://localhost:3211 http://localhost:3210
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";

const bases = process.argv.slice(2);
const ROUNDS = Number(process.env.ROUNDS ?? 3);
const SPOTS = [
  ["spawn", [0, 24, 0]],
  ["lobby", [-6, 13, 90]],
  ["shipped", [0, -40, 0]],
  ["labs", [45, 0, -90]],
  ["systems", [-45, 0, 90]],
];
const results = Object.fromEntries(bases.map((b) => [b, Object.fromEntries(SPOTS.map(([n]) => [n, []]))]));
const calls = Object.fromEntries(bases.map((b) => [b, {}]));
for (let round = 0; round < ROUNDS; round += 1) {
  for (const base of bases) {
    const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1600,950", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"] });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto(base + "/en", { waitUntil: "networkidle" });
    await enterWorld(page, "en", 5000);
    for (const [name, [x, z, d]] of SPOTS) {
      await page.evaluate(([x, z, d]) => window.__archonPlace?.(x, z, d), [x, z, d]);
      await page.waitForTimeout(1500);
      const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(n / 3); }; requestAnimationFrame(f); }));
      results[base][name].push(fps);
      calls[base][name] = await page.evaluate(() => window.__archonInfo?.());
    }
    await browser.close();
  }
}
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
for (const base of bases) {
  console.log(base);
  for (const [name] of SPOTS) console.log(`  ${name.padEnd(8)} ${median(results[base][name]).toFixed(0).padStart(4)} fps (runs ${results[base][name].map((v) => v.toFixed(0)).join("/")})  calls ${calls[base][name]?.calls} tris ${calls[base][name]?.triangles}`);
}
