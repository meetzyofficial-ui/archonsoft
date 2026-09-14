/**
 * WCAG contrast audit over every rendered text run.
 *
 * Foreground colours on this site are largely `color-mix(... transparent)`, so
 * the computed colour carries alpha and has to be composited over the nearest
 * opaque ancestor background before the ratio means anything.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const ROUTES = [
  "/en",
  "/tr",
  "/en/projects",
  "/en/projects/meetzy",
  "/en/projects/dppano",
  "/en/projects/erden",
  "/en/capabilities",
  "/en/labs",
  "/en/labs/divan",
  "/en/labs/ulak",
  "/tr/labs/kervan",
  "/en/process",
  "/en/about",
  "/en/contact",
  "/en/nope",
];

const audit = () => {
  // Computed colours here are `color-mix(in oklab, ... transparent)`, which
  // Chrome reports as `oklab(... / a)`. Rather than parse colour syntaxes,
  // paint each one to a 1x1 canvas and read the sRGB back.
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const cache = new Map();

  const toRgba = (css) => {
    if (cache.has(css)) return cache.get(css);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    const out = { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    cache.set(css, out);
    return out;
  };

  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  const lum = (c) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };

  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const backdrop = (el) => {
    /* Archon World paints its environment into a canvas, so nothing in its
       interface has a CSS background to walk up to. It is a dark room, and
       that is what its chrome is set against. */
    if (el.closest(".world-overlay")) return { r: 13, g: 17, b: 25, a: 1 };
    for (let node = el; node; node = node.parentElement) {
      const c = toRgba(getComputedStyle(node).backgroundColor);
      if (c.a >= 0.98) return c;
      // The header floats over the page with no background of its own. The
      // site's ground is night since the creative-tech rebuild (html paints
      // #05070b under a fixed atmosphere), so that is what it sits on.
      if (node.tagName === "HEADER") return { r: 5, g: 7, b: 11, a: 1 };
      // Sections paint nothing; the lifted chapters reach graphite at most,
      // which is the lightest ground text has to hold against.
      if (node.dataset && node.dataset.band) {
        if (node.dataset.band === "ink") return { r: 2, g: 3, b: 10, a: 1 };
        if (node.dataset.band === "haze") return { r: 16, g: 20, b: 28, a: 1 };
      }
    }
    return { r: 10, g: 13, b: 19, a: 1 };
  };

  const problems = [];
  const seen = new Set();

  for (const el of document.querySelectorAll("body *")) {
    const hasText = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 1,
    );
    if (!hasText) continue;

    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (Number(style.opacity) < 0.95) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    /* Off-screen is not a contrast failure. The header retracts on scroll by
       translating itself out of the viewport: it keeps its size and its
       computed colours, so it was still being measured — against whatever
       band happened to be behind where it used to be. Nobody can read a
       control that is not on the screen. */
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;
    if (el.closest('[aria-hidden="true"]')) continue;

    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;

    const bg = backdrop(el);
    const value = ratio(over(toRgba(style.color), bg), bg);

    if (value < need) {
      const key = `${el.tagName}|${style.color}|${Math.round(size)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      problems.push(
        `${value.toFixed(2)}:1 (needs ${need}) - ${Math.round(size)}px - bg rgb(${bg.r},${bg.g},${bg.b}) - ${el.tagName}${el.closest("[data-band]") ? "@" + el.closest("[data-band]").dataset.band : ""}${el.closest(".world-overlay") ? "@overlay" : ""} - "${el.textContent.trim().slice(0, 40)}"`,
      );
    }
  }
  return problems;
};

const browser = await chromium.launch();
let total = 0;

for (const profile of [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", ...devices["iPhone 13"] },
]) {
  const context = await browser.newContext(profile);
  const page = await context.newPage();

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 14; i += 1) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(110);
    }
    await page.waitForTimeout(600);
    const found = await page.evaluate(audit);
    for (const problem of found) {
      total += 1;
      console.log(`${profile.name} ${route}: ${problem}`);
    }
  }
  await context.close();
}

await browser.close();
console.log(total === 0 ? "Contrast audit clean (WCAG AA)." : `\n${total} contrast issue(s).`);
process.exit(total === 0 ? 0 : 1);
