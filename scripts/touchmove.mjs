/**
 * How the explorer moves, measured: on a phone by the stick (half push, full
 * push held), on a desktop by the keys (W, Shift+W) — time to 90% of speed,
 * steady speed, time and distance to stop after release, and whether the
 * body faces the way it goes.
 *
 *   node scripts/touchmove.mjs            (headed Chrome; the phone is emulated — not a device)
 *   EXPECT=1 node scripts/touchmove.mjs   (also assert the responsive-mobile targets)
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
let failed = 0;
const check = (name, ok, note = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
  if (!ok) failed += 1;
};

/** Sample the body every frame for `ms`, starting now. */
const sampler = (page, ms) =>
  page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        const out = [];
        const t0 = performance.now();
        const tick = () => {
          const now = performance.now();
          const b = window.__archonBody?.();
          if (b) out.push([now, b.x, b.z, b.facing]);
          if (now - t0 < ms) requestAnimationFrame(tick);
          else resolve(out);
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );

function analyse(samples, pressAt, releaseAt) {
  const speeds = [];
  for (let i = 1; i < samples.length; i += 1) {
    const [t, x, z, facing] = samples[i];
    const [t0, x0, z0] = samples[i - 1];
    const dt = (t - t0) / 1000;
    if (dt <= 0) continue;
    const vx = (x - x0) / dt;
    const vz = (z - z0) / dt;
    speeds.push({ t, v: Math.hypot(vx, vz), vx, vz, facing });
  }
  const held = speeds.filter((s) => s.t > pressAt && s.t < releaseAt);
  const steadyWindow = held.filter((s) => s.t > releaseAt - 300);
  const steady = steadyWindow.reduce((a, s) => a + s.v, 0) / Math.max(1, steadyWindow.length);
  const reach = held.find((s) => s.v >= steady * 0.9);
  const after = speeds.filter((s) => s.t >= releaseAt);
  const stop = after.find((s) => s.v < 0.1);
  const releaseSample = samples.find(([t]) => t >= releaseAt);
  const stopSample = stop ? samples.find(([t]) => t >= stop.t) : null;
  const stopDistance = releaseSample && stopSample ? Math.hypot(stopSample[1] - releaseSample[1], stopSample[2] - releaseSample[2]) : null;
  /* Facing against travel, over the steady part: the body faces +z at yaw 0 for the robot's convention of -z forward. */
  const aligned = steadyWindow.every((s) => {
    const f = [-Math.sin(s.facing), -Math.cos(s.facing)];
    return (f[0] * s.vx + f[1] * s.vz) / Math.max(1e-6, s.v) > 0.9;
  });
  return {
    steady: +steady.toFixed(2),
    to90: reach ? Math.round(reach.t - pressAt) : null,
    toStop: stop ? Math.round(stop.t - releaseAt) : null,
    stopDistance: stopDistance === null ? null : +stopDistance.toFixed(2),
    aligned,
  };
}

const results = {};

/* ------------------------------------------------------------------ phone */
{
  const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=460,1020", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: ua });
  const page = await ctx.newPage();
  await page.bringToFront();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 4000);
  const cdp = await ctx.newCDPSession(page);
  const stick = await page.locator("[data-joystick]").boundingBox();
  const cx = stick.x + stick.width / 2;
  const cy = stick.y + stick.height / 2;
  /* Calibrate: how far a dispatched touch moves the stick is measured, not
     assumed — the stick reports its own magnitude through the walking loop. */
  const stickFor = async (offset) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - offset, id: 1 }] });
    await page.waitForTimeout(120);
    const value = await page.evaluate(() => window.__archonMove?.().stick ?? 0);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(200);
    return value;
  };
  let halfOffset = 20;
  for (let guess = 0; guess < 12; guess += 1) {
    const value = await stickFor(halfOffset);
    if (Math.abs(value - 0.5) < 0.04) break;
    halfOffset *= value > 0 ? 0.5 / value : 2;
  }
  let fullOffset = 40;
  while ((await stickFor(fullOffset)) < 0.99 && fullOffset < 400) fullOffset += 20;
  results["stick calibration"] = { halfOffset: Math.round(halfOffset), fullOffset };
  const radius = 1;
  for (const [name, amount, hold] of [["half", halfOffset, 1200], ["full", fullOffset, 1600]]) {
    await page.evaluate(() => window.__archonPlace?.(0, 18, 0));
    await page.waitForTimeout(600);
    const sampling = sampler(page, hold + 1300);
    await page.waitForTimeout(250);
    const pressAt = await page.evaluate(() => performance.now());
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - radius * amount, id: 1 }] });
    await page.waitForTimeout(hold);
    const releaseAt = await page.evaluate(() => performance.now());
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const samples = await sampling;
    results[`phone ${name}`] = analyse(samples, pressAt, releaseAt);
  }
  /* Reverse: push forward, then pull straight back — the body turns and goes. */
  await page.evaluate(() => window.__archonPlace?.(0, 18, 0));
  await page.waitForTimeout(600);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - halfOffset * 1.4, id: 1 }] });
  await page.waitForTimeout(700);
  const sampling = sampler(page, 900);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy + halfOffset * 1.4, id: 1 }] });
  const reverse = await sampling;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const first = reverse[0];
  const last = reverse[reverse.length - 1];
  const turned = reverse.find(([, , , facing]) => Math.abs(Math.atan2(Math.sin(facing - Math.PI), Math.cos(facing - Math.PI))) < 0.35);
  results["phone reverse"] = { movedBack: +(last[2] - first[2]).toFixed(2), facesBackAfter: turned ? Math.round(turned[0] - first[0]) : null };
  results["phone errors"] = errors.length;
  await browser.close();
}

/* ---------------------------------------------------------------- desktop */
{
  const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1460,900", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  await page.bringToFront();
  await page.goto(BASE + "/tr", { waitUntil: "networkidle" });
  await enterWorld(page, "tr", 4000);
  for (const [name, shift] of [["walk", false], ["run", true]]) {
    await page.evaluate(() => window.__archonPlace?.(0, 18, 0));
    await page.waitForTimeout(600);
    const sampling = sampler(page, 2600);
    await page.waitForTimeout(250);
    if (shift) await page.keyboard.down("Shift");
    const pressAt = await page.evaluate(() => performance.now());
    await page.keyboard.down("w");
    await page.waitForTimeout(1400);
    const releaseAt = await page.evaluate(() => performance.now());
    await page.keyboard.up("w");
    if (shift) await page.keyboard.up("Shift");
    results[`desktop ${name}`] = analyse(await sampling, pressAt, releaseAt);
  }
  await browser.close();
}

for (const [name, r] of Object.entries(results)) console.log(`${name.padEnd(15)} ${JSON.stringify(r)}`);

if (process.env.EXPECT) {
  const full = results["phone full"];
  const half = results["phone half"];
  check("phone: the full stick, held at the rim, runs well above the old 6.4 m/s", full.steady >= 8.0, `${full.steady} m/s`);
  check("phone: half a push walks briskly", half.steady >= 3.2, `${half.steady} m/s`);
  check("phone: up to speed almost at once (≤ 120 ms to 90%)", half.to90 !== null && half.to90 <= 120, `${half.to90} ms`);
  check("phone: stops almost at once on release (≤ 150 ms)", full.toStop !== null && full.toStop <= 150 && half.toStop <= 150, `${half.toStop} / ${full.toStop} ms`);
  check("phone: the body faces where it goes", full.aligned && half.aligned);
  check("phone: pulling back turns and goes back promptly", results["phone reverse"].movedBack > 0.5 && results["phone reverse"].facesBackAfter !== null && results["phone reverse"].facesBackAfter < 500, JSON.stringify(results["phone reverse"]));
  check("phone: no page errors", results["phone errors"] === 0);
  check("desktop walk unchanged (≈ 4.2 m/s)", Math.abs(results["desktop walk"].steady - 4.2) < 0.25, `${results["desktop walk"].steady} m/s`);
  check("desktop run unchanged (≈ 7.4 m/s)", Math.abs(results["desktop run"].steady - 7.4) < 0.35, `${results["desktop run"].steady} m/s`);
  process.exit(failed ? 1 : 0);
}
