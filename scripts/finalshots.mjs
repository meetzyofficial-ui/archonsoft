/**
 * The final visual pass on the real GPU: the robot, the lobby and its team,
 * an LED close-up, every department's room, the campus, the fire path and
 * the comet on a desktop; then a phone in portrait and landscape.
 *
 *   node scripts/finalshots.mjs [outDir]    (Chrome emulation for the phone — not a device)
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const OUT = process.argv[2] ?? ".qa/final2/shots";
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const watch = (page) => {
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
};

/* Where each room is entered from, and which way the visitor then faces. */
const ROOMS = {
  web: [[-13, -62], [-4.5, -62]],
  design: [[0, 52], [0, 43.5]],
  ai: [[58, -6], [49.5, -6]],
  "3d": [[58, 6], [49.5, 6]],
  marketing: [[17, -8], [8.5, -8]],
  video: [[0, 74], [0, 65.5]],
  commerce: [[13, -62], [4.5, -62]],
  enterprise: [[-62, -17], [-53.5, -17]],
  consulting: [[-17, -8], [-8.5, -8]],
  innovation: [[-15, -34], [-6.5, -34]],
  lobby: [[-14.5, 13], [-6, 13]],
};
const standAt = (room, back = 1.5) => {
  const [[ax, az], [rx, rz]] = ROOMS[room];
  const len = Math.hypot(rx - ax, rz - az);
  const x = rx + ((rx - ax) / len) * back;
  const z = rz + ((rz - az) / len) * back;
  const yaw = Math.atan2(-(ax - rx), -(az - rz));
  return [x, z, (yaw * 180) / Math.PI];
};

async function view(page, name, [x, z, deg], zoom = [4.2, 2.2], pitch, wait = 1800) {
  await page.evaluate(([x, z, d]) => window.__archonPlace?.(x, z, d), [x, z, deg]);
  await page.evaluate(([b, u]) => window.__archonZoom?.(b, u), zoom);
  if (pitch !== undefined) await page.evaluate((p) => window.__archonTurn?.(0, p), pitch);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

/* ---------------------------------------------------------------- desktop */
{
  const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1460,900", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  watch(page);
  await page.goto(BASE + "/tr", { waitUntil: "networkidle" });
  await enterWorld(page, "tr", 6000);
  await page.screenshot({ path: `${OUT}/d-spawn.png` });
  await view(page, "d-robot", [0, 18, 180], [3.2, 1.7], 2);
  await view(page, "d-robot-fire", [0, 18, 160], [2.2, 1.9], 4);
  await view(page, "d-lobby", [0, 30, 0], [7, 4], 8);
  await view(page, "d-lobby-employees", standAt("lobby", 0), [2.6, 1.9], 14);
  await view(page, "d-led-closeup", [9, 24, -90], [2.2, 1.7], 4);
  for (const room of ["web", "ai", "3d", "design", "video", "enterprise", "marketing", "consulting", "innovation", "commerce"]) {
    await view(page, `d-${room}`, standAt(room, 1), [3.6, 2.4], 12);
  }
  await view(page, "d-glass-buildings", [0, 40, 0], [6, 6], -14);
  await view(page, "d-trees", [-20, 20, 60], [5, 3], 8);
  await view(page, "d-fire-path", [0, 36, 0], [4, 2.4], 2);
  await page.evaluate(() => window.__archonComet?.());
  let best = null;
  for (let i = 0; i < 20; i += 1) {
    await page.waitForTimeout(250);
    const c = await page.evaluate(() => window.__archonCometView?.());
    if (c?.visible && Math.abs(c.x) < 0.35) {
      best = c;
      break;
    }
  }
  await page.screenshot({ path: `${OUT}/d-comet.png` });
  console.log("comet", JSON.stringify(best));
  await browser.close();
}

/* ------------------------------------------------------------------ phone */
const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
for (const [tag, viewport] of [["portrait", { width: 390, height: 844 }], ["landscape", { width: 844, height: 390 }]]) {
  const browser = await chromium.launch({ headless: false, channel: "chrome", args: [`--window-size=${viewport.width + 60},${viewport.height + 180}`, "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: ua });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 5000);
  await page.screenshot({ path: `${OUT}/m-${tag}.png` });
  await view(page, `m-${tag}-led`, [9, 24, -90], [3, 1.8], 6);
  await view(page, `m-${tag}-robot`, [0, 18, 180], [3.0, 1.5], 2);
  /* The lobby team on a phone; the brief itself is photographed by leads.mjs (leads-mobile-form.png). */
  await view(page, `m-${tag}-lobby`, standAt("lobby", 0), [3, 1.9], 10);
  await browser.close();
}
console.log("errors", JSON.stringify(errors));
