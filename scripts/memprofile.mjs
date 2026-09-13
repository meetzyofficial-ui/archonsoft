/**
 * What the world allocates, estimated from the scene itself: the drawing
 * buffer (with its multisample copy), every texture a material or the
 * environment holds (and the 2D canvas behind it, which stays in memory),
 * geometry buffers, render targets and programs — at the moment the boot
 * reports ready, and a few seconds into the reveal. Chrome's JS heap too.
 * A phone's browser is killed on memory, not on an exception, so this is
 * the number that matters for a real-device crash; the phone here is
 * emulated, the arithmetic is the device's.
 *
 *   node scripts/memprofile.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const measure = () => {
  const scene = window.__archonScene?.();
  if (!scene) return null;
  const MB = 1024 * 1024;
  const textures = new Map();
  const add = (tex, owner) => {
    if (!tex || !tex.isTexture || textures.has(tex)) return;
    textures.set(tex, owner);
  };
  const geometries = new Set();
  scene.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    for (const m of materials) {
      for (const key of Object.keys(m)) if (m[key] && m[key].isTexture) add(m[key], object.name || object.parent?.name || "?");
      if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u && u.value && u.value.isTexture) add(u.value, object.name || "?");
    }
  });
  if (scene.environment) add(scene.environment, "environment");
  let gpuTex = 0;
  let canvas2d = 0;
  const big = [];
  for (const [tex, owner] of textures) {
    const img = tex.image;
    /* A texture let go after its upload remembers what it uploaded. */
    const w = tex.userData.texels?.[0] ?? img?.width ?? 0;
    const h = tex.userData.texels?.[1] ?? img?.height ?? 0;
    const bpp = tex.type === 1016 ? 8 : tex.type === 1015 ? 16 : 4;
    const mip = tex.generateMipmaps !== false && tex.minFilter !== 1006 && tex.minFilter !== 1003 ? 4 / 3 : 1;
    const bytes = w * h * bpp * mip;
    gpuTex += bytes;
    if (typeof HTMLCanvasElement !== "undefined" && img instanceof HTMLCanvasElement) canvas2d += img.width * img.height * 4;
    big.push([Math.round(bytes / MB * 10) / 10, `${w}x${h}`, owner, img?.constructor?.name]);
  }
  let geo = 0;
  for (const g of geometries) {
    for (const a of Object.values(g.attributes)) geo += a.array?.byteLength ?? 0;
    if (g.index) geo += g.index.array.byteLength;
  }
  const canvas = document.querySelector(".world-overlay canvas");
  const dw = canvas?.width ?? 0;
  const dh = canvas?.height ?? 0;
  const samples = 4;
  /* Colour + depth/stencil, and a multisampled copy of both (antialias is on: four samples, typically). */
  const drawing = dw * dh * 8 * (1 + (samples || 0));
  big.sort((a, b) => b[0] - a[0]);
  const info = window.__archonInfo?.();
  return {
    drawingBuffer: `${dw}x${dh} samples ${samples} ≈ ${(drawing / MB).toFixed(0)} MB`,
    textures: textures.size,
    gpuTexturesMB: +(gpuTex / MB).toFixed(0),
    canvas2dMB: +(canvas2d / MB).toFixed(0),
    geometryMB: +(geo / MB).toFixed(0),
    totalEstimateMB: +((gpuTex + canvas2d + geo + drawing) / MB).toFixed(0),
    programs: info?.programs,
    quality: window.__archonQuality?.(),
    heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / MB).toFixed(0) : null,
    largest: big.slice(0, 14),
  };
};

for (const [tag, viewport, phone] of [
  ["portrait", { width: 390, height: 844 }, true],
  ["landscape", { width: 844, height: 390 }, true],
  ["desktop", { width: 1440, height: 860 }, false],
]) {
  const browser = await chromium.launch({ headless: false, channel: "chrome", args: [`--window-size=${viewport.width + 60},${viewport.height + 180}`, "--enable-precise-memory-info", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
  const ctx = await browser.newContext(phone ? { viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: ua } : { viewport });
  const page = await ctx.newPage();
  await page.bringToFront();
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector(".world-overlay")?.getAttribute("data-stage") === "reveal", null, { timeout: 90000 });
  const atReady = await page.evaluate(measure);
  await page.waitForTimeout(5000);
  const inReveal = await page.evaluate(measure);
  console.log(`\n== ${tag}`);
  console.log("at ready:", JSON.stringify({ ...atReady, largest: undefined }));
  console.log("reveal +5s:", JSON.stringify({ ...inReveal, largest: undefined }));
  for (const row of inReveal.largest) console.log("   ", JSON.stringify(row));
  await browser.close();
}
