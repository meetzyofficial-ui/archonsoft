/**
 * Where the first seconds go, on a phone.
 *
 * Emulates a portrait phone with a 4× CPU slowdown, opens the world and
 * records every animation frame from the first paint through the opening,
 * the entry and the first three seconds of steering. Long frames are
 * listed against what the page was doing at the time; a CPU profile of the
 * same span is aggregated by function so a spike has a name.
 *
 *   GPU=1 node scripts/bootprofile.mjs            (real GPU, headed Chrome)
 *   ARCHON_BASE=https://archonsoft.tr GPU=1 node scripts/bootprofile.mjs
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const gpu = process.env.GPU === "1";
const SLOW = Number(process.env.SLOW ?? 4);
const browser = gpu
  ? await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1200,1000", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] })
  : await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] });
const ua =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: ua,
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: SLOW });
await cdp.send("Profiler.enable");
await cdp.send("Profiler.setSamplingInterval", { interval: 500 });

/* The frame recorder runs from before the first script of the page. */
await page.addInitScript(() => {
  const w = window;
  w.__frames = [];
  w.__marks = [];
  let last = performance.now();
  const tick = () => {
    const now = performance.now();
    w.__frames.push([now, now - last]);
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  w.__mark = (name) => w.__marks.push([performance.now(), name]);
  /* Stage changes on the world overlay, as they happen. */
  const watch = () => {
    const root = document.querySelector("[data-stage]");
    if (!root) return requestAnimationFrame(watch);
    let stage = root.getAttribute("data-stage");
    w.__mark(`stage:${stage}`);
    new MutationObserver(() => {
      const next = root.getAttribute("data-stage");
      if (next !== stage) {
        stage = next;
        w.__mark(`stage:${stage}`);
      }
    }).observe(root, { attributes: true, attributeFilter: ["data-stage"] });
    const canvas = () => {
      if (document.querySelector("canvas")) return w.__mark("canvas");
      requestAnimationFrame(canvas);
    };
    canvas();
  };
  watch();
});

await cdp.send("Profiler.start");
await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
/* Calibration: a named busy loop at a known performance.now(), so the CPU
   profile's own clock can be laid over the page's frame times. */
const calibratedAt = await page.evaluate(() => {
  const t0 = performance.now();
  const __archonCalibrate = () => {
    const end = performance.now() + 60;
    let x = 0;
    while (performance.now() < end) x += 1;
    return x;
  };
  __archonCalibrate();
  return t0;
});
await enterWorld(page, "tr", 0);
await page.evaluate(() => window.__mark("entered"));
await page.waitForTimeout(3500);
/* Turn the view, so what was behind the camera is drawn for the first time. */
await page.evaluate(() => window.__mark("turn"));
for (let i = 0; i < 6; i += 1) {
  await page.evaluate((deg) => window.__archonTurn?.(deg, 0), 60 * (i + 1));
  await page.waitForTimeout(250);
}
const { profile } = await cdp.send("Profiler.stop");

const { frames, marks, info } = await page.evaluate(() => ({
  frames: window.__frames,
  marks: window.__marks,
  info: window.__archonInfo?.(),
}));

const origin = marks.find(([, name]) => name === "canvas")?.[0] ?? frames[0][0];
const at = (time) => `${((time - origin) / 1000).toFixed(2)}s`;
const during = (time) => {
  let current = "before";
  for (const [when, name] of marks) if (when <= time) current = name;
  return current;
};
console.log(`\n== marks (from canvas mount) ==`);
for (const [when, name] of marks) console.log(`  ${at(when).padStart(7)}  ${name}`);

const long = frames.filter(([, gap]) => gap > 50);
console.log(`\n== long frames (>50ms): ${long.length} ==`);
for (const [when, gap] of long.slice(0, 40)) console.log(`  ${at(when).padStart(7)}  ${gap.toFixed(0).padStart(5)}ms  during ${during(when)}`);

const entered = marks.find(([, name]) => name === "entered")?.[0] ?? 0;
const first = frames.filter(([when]) => when > entered && when < entered + 3000).map(([, gap]) => gap);
const sorted = [...first].sort((a, b) => a - b);
const avg = first.reduce((a, b) => a + b, 0) / Math.max(1, first.length);
console.log(
  `\n== first 3s after entering: ${first.length} frames · avg ${avg.toFixed(1)}ms · p95 ${sorted[Math.floor(sorted.length * 0.95)]?.toFixed(0)}ms · max ${sorted[sorted.length - 1]?.toFixed(0)}ms · >50ms: ${first.filter((g) => g > 50).length} ==`,
);
console.log(`info ${JSON.stringify(info)}`);

/* The profile, by function, across the whole span and across the entry. */
const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
const self = new Map();
for (let i = 0; i < profile.samples.length; i += 1) {
  const node = nodes.get(profile.samples[i]);
  const frame = node.callFrame;
  const name = `${frame.functionName || "(anonymous)"} ${frame.url.split("/").pop().split("?")[0]}:${frame.lineNumber}`;
  self.set(name, (self.get(name) ?? 0) + profile.timeDeltas[i]);
}
const top = [...self.entries()]
  .filter(([name]) => !name.startsWith("(idle)") && !name.startsWith("(program)") && !name.startsWith("(garbage"))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 22);
console.log(`\n== CPU self time, top functions (whole run, ${SLOW}× slowdown) ==`);
for (const [name, micros] of top) console.log(`  ${(micros / 1000).toFixed(0).padStart(6)}ms  ${name}`);

/* Each long frame, attributed: what the CPU was doing inside it — self time
   by function, and the application functions it was spent under. */
{
  const parent = new Map();
  for (const node of profile.nodes) for (const child of node.children ?? []) parent.set(child, node.id);
  let clock = profile.startTime;
  const times = profile.timeDeltas.map((d) => (clock += d));
  const calib = profile.samples.findIndex((id) => nodes.get(id).callFrame.functionName === "__archonCalibrate");
  if (calib < 0) {
    console.log("(no calibration sample; attribution skipped)");
  } else {
    const offset = calibratedAt - times[calib] / 1000;
    const label = (frame) => `${frame.functionName || "(anonymous)"} ${frame.url.split("/").pop().split("?")[0]}:${frame.lineNumber}`;
    const GENERIC = /^\((idle|program|garbage collector|root)\)|^\(anonymous\)/;
    const worst = [...long].sort((a, b) => b[1] - a[1]).slice(0, Number(process.env.SPIKES ?? 6));
    for (const [end, gap] of worst) {
      const start = end - gap;
      const own = new Map();
      const under = new Map();
      let total = 0;
      for (let i = 0; i < profile.samples.length; i += 1) {
        const when = times[i] / 1000 + offset;
        if (when < start || when > end) continue;
        const dt = (profile.timeDeltas[i + 1] ?? profile.timeDeltas[i]) / 1000;
        total += dt;
        const node = nodes.get(profile.samples[i]);
        own.set(label(node.callFrame), (own.get(label(node.callFrame)) ?? 0) + dt);
        const seen = new Set();
        for (let id = node.id; id !== undefined; id = parent.get(id)) {
          const frame = nodes.get(id).callFrame;
          if (!frame.functionName || GENERIC.test(frame.functionName) || seen.has(frame.functionName)) continue;
          seen.add(frame.functionName);
          under.set(frame.functionName, (under.get(frame.functionName) ?? 0) + dt);
        }
      }
      const fmt = (map, n) => [...map.entries()].filter(([k]) => !GENERIC.test(k)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${v.toFixed(0)}ms ${k}`).join(" | ");
      console.log(`
== spike ${at(end)} ${gap.toFixed(0)}ms during ${during(end)} (sampled ${total.toFixed(0)}ms) ==`);
      console.log(`  self:  ${fmt(own, 8)}`);
      console.log(`  under: ${fmt(under, 14)}`);
    }
  }
}

await browser.close();
