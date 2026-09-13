/**
 * People, up close and at a distance, on the real GPU: the merged rig, its
 * tiers and the draw calls they cost. `node scripts/npcprobe.mjs [tag]`
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const tag = process.argv[2] ?? "npc";
fs.mkdirSync(".qa/final2", { recursive: true });
const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1460,900", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
await page.goto(BASE + "/en", { waitUntil: "networkidle" });
await enterWorld(page, "en", 6000);
const report = async (label) => {
  const info = await page.evaluate(() => window.__archonInfo?.());
  const lod = await page.evaluate(() => { const l = window.__archonLod?.(); return l && { tagged: l.tagged, shown: l.shown, tiers: l.tiers, faces: l.faces.length }; });
  console.log(label, JSON.stringify(info), JSON.stringify(lod));
};
await report("spawn");
await page.screenshot({ path: `.qa/final2/${tag}-spawn.png` });
const shots = [
  ["lobby-team", [-8.5, 13, 90], [2.6, 1.5]],
  ["lobby-close", [-10.5, 13.5, 90], [1.6, 1.45]],
  ["host", [9.5, 23.5, 180], [2.2, 1.5]],
  ["web-office", [-13, -55, 180], [3.2, 1.8]],
];
for (const [name, at, zoom] of shots) {
  await page.evaluate(([x, z, d]) => window.__archonPlace?.(x, z, d), at);
  await page.evaluate(([b, u]) => window.__archonZoom?.(b, u), zoom);
  await page.waitForTimeout(1800);
  await report(name);
  await page.screenshot({ path: `.qa/final2/${tag}-${name}.png` });
}
console.log("errors", JSON.stringify(errors));
await browser.close();
