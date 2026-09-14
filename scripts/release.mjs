/**
 * Production release audit. Read-only: it changes nothing and only reports.
 *
 * Walks every route in both languages against the production build and checks
 * the things that break a launch rather than the things that offend taste —
 * console errors, failed requests, oversized assets, metadata, canonicals,
 * hreflang, the hero preload, and whether a concept could ever be mistaken for
 * shipped work.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";

const PATHS = [
  "",
  "/privacy",
  "/work",
  "/work/meetzy",
  "/work/dppano",
  "/work/erden",
  "/labs",
  "/labs/divan",
  "/labs/ulak",
  "/labs/kervan",
  "/labs/vesile",
  "/labs/tezgah",
  "/labs/vardiya",
  "/labs/olcek",
  "/labs/atolye",
  "/labs/kutuk",
  "/labs/esik",
  "/capabilities",
  "/process",
  "/about",
  "/contact",
];

const findings = [];
const note = (level, message) => findings.push(`${level}  ${message}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await context.newPage();

const consoleErrors = [];
const failedRequests = [];
const assets = new Map();


page.on("pageerror", (e) => consoleErrors.push(`${page.url()} :: PAGEERROR ${e.message}`));
// The deliberate 404 route is expected to produce a 404 document and to abort
// the prefetch of its own language-switch link. Neither is a defect, and
// counting them would bury a real one.
const isDeliberate404 = (url) => url.includes("this-route-does-not-exist");
/* A router prefetch that was read and then cancelled is not a failed request.
   Next streams the RSC payload for every link in view and aborts the stream
   once it has what it needs, so the same URL shows up as a completed response
   and as an aborted request in the same page load — verified by counting both:
   eight completed, eight aborted, the same eight URLs. Counting these would
   mean a page with more links is a page with more "failures", which is exactly
   backwards. An abort on anything that is not a prefetch still counts. */
const isConsumedPrefetch = (r) =>
  r.url().includes("_rsc=") && r.failure()?.errorText === "net::ERR_ABORTED";

page.on("requestfailed", (r) => {
  if (isDeliberate404(r.url()) || isDeliberate404(page.url())) return;
  if (isConsumedPrefetch(r)) return;
  failedRequests.push(`${page.url()} :: ${r.url()} — ${r.failure()?.errorText}`);
});
/* Chromium's software GL stack emits a performance hint whenever it composites
   a WebGL canvas in this harness. It names no code of ours, and it survived
   every attempt to trace it to something the world does — it appears with and
   without a screenshot being taken, with and without multisampling, and with
   the canvas on its own compositing layer. It is a driver note about the test
   browser's renderer, not an application warning, so it is not counted as one.
   Anything else the driver says still is. */
const isSoftwareRendererHint = (text) =>
  text.includes("GL Driver Message") && text.includes("Performance");

page.on("console", (m) => {
  if (isDeliberate404(page.url())) return;
  if (m.type() === "error" || m.type() === "warning") {
    if (m.type() === "warning" && isSoftwareRendererHint(m.text())) return;
    consoleErrors.push(`${page.url()} :: [${m.type()}] ${m.text()}`);
  }
});
page.on("response", async (r) => {
  const status = r.status();
  const url = r.url();
  if (status >= 400 && !url.includes("this-route-does-not-exist")) {
    failedRequests.push(`${page.url()} :: ${status} ${url}`);
  }
  const length = Number(r.headers()["content-length"] ?? 0);
  if (Number.isFinite(length) && length > 0) {
    assets.set(url, Math.max(assets.get(url) ?? 0, length));
  }
});

/* ------------------------------------------------------- route-by-route */
for (const locale of ["en", "tr"]) {
  for (const path of PATHS) {
    const url = `${BASE}/${locale}${path}`;
    const response = await page.goto(url, { waitUntil: "networkidle" });
    const status = response?.status() ?? 0;
    if (status !== 200) note("CRIT", `${url} returned ${status}`);

    const meta = await page.evaluate(() => {
      const get = (sel, attr = "content") =>
        document.querySelector(sel)?.getAttribute(attr) ?? null;
      return {
        title: document.title,
        description: get('meta[name="description"]'),
        canonical: get('link[rel="canonical"]', "href"),
        alternates: Array.from(document.querySelectorAll('link[rel="alternate"]')).map((l) => ({
          hreflang: l.getAttribute("hreflang"),
          href: l.getAttribute("href"),
        })),
        ogTitle: get('meta[property="og:title"]'),
        ogImage: get('meta[property="og:image"]'),
        lang: document.documentElement.lang,
        h1: Array.from(document.querySelectorAll("h1")).map((h) => h.textContent?.trim() ?? ""),
        preloads: Array.from(document.querySelectorAll('link[rel="preload"][as="image"]')).map(
          (l) => l.getAttribute("href"),
        ),
        // The hero preload is injected by an inline script when Archon World
        // is not covering the page, so its absence is only a fault if the
        // injector is missing too.
        preloadInjector: Array.from(document.querySelectorAll("script")).some((script) =>
          script.textContent?.includes("rel='preload'"),
        ),
        // A concept must never be able to read as delivered work.
        conceptMarks: document.body.innerText.match(/ARCHON LABS|CONCEPT|KONSEPT|SAMPLE DATA|ÖRNEK VER/gi)?.length ?? 0,
        shippedMarks: document.body.innerText.match(/SHIPPED|YAYINDA/g)?.length ?? 0,
      };
    });

    if (!meta.title || meta.title.length < 5) note("CRIT", `${url} has no usable <title>`);
    if (!meta.description) note("CRIT", `${url} has no meta description`);
    if (!meta.canonical) note("HIGH", `${url} has no canonical`);
    else if (!meta.canonical.startsWith("http")) note("HIGH", `${url} canonical is relative: ${meta.canonical}`);
    if (meta.lang !== locale) note("CRIT", `${url} html lang is "${meta.lang}"`);
    if (meta.h1.length !== 1) note("HIGH", `${url} has ${meta.h1.length} <h1>`);
    if (!meta.ogTitle) note("MED", `${url} has no og:title`);
    if (!meta.ogImage) note("MED", `${url} has no og:image`);

    // hreflang has to name both languages on every translated route.
    const langs = meta.alternates.map((a) => a.hreflang).filter(Boolean);
    if (path !== "" && (!langs.includes("en") || !langs.includes("tr"))) {
      note("HIGH", `${url} hreflang missing a language: ${langs.join(", ") || "none"}`);
    }

    if (path === "" && meta.preloads.length === 0 && !meta.preloadInjector) {
      note("CRIT", `${url} has neither a hero image preload nor its injector`);
    }

    if (path.startsWith("/labs/") && meta.conceptMarks < 2) {
      note("CRIT", `${url} is a concept page with only ${meta.conceptMarks} concept marks`);
    }
    if (path.startsWith("/work/") && meta.shippedMarks < 1) {
      note("HIGH", `${url} is shipped work with no SHIPPED mark`);
    }
  }
}

/* ------------------------------------------------------------- 404 page */
{
  const response = await page.goto(`${BASE}/en/this-route-does-not-exist`, {
    waitUntil: "networkidle",
  });
  if (response?.status() !== 404) note("CRIT", `404 route returned ${response?.status()}`);
  const body = await page.locator("main").innerText();
  if (body.trim().length < 40) note("HIGH", "404 page has almost no content");
  const links = await page.locator("main a").count();
  if (links < 2) note("HIGH", `404 page offers only ${links} way(s) out`);
}

/* -------------------------------------------------- locale-less requests */
{
  // The middleware matcher is a regex inside a string, and an escape lost in
  // that string once left every prefix-less URL answering 404. Nothing about
  // it is visible in a screenshot, so it is asserted here instead.
  for (const path of ["/work", "/labs", "/contact", "/about", "/process", "/capabilities"]) {
    /* The language comes from Accept-Language: none (a link-preview crawler)
       is Turkish, a browser asking for English is English. */
    for (const [language, expected] of [["", "tr"], ["en-US,en;q=0.9", "en"], ["tr-TR,tr;q=0.9", "tr"]]) {
      const res = await page.request.get(`${BASE}${path}`, {
        maxRedirects: 0,
        headers: { "accept-language": language },
      });
      if (res.status() < 300 || res.status() >= 400) {
        note("CRIT", `${path} does not redirect to a locale (status ${res.status()})`);
      } else {
        const location = res.headers()["location"] ?? "";
        if (!location.includes(`/${expected}${path}`)) {
          note("CRIT", `${path} [${language || "no language"}] redirects to "${location}" rather than /${expected}${path}`);
        }
      }
    }
  }
  // Files that must stay at the root are not allowed to be swept up by it.
  for (const path of ["/robots.txt", "/sitemap.xml", "/icon.svg"]) {
    const res = await page.request.get(`${BASE}${path}`, { maxRedirects: 0 });
    if (res.status() !== 200) note("CRIT", `${path} returned ${res.status()}`);
  }
}

/* ----------------------------------------------------- robots / sitemap */
{
  const robots = await page.goto(`${BASE}/robots.txt`);
  const robotsText = await robots?.text();
  if (!robotsText?.includes("Sitemap:")) note("HIGH", "robots.txt does not point at the sitemap");
  if (/Disallow: \/\s*$/m.test(robotsText ?? "")) note("CRIT", "robots.txt disallows the whole site");

  const sitemap = await page.goto(`${BASE}/sitemap.xml`);
  const xml = (await sitemap?.text()) ?? "";
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) note("CRIT", "sitemap.xml lists no URLs");
  const missing = [];
  for (const locale of ["en", "tr"]) {
    for (const path of PATHS) {
      const expected = `/${locale}${path}`;
      if (!urls.some((u) => new URL(u).pathname === (expected === `/${locale}` ? `/${locale}` : expected))) {
        missing.push(expected);
      }
    }
  }
  if (missing.length) note("HIGH", `sitemap missing ${missing.length}: ${missing.slice(0, 6).join(", ")}`);
  const relative = urls.filter((u) => !u.startsWith("https://"));
  if (relative.length) note("HIGH", `sitemap has ${relative.length} non-https URLs`);
}

/* ---------------------------------------------------------------- icons */
{
  const icon = await page.goto(`${BASE}/icon.svg`);
  if (icon?.status() !== 200) note("HIGH", `icon.svg returned ${icon?.status()}`);
  const og = await page.goto(`${BASE}/en/opengraph-image`);
  if (og?.status() !== 200) note("HIGH", `opengraph-image returned ${og?.status()}`);
}

/* --------------------------------------------------------------- mobile */
{
  const mobile = await browser.newContext({ ...devices["iPhone 13"] });
  const mp = await mobile.newPage();
  for (const path of ["", "/labs", "/labs/divan", "/work/erden", "/contact"]) {
    await mp.goto(`${BASE}/en${path}`, { waitUntil: "networkidle" });
    await mp.waitForTimeout(900);
    const overflow = await mp.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 2) note("HIGH", `mobile /en${path} overflows horizontally by ${overflow}px`);

    /* WCAG 2.2 target size, with the two exceptions the spec actually makes.
       A visually-hidden skip link is 1x1 until it takes focus, at which point
       it becomes a full padded control — it is never a pointer target and
       counting it only buries the real ones. Inline links inside a run of
       text are exempt by the spec itself; what is left after both is the set
       worth looking at. */
    const tapTargets = await mp.evaluate(() => {
      const els = Array.from(document.querySelectorAll("a, button, [role=tab]"));
      return els.filter((el) => {
        if (el.closest(".sr-only")) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24);
      }).length;
    });
    if (tapTargets > 0) note("MED", `mobile /en${path} has ${tapTargets} tap targets under 24px`);
  }
  await mobile.close();
}

/* -------------------------------------------------------------- summary */
const big = [...assets.entries()].filter(([, size]) => size > 250_000);
for (const [url, size] of big) {
  note("MED", `asset ${Math.round(size / 1024)}kB — ${url.replace(BASE, "")}`);
}

const uniqueConsole = [...new Set(consoleErrors)];
for (const line of uniqueConsole.slice(0, 12)) note("HIGH", `console — ${line}`);
for (const line of [...new Set(failedRequests)].slice(0, 12)) note("CRIT", `request — ${line}`);

console.log(`\nroutes checked: ${PATHS.length * 2}`);
console.log(`console errors/warnings: ${uniqueConsole.length}`);
console.log(`failed requests: ${new Set(failedRequests).size}`);
console.log(`assets over 250kB: ${big.length}`);
console.log(`\nfindings (${findings.length}):`);
for (const f of findings) console.log(" -", f);
if (findings.length === 0) console.log(" (none)");

await browser.close();
