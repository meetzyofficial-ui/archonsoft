/**
 * Field-metric probe against the production build: LCP, CLS, transferred bytes
 * and long tasks per route, on a throttled connection.
 */
import { chromium } from "playwright";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const ROUTES = [
  "/en",
  "/en/work",
  "/en/work/meetzy",
  "/en/capabilities",
  "/en/labs",
  "/en/labs/divan",
  "/en/work/erden-davetiye",
  "/en/about",
  "/en/contact",
];

const browser = await chromium.launch();
const rows = [];

for (const route of ROUTES) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Roughly a fast 3G connection, so the numbers mean something.
  const session = await context.newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  let transferred = 0;
  let requests = 0;
  page.on("response", async (response) => {
    requests += 1;
    const length = Number(response.headers()["content-length"] ?? 0);
    transferred += Number.isFinite(length) ? length : 0;
  });

  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__cls = 0;
    window.__long = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      window.__long += list.getEntries().length;
    }).observe({ type: "longtask", buffered: true });
  });

  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  // Scroll through so late layout shifts are counted too.
  for (let i = 0; i < 12; i += 1) {
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      lcp: Math.round(window.__lcp),
      cls: Number(window.__cls.toFixed(4)),
      long: window.__long,
      dcl: Math.round(nav?.domContentLoadedEventEnd ?? 0),
    };
  });

  rows.push({ route, ...metrics, kb: Math.round(transferred / 1024), requests });
  await context.close();
}

await browser.close();

console.log("Throttled: 1.6 Mbps / 150 ms RTT / 4x CPU\n");
console.log(
  ["route".padEnd(18), "LCP".padStart(7), "CLS".padStart(8), "long".padStart(6), "KB".padStart(6), "reqs".padStart(6)].join(""),
);
for (const row of rows) {
  console.log(
    [
      row.route.padEnd(18),
      `${row.lcp}ms`.padStart(7),
      String(row.cls).padStart(8),
      String(row.long).padStart(6),
      String(row.kb).padStart(6),
      String(row.requests).padStart(6),
    ].join(""),
  );
}
