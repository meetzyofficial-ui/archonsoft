/** Stills of the opening sequence, on the real GPU: `GPU=1 node scripts/openingshot.mjs`. */
import { chromium } from "playwright";
import fs from "node:fs";
const gpu = process.env.GPU === "1";
const browser = gpu
  ? await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1460,900"] })
  : await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
fs.mkdirSync(".qa/world", { recursive: true });
await page.goto("http://localhost:3210/tr", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);
await page.screenshot({ path: ".qa/world/open-0.png" });
await page.locator(".world-overlay[data-stage='reveal']").waitFor({ timeout: 45000 });
for (const [i, ms] of [800, 2400, 3400, 5000].entries()) {
  await page.waitForTimeout(ms);
  await page.screenshot({ path: `.qa/world/open-${i + 1}.png` });
}
console.log("overlay:", (await page.locator(".world-overlay").innerText()).replace(/\s+/g, " ").slice(0, 400));
await page.locator("[data-enter]").click();
await page.waitForTimeout(1500);
await page.screenshot({ path: ".qa/world/open-5.png" });
await page.waitForTimeout(5000);
await page.screenshot({ path: ".qa/world/open-6.png" });
console.log("hud:", (await page.locator(".world-overlay").innerText()).replace(/\s+/g, " ").slice(0, 400));
console.log("info:", JSON.stringify(await page.evaluate(() => window.__archonInfo?.())));
console.log("errors:", errors);
await browser.close();
