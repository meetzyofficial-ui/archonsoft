/** Confirms the hero fits its viewport at each breakpoint, CTAs included. */
import { chromium } from "playwright";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const VIEWS = [
  ["desktop 1512x950", { width: 1512, height: 950 }],
  ["laptop 1280x800", { width: 1280, height: 800 }],
  ["laptop 1440x900", { width: 1440, height: 900 }],
  ["tablet 834x1112", { width: 834, height: 1112 }],
  ["mobile 390x844", { width: 390, height: 844 }],
  ["small 360x640", { width: 360, height: 640 }],
];

const browser = await chromium.launch();
let bad = 0;

for (const [label, viewport] of VIEWS) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);

  const info = await page.evaluate(() => {
    const cta = document.querySelector('main a[href="/en/work"]');
    const rect = cta.getBoundingClientRect();
    const hero = document.querySelector("section[aria-labelledby='hero-heading']");
    return { ctaBottom: Math.round(rect.bottom), heroHeight: Math.round(hero.getBoundingClientRect().height), vh: window.innerHeight };
  });

  const ok = info.ctaBottom <= info.vh;
  if (!ok) bad += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(18)} cta bottom ${info.ctaBottom} / ${info.vh}  hero ${info.heroHeight}`);
  await context.close();
}

await browser.close();
console.log(bad === 0 ? "\nHero fits every viewport." : `\n${bad} viewport(s) push the CTA below the fold.`);
process.exit(bad === 0 ? 0 : 1);
