import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * A still of Archon World, for the invitation on the ordinary site.
 *
 * The canvas is screenshotted on its own rather than the page, so the plate
 * carries no interface — the world's own chrome belongs in the world. It is a
 * capture of software Archon built, which is the same thing every other image
 * on this site is.
 */
const BASE = "http://localhost:3210";
const OUT = "src/assets/world";

/* On the real graphics card when there is one: the plate is a photograph of
   the place, and the software renderer does not light it the same way. */
const browser = process.env.GPU
  ? await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1820,1060"] })
  : await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({
  viewport: { width: 1800, height: 1013 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto(BASE + "/en", { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await enterWorld(page, "en", 8000);
await page.waitForTimeout(9000);
/* Look up a little, so the whole mark is in the frame over the plaza. */
await page.evaluate(() => window.__archonTurn?.(16, -12));
await page.waitForTimeout(2200);

/* Everything in the overlay except the canvas is interface, and the world's
   own interface belongs in the world. Element screenshots clip to a box, they
   do not exclude what is drawn on top, so the chrome has to go first. */
await page.evaluate(() => {
  document.querySelectorAll(".world-overlay > *").forEach((node) => {
    if (!node.querySelector("canvas")) node.style.display = "none";
  });
});
await page.waitForTimeout(900);

await fs.mkdir(OUT, { recursive: true });
const raw = path.join(OUT, ".plate-raw.png");
await page.locator(".world-overlay canvas").screenshot({ path: raw });

/* Cropped to the architecture. The lower third of the frame is empty floor —
   true to standing there, useless as an image — so the plate is the band where
   the gate, the colonnade and the sightline through to the far end all are.
   Lifted slightly, because it sits on a page that is already dark. */
const meta = await sharp(raw).metadata();
await sharp(raw)
  .extract({
    left: 0,
    top: Math.round((meta.height ?? 1013) * 0.02),
    width: meta.width ?? 1800,
    height: Math.round((meta.height ?? 1013) * 0.6),
  })
  .resize(1600, null, { withoutEnlargement: true })
  .modulate({ brightness: 1.08 })
  .jpeg({ quality: 84, chromaSubsampling: "4:4:4", mozjpeg: true })
  .toFile(path.join(OUT, "gate.jpg"));

await fs.unlink(raw);
const { size } = await fs.stat(path.join(OUT, "gate.jpg"));
console.log("gate.jpg", Math.round(size / 1024) + "kB");
await browser.close();
