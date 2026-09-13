/**
 * The world on a device that runs short: what it holds, and what happens
 * when starting fails.
 *
 *  - a phone's textures and canvases stay inside a memory budget, and the
 *    canvases are let go once uploaded;
 *  - the loading reaches 100% and the world is revealed and entered, on a
 *    phone with its CPU throttled, without a page error;
 *  - a start the device killed (the boot's note left behind, as a crash
 *    leaves it) starts again in the safe tier, and the world still opens;
 *  - two in a row show the fallback, whose TEKRAR DENE builds the world;
 *  - leaving normally mid-start is not counted as a failure;
 *  - a lost graphics context that comes back rebuilds the scene; one that
 *    does not shows the fallback, not an empty screen.
 *
 * The phone is Chrome's emulation: this checks the code paths, not a device.
 *
 *   node scripts/crashsafe.mjs
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

const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=450,1020", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
const phone = async (note) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: ua });
  if (note) {
    /* Written once, before the page's own scripts, as a killed start leaves it. */
    await ctx.addInitScript((value) => {
      if (!sessionStorage.getItem("seeded")) {
        sessionStorage.setItem("seeded", "1");
        localStorage.setItem("archon-world-boot", JSON.stringify({ ...value, at: Date.now() }));
      }
    }, note);
  }
  const page = await ctx.newPage();
  await page.bringToFront();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 160));
  });
  return { ctx, page, errors };
};
const stage = (page) => page.evaluate(() => document.querySelector(".world-overlay")?.getAttribute("data-stage"));
const waitStage = (page, want, timeout = 60000) =>
  page.waitForFunction((w) => document.querySelector(".world-overlay")?.getAttribute("data-stage") === w, want, { timeout }).then(() => true, () => false);

/* ---------------------------------------------- budget, and 100% → world */
{
  const { ctx, page, errors } = await phone();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const gaps = [];
  await page.exposeFunction("__gap", (g) => gaps.push(g));
  await page.addInitScript(() => {
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      if (now - last > 250) window.__gap?.(Math.round(now - last));
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  const revealed = await waitStage(page, "reveal", 90000);
  check("throttled phone: loading reaches the reveal", revealed);
  const memory = await page.evaluate(() => {
    const scene = window.__archonScene();
    const seen = new Set();
    let gpu = 0;
    let canvases = 0;
    scene.traverse((o) => {
      for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) {
        for (const k of Object.keys(m)) {
          const t = m[k];
          if (!t?.isTexture || seen.has(t)) continue;
          seen.add(t);
          const [w, h] = t.userData.texels ?? [t.image?.width ?? 0, t.image?.height ?? 0];
          gpu += w * h * 4 * (t.generateMipmaps === false ? 1 : 4 / 3);
          if (t.image instanceof HTMLCanvasElement) canvases += t.image.width * t.image.height * 4;
        }
      }
    });
    return { gpuMB: Math.round(gpu / 1048576), canvasMB: Math.round(canvases / 1048576), quality: window.__archonQuality() };
  });
  check("phone: textures on the GPU within 320 MB (was 717)", memory.gpuMB <= 320, `${memory.gpuMB} MB, tier ${memory.quality.tier}`);
  check("phone: painted canvases let go once uploaded (≤ 80 MB left, was 473)", memory.canvasMB <= 80, `${memory.canvasMB} MB`);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await enterWorld(page, "tr", 3000);
  check("throttled phone: 100% → reveal → the world, entered", (await stage(page)) === "world" && (await page.locator("[data-joystick]").count()) === 1);
  const worst = Math.max(0, ...gaps);
  console.log(`  frames over 250 ms during the throttled boot: ${gaps.length}, worst ${worst} ms (CPU ×4)`);
  check("throttled phone: no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

/* ------------------------------------------------- a start the device killed */
{
  const { ctx, page, errors } = await phone({ pending: true, failures: 0 });
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  const revealed = await waitStage(page, "reveal", 90000);
  const quality = await page.evaluate(() => window.__archonQuality?.());
  check("after one killed start: the world starts in the safe tier", revealed && quality?.tier === "safe" && quality?.safe === true && quality?.dpr <= 1.25, JSON.stringify(quality));
  await enterWorld(page, "tr", 2500);
  check("safe tier: the world is entered and walkable", (await stage(page)) === "world" && (await page.locator("[data-joystick]").count()) === 1);
  await page.waitForTimeout(6500);
  const note = await page.evaluate(() => JSON.parse(localStorage.getItem("archon-world-boot") ?? "null"));
  check("a start that holds for a few seconds clears the note", note && note.pending === false && note.failures === 0, JSON.stringify(note));
  check("safe tier: no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

/* ------------------------------------------------------ two, and the fallback */
{
  const { ctx, page, errors } = await phone({ pending: true, failures: 1 });
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  const fallback = page.locator("[data-world-failure]");
  await fallback.waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
  const text = (await fallback.count()) ? await fallback.innerText() : "";
  check("after two: the fallback, not a third crash", /grafik motoru başlatılamadı/i.test(text) && /daha düşük/i.test(text) && (await page.locator(".world-overlay canvas").count()) === 0, text.replace(/\s+/g, " ").slice(0, 120));
  check("the fallback offers TEKRAR DENE", /TEKRAR DENE/i.test(await page.locator("[data-world-retry]").innerText().catch(() => "")));
  await page.screenshot({ path: ".qa/final5/crashsafe-fallback.png" });
  await page.locator("[data-world-retry]").tap();
  const revealed = await waitStage(page, "reveal", 90000);
  const quality = await page.evaluate(() => window.__archonQuality?.());
  check("TEKRAR DENE builds the world, in the safe tier", revealed && (await fallback.count()) === 0 && quality?.tier === "safe", JSON.stringify(quality));
  check("fallback: no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

/* ------------------------------------------------ leaving is not failing */
{
  const { ctx, page } = await phone();
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__archonScene?.(), null, { timeout: 30000 });
  await page.goto(BASE + "/tr/about", { waitUntil: "domcontentloaded" });
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await waitStage(page, "reveal", 90000);
  const quality = await page.evaluate(() => window.__archonQuality?.());
  check("a reload mid-start is not counted: full tier again", quality?.tier === "high" && !quality?.safe, JSON.stringify(quality));
  await ctx.close();
}

/* ------------------------------------ leaving the world is not failing */
{
  const { ctx, page } = await phone();
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 7500);
  const leaveButton = page.locator(".world-overlay button", { hasText: /Ana site|Main site/i }).last();
  await leaveButton.tap().catch(() => {});
  await page.waitForTimeout(1500);
  check("the world is left by its own button", (await page.locator(".world-overlay").count()) === 0);
  const note = await page.evaluate(() => JSON.parse(localStorage.getItem("archon-world-boot") ?? "null"));
  check("leaving the world (the renderer drops its context) is not counted as a failure", !note || (note.failures === 0 && note.pending === false), JSON.stringify(note));
  await ctx.close();
}

/* ------------------------------------------------------ a lost context */
{
  const { ctx, page, errors } = await phone();
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 2500);
  const before = await page.evaluate(() => {
    window.__firstScene = window.__archonScene();
    const lose = window.__archonContext;
    lose(true);
    setTimeout(() => lose(false), 600);
    return true;
  });
  await page.waitForFunction(() => window.__archonScene?.() && window.__archonScene() !== window.__firstScene, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(9000);
  const after = await page.evaluate(() => ({ rebuilt: window.__archonScene() !== window.__firstScene, quality: window.__archonQuality(), fallback: Boolean(document.querySelector("[data-world-failure]")), visible: window.__archonScene().children.some((c) => c.type === "Group" && c.visible && c.children.length > 10) }));
  check("a context that comes back: the scene is built again, safe, and shown", before && after.rebuilt && after.quality.tier === "safe" && !after.fallback && after.visible, JSON.stringify(after));
  check("the joystick still answers after the rebuild", (await page.locator("[data-joystick]").count()) === 1);
  check("context restored: no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}
{
  const { ctx, page } = await phone();
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 2500);
  await page.evaluate(() => window.__archonContext(true));
  const shown = await page.locator("[data-world-failure]").waitFor({ state: "visible", timeout: 9000 }).then(() => true, () => false);
  check("a context that does not come back: the fallback within seconds, not an empty screen", shown);
  await ctx.close();
}

await browser.close();
console.log(`\n${failed} failed`);
process.exit(failed ? 1 : 0);
