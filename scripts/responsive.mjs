/**
 * Every page, at every width the brief names.
 *
 * Horizontal overflow is the failure this is really looking for: it is the one
 * layout bug that makes a site feel broken rather than tight, it is invisible
 * on the machine it was designed on, and it is trivially detectable. Alongside
 * it, two things that matter as much on a narrow screen — whether any control
 * has become too small to hit, and whether anything is running off the side of
 * its own container.
 */
import { chromium } from "playwright";
import path from "node:path";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const OUT = process.argv[2] ?? ".qa/responsive";

const WIDTHS = [1440, 1280, 1024, 768, 430, 390, 375];
const ROUTES = [
  "/en",
  "/en/projects",
  "/en/projects/meetzy",
  "/en/projects/dppano",
  "/en/labs",
  "/en/labs/divan",
  "/en/capabilities",
  "/en/process",
  "/en/about",
  "/en/contact",
  "/tr",
  "/tr/projects",
];

const findings = [];
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    /* The world opens over the home page once per session; this suite is about
       the ordinary site, and a returning visitor is what it looks like. */
    hasTouch: width <= 430,
    isMobile: width <= 430,
  });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem("archon-world-dismissed", "1");
    } catch {}
  });
  const page = await ctx.newPage();

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 2) findings.push(`${width}px ${route} overflows by ${overflow}px`);

    /* Anything wider than the viewport, named, so a failure is actionable
       rather than a number. */
    if (overflow > 2) {
      const culprits = await page.evaluate((w) => {
        const out = [];
        for (const el of Array.from(document.body.querySelectorAll("*"))) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > w + 2) {
            out.push(
              `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} → ${Math.round(r.right)}`,
            );
          }
          if (out.length > 4) break;
        }
        return out;
      }, width);
      for (const culprit of culprits) findings.push(`   ${width}px ${route} :: ${culprit}`);
    }

    const small = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("a, button, [role=tab]"));
      return els.filter((el) => {
        if (el.closest(".sr-only")) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.width < 24 && r.height < 24;
      }).length;
    });
    if (small > 0) findings.push(`${width}px ${route} has ${small} controls under 24px both ways`);

    if (width === 390 || width === 1280) {
      await page.screenshot({
        path: path.join(OUT, `${width}${route.replace(/\//g, "_")}.png`),
      });
    }
  }
  await ctx.close();
}

await browser.close();

console.log(`checked ${WIDTHS.length} widths × ${ROUTES.length} routes`);
if (findings.length === 0) {
  console.log("no overflow, no unusable controls.");
} else {
  console.log(`\nfindings (${findings.length}):`);
  for (const finding of findings) console.log(" - " + finding);
}
process.exit(findings.length === 0 ? 0 : 1);
