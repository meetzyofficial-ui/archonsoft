/**
 * Visual and behavioural QA sweep.
 *
 * Drives the production build through a set of viewports and routes, capturing
 * screenshots and reporting anything that should never ship: console errors,
 * failed requests, horizontal overflow, and elements pushing past the viewport.
 *
 *   node scripts/qa.mjs [baseUrl] [outDir]
 */
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.argv[2] ?? process.env.ARCHON_BASE ?? "http://localhost:3210";
const OUT = process.argv[3] ?? path.join(process.cwd(), ".qa");

const ROUTES = [
  ["home", "/en"],
  ["home-tr", "/tr"],
  ["projects", "/en/projects"],
  ["case-meetzy", "/en/projects/meetzy"],
  ["case-erden", "/en/projects/erden"],
  ["case-meetzy-tr", "/tr/projects/meetzy"],
  ["capabilities", "/en/capabilities"],
  ["capabilities-tr", "/tr/capabilities"],
  ["labs", "/en/labs"],
  ["labs-tr", "/tr/labs"],
  ["concept-divan", "/en/labs/divan"],
  ["concept-ulak-tr", "/tr/labs/ulak"],
  ["concept-kervan", "/en/labs/kervan"],
  ["process", "/en/process"],
  ["about", "/en/about"],
  ["contact", "/en/contact"],
  ["notfound", "/en/this-route-does-not-exist"],
];

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1512, height: 950 }, isMobile: false },
  { name: "laptop", viewport: { width: 1280, height: 800 }, isMobile: false },
  { name: "tablet", viewport: { width: 834, height: 1112 }, isMobile: false },
  { name: "mobile", ...devices["iPhone 13"] },
];

const problems = [];
const note = (message) => problems.push(message);

async function audit(page, label) {
  return page.evaluate((viewLabel) => {
    const issues = [];
    const doc = document.documentElement;

    if (doc.scrollWidth > doc.clientWidth + 1) {
      issues.push(`${viewLabel}: horizontal overflow (${doc.scrollWidth} > ${doc.clientWidth})`);
    }

    // Anything sticking out past the right edge of the viewport, ignoring
    // elements an ancestor already clips (plates deliberately bleed inside
    // their own overflow-hidden frame).
    const width = doc.clientWidth;
    const clipped = (el) => {
      for (let node = el.parentElement; node && node !== doc; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (/hidden|clip|auto|scroll/.test(style.overflowX)) return true;
        if (style.clipPath && style.clipPath !== "none") return true;
      }
      return false;
    };

    for (const el of document.querySelectorAll("body *")) {
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.visibility === "hidden" || style.display === "none") continue;
      if (el instanceof SVGElement && el.tagName.toLowerCase() !== "svg") continue;
      if (clipped(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > width + 2 || rect.left < -2) {
        const id = `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 2).join(".") : ""}`;
        issues.push(`${viewLabel}: overflowing element ${id} (left ${Math.round(rect.left)}, right ${Math.round(rect.right)} vs ${width})`);
        if (issues.length > 12) break;
      }
    }

    // Links and buttons that resolve nowhere.
    for (const a of document.querySelectorAll("a")) {
      const href = a.getAttribute("href");
      if (!href || href === "#") issues.push(`${viewLabel}: anchor without a destination — "${a.textContent?.trim().slice(0, 40)}"`);
    }

    // Images without alternative text.
    for (const img of document.querySelectorAll("img")) {
      if (!img.hasAttribute("alt")) issues.push(`${viewLabel}: <img> without alt — ${img.currentSrc || img.src}`);
    }

    return issues;
  }, label);
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const profile of VIEWPORTS) {
    const context = await browser.newContext({
      ...profile,
      reducedMotion: "no-preference",
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    page.on("console", (message) => {
      if (message.type() === "error") note(`${profile.name} ${page.url().replace(BASE, "")}: console error — ${message.text()}`);
    });
    page.on("pageerror", (error) => note(`${profile.name}: page error — ${error.message}`));
    page.on("response", (response) => {
      if (response.status() >= 400) note(`${profile.name}: ${response.status()} — ${response.url().replace(BASE, "")}`);
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText ?? "";
      if (failure.includes("ERR_ABORTED")) return;
      note(`${profile.name}: request failed — ${request.url()} (${failure})`);
    });

    for (const [name, route] of ROUTES) {
      const response = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const status = response?.status() ?? 0;
      const expected = name === "notfound" ? 404 : 200;
      if (status !== expected) note(`${profile.name} ${route}: status ${status}, expected ${expected}`);

      // Let the entrance and any reveals settle, then scroll the page so
      // scroll-triggered content is in its resting state before capture.
      await page.waitForTimeout(1600);

      // Real wheel events, not window.scrollTo: momentum scrolling owns the
      // scroll position every frame and would undo a programmatic jump.
      const height = await page.evaluate(() => document.body.scrollHeight);
      const view = page.viewportSize()?.height ?? 800;
      const steps = Math.ceil(height / (view * 0.7));
      for (let i = 0; i < steps; i += 1) {
        await page.mouse.wheel(0, view * 0.7);
        await page.waitForTimeout(160);
      }
      await page.waitForTimeout(700);
      for (let i = 0; i < steps + 2; i += 1) {
        await page.mouse.wheel(0, -view);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(900);

      const found = await audit(page, `${profile.name} ${route}`);
      found.forEach(note);

      await page.screenshot({
        path: path.join(OUT, `${profile.name}-${name}.png`),
        fullPage: true,
      });
    }

    await context.close();
  }

  await browser.close();

  if (problems.length === 0) {
    console.log("QA sweep clean.");
  } else {
    console.log(`QA findings (${problems.length}):`);
    for (const problem of [...new Set(problems)]) console.log(" -", problem);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
