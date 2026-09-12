/** Scroll-through capture: a stack of viewport frames for a route. */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3210";
const out = path.join(process.cwd(), ".qa", "look");
fs.mkdirSync(out, { recursive: true });

const jobs = process.argv.slice(2).map((a) => {
  const [route, tag, w = "1512", h = "950", frames = "6"] = a.split("|");
  return { route: "/" + route.replace(/^\//, ""), tag, w: +w, h: +h, frames: +frames };
});

const browser = await chromium.launch();
for (const job of jobs) {
  const page = await browser.newPage({
    viewport: { width: job.w, height: job.h },
    deviceScaleFactor: 1,
  });
  // The world opens itself over the home page on a first visit; these
  // captures are of the site, so it is dismissed before the first frame.
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("archon-world-dismissed", "1");
    } catch {}
  });
  await page.goto(`${BASE}${job.route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  const total = await page.evaluate(() => document.body.scrollHeight);
  const step = Math.max((total - job.h) / Math.max(job.frames - 1, 1), 1);
  for (let i = 0; i < job.frames; i += 1) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(step * i));
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, `${job.tag}-${i}.png`) });
  }
  await page.close();
  console.log(job.tag, "->", job.frames, "frames, page height", total);
}
await browser.close();
