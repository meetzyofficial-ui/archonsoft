/**
 * AracımGo, end to end: the main site (card, line-up, product page, CTAs,
 * plates) and the world (destination 7, the rail, teleports to and from every
 * other destination, the hub's signage and screen, the host's answer, the
 * external CTA), on a desktop and an emulated phone.
 *
 *   node scripts/aracimgo.mjs            (SwiftShader — slow, but no GPU window)
 *   GPU=1 node scripts/aracimgo.mjs      (headed Chrome on the real GPU)
 *
 * The production address is read from the one constant the site uses and is
 * never requested here: the suite checks where the CTAs point, not the
 * product's own server.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import { enterWorld } from "./lib/enter.mjs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const gpu = process.env.GPU === "1";
const PROD_HOST = "xn--aracmgo-ufb.com"; // aracımgo.com, as a browser sends it
fs.mkdirSync(".qa/aracimgo", { recursive: true });

let passed = 0;
let failed = 0;
const check = (name, ok, note = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
  ok ? passed++ : failed++;
};

const launch = () =>
  gpu
    ? chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1460,900", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] })
    : chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] });

/** Console errors and failed requests, minus the prefetches a navigation cancels by design. */
function watch(page, tag) {
  const issues = [];
  page.on("pageerror", (e) => issues.push(`${tag} pageerror ${String(e).slice(0, 160)}`));
  page.on("console", (m) => {
    if (m.type() === "error") issues.push(`${tag} console ${m.text().slice(0, 160)}`);
  });
  page.on("requestfailed", (r) => {
    const aborted = r.failure()?.errorText === "net::ERR_ABORTED";
    if (aborted && (r.url().includes("_rsc=") || r.resourceType() === "media")) return;
    issues.push(`${tag} failed ${r.url()} ${r.failure()?.errorText}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400) issues.push(`${tag} ${r.status()} ${r.url()}`);
  });
  return issues;
}

const hostOf = (href) => {
  try {
    return new URL(href).hostname;
  } catch {
    return "";
  }
};

/* ================================================================ site */

const browser = await launch();
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const issues = watch(page, "site");

  for (const locale of ["tr", "en"]) {
    const response = await page.goto(`${BASE}/${locale}/projects/aracimgo`, { waitUntil: "networkidle" });
    check(`${locale}: the AracımGo page answers`, response?.status() === 200, String(response?.status()));
    check(`${locale}: its title is the product's name`, (await page.locator("h1").innerText()).replace(/\s+/g, "") === "AracımGo");
    const badge = await page.locator("[data-aracimgo-badge]").innerText();
    check(`${locale}: it is marked live`, locale === "tr" ? /CANLI ÜRÜN/i.test(badge) : /LIVE PRODUCT/i.test(badge), badge);
    for (const cta of ["inspect", "open"]) {
      const link = page.locator(`[data-aracimgo-cta="${cta}"]`);
      const href = await link.getAttribute("href");
      check(`${locale}: "${cta}" opens the live product`, hostOf(await link.evaluate((a) => a.href)) === PROD_HOST, href ?? "");
      check(`${locale}: "${cta}" opens in a new tab`, (await link.getAttribute("target")) === "_blank" && /noopener/.test((await link.getAttribute("rel")) ?? ""));
    }
    /* textContent, not innerText: the label is set in capitals by CSS, and a
       Turkish ı does not survive a case-insensitive match against I. */
    const openLabel = await page.locator('[data-aracimgo-cta="open"]').textContent();
    check(`${locale}: the open CTA says so`, locale === "tr" ? /AracımGo'yu Aç/.test(openLabel) : /Open AracımGo/.test(openLabel), openLabel);
    check(`${locale}: the second CTA leads to a brief`, (await page.locator('[data-aracimgo-cta="build"]').getAttribute("href")) === `/${locale}/contact`);
    check(`${locale}: six capabilities`, (await page.locator("[data-aracimgo-capabilities] > li").count()) === 6);
    const chapters = await page.locator("[data-aracimgo-chapter]").evaluateAll((all) => all.map((one) => one.getAttribute("data-aracimgo-chapter")));
    check(`${locale}: the story runs customers → history → work orders → plate search`, chapters.join(",") === "customers,history,work-orders,plate-search", chapters.join(","));
    /* Every plate, loaded and whole. */
    for (let y = 0; y < 16000; y += 700) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(600);
    const plates = await page.locator(".ag-plate img").evaluateAll((all) =>
      all.map((img) => ({ ok: img.complete && img.naturalWidth > 0, fit: getComputedStyle(img).objectFit, src: img.currentSrc })),
    );
    check(`${locale}: six product plates, all loaded`, plates.length === 6 && plates.every((one) => one.ok), JSON.stringify(plates.map((p) => p.ok)));
    check(`${locale}: plates are never cropped`, plates.every((one) => one.fit === "contain"));
    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((all) => all.map((one) => JSON.parse(one.textContent)));
    check(`${locale}: structured data points at the product`, schemas.some((one) => (one.sameAs ?? []).some((url) => hostOf(url) === PROD_HOST)));
  }

  /* The home page: the line-up and the spread. */
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" });
  const exit = page.getByRole("button", { name: /Ana site/ }).last();
  if (await exit.count()) await exit.click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  check("home: the products line-up is there", (await page.locator("[data-products]").count()) === 1);
  check("home: AracımGo is marked live", (await page.locator('[data-product="aracimgo"] [data-product-status="live"]').count()) === 1);
  check("home: Meetzy and DP Pano are marked live", (await page.locator('[data-product="meetzy"] [data-product-status="live"], [data-product="dppano"] [data-product-status="live"]').count()) === 2);
  check("home: Hizmeto carries no status it has not earned", (await page.locator('[data-product="hizmeto"]').count()) === 1 && (await page.locator('[data-product="hizmeto"] [data-product-status]').count()) === 0);
  check("home: the line-up opens the live product", hostOf(await page.locator('[data-aracimgo-cta="home-open"]').evaluate((a) => a.href)) === PROD_HOST);
  check("home: the AracımGo spread leads to its page", (await page.locator("#project-aracimgo a").first().getAttribute("href")) === "/tr/projects/aracimgo");
  check("home: the project index lists five", (await page.locator('#projects nav li').count()) === 5);
  const spread = await page.locator("#project-aracimgo").innerText();
  check("home: the card says what it is", /Oto servis yönetimi\. Tek yerde\./.test(spread) && /SAAS · OTOMOTİV · SERVİS YÖNETİMİ/i.test(spread) && /CANLI/i.test(spread));

  await page.goto(`${BASE}/en/projects`, { waitUntil: "networkidle" });
  check("projects: AracımGo is on the index", (await page.locator('a[href="/en/projects/aracimgo"]').count()) > 0);
  const sitemap = await (await page.request.get(`${BASE}/sitemap.xml`)).text();
  check("sitemap: both languages", /\/tr\/projects\/aracimgo/.test(sitemap) && /\/en\/projects\/aracimgo/.test(sitemap));

  check("site: no console errors or failed requests", issues.length === 0, issues.slice(0, 4).join(" | "));
  await context.close();

  /* A phone: nothing wider than the screen. */
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const small = await phone.newPage();
  const phoneIssues = watch(small, "site-phone");
  await small.goto(`${BASE}/tr/projects/aracimgo`, { waitUntil: "networkidle" });
  const overflow = await small.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("phone: the product page has no sideways scroll", overflow <= 0, `${overflow}px`);
  await small.screenshot({ path: ".qa/aracimgo/site-phone.png" });
  check("phone: no console errors or failed requests", phoneIssues.length === 0, phoneIssues.slice(0, 4).join(" | "));
  await phone.close();
}
await browser.close();

/* =============================================================== world */

/* From `world-destinations.ts`: feet position of each destination. */
const DEST = {
  1: { id: "hub", x: 0, z: 16 },
  2: { id: "dppano", x: 40, z: -66 },
  3: { id: "meetzy", x: -2, z: -36 },
  4: { id: "erden", x: 2, z: -36 },
  5: { id: "gallery", x: -24.5, z: 2 },
  6: { id: "systems", x: -40, z: 0 },
  7: { id: "aracimgo", x: -43, z: -66.5 },
};

{
  const worldBrowser = await launch();
  const page = await worldBrowser.newPage({ viewport: { width: 1440, height: 860 } });
  const issues = watch(page, "world");
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" });
  if (gpu) await page.bringToFront();
  await enterWorld(page, "tr", 6000);
  await page.mouse.click(720, 450);
  await page.waitForTimeout(400);

  const bodyAt = () => page.evaluate(() => window.__archonBody?.());
  const text = async () => ((await page.locator(".world-overlay").textContent()) ?? "").replace(/\s+/g, " ");
  /** Press a number and wait for the explorer to be set down there. */
  const go = async (key) => {
    const want = DEST[key];
    await page.keyboard.press(String(key));
    const start = Date.now();
    let body = null;
    while (Date.now() - start < (gpu ? 6000 : 40000)) {
      await page.waitForTimeout(gpu ? 150 : 600);
      body = await bodyAt();
      if (body && Math.hypot(body.x - want.x, body.z - want.z) < 0.6) break;
    }
    return body && Math.hypot(body.x - want.x, body.z - want.z) < 0.6;
  };

  check("rail: seven destinations", (await page.locator("[data-rail] [data-destination]").count()) === 7);
  check("rail: seven on the compact rail too", (await page.locator("[data-rail-compact] [data-destination]").count()) === 7);
  const railText = (await page.locator("[data-rail]").innerText()).replace(/\s+/g, " ");
  check("rail: 07 is AracımGo", /07 ARACIMGO/i.test(railText), railText);
  check("rail: the names of 1–6 are unchanged", /01 ARCHON HUB 02 DP PANO 03 MEETZY 04 ERDEN DAVETİYE 05 GALER[İI] 06 S[İI]STEMLER/i.test(railText), railText);

  check("key 7 resolves AracımGo", await go(7));
  await page.waitForTimeout(gpu ? 800 : 3000);
  check("the rail marks 07 as current", (await page.locator('[data-rail] [data-destination="aracimgo"][aria-current="true"]').count()) === 1);
  check("the district is announced", /AracımGo/i.test(await text()));
  await page.screenshot({ path: ".qa/aracimgo/world-arrival.png" });

  /* Not set down in a wall: a step forward moves the explorer. */
  const before = await bodyAt();
  await page.keyboard.down("w");
  await page.waitForTimeout(gpu ? 700 : 4000);
  await page.keyboard.up("w");
  const after = await bodyAt();
  check("arrival: free to walk", Math.hypot(after.x - before.x, after.z - before.z) > 0.8, `${before.x.toFixed(1)},${before.z.toFixed(1)} → ${after.x.toFixed(1)},${after.z.toFixed(1)}`);
  /* The hall is walled: walking north (−z, yaw 0) ends at the far wall, inside the district. */
  await page.evaluate(() => window.__archonPlace?.(-48, -66, 0));
  await page.keyboard.down("w");
  await page.waitForTimeout(gpu ? 6000 : 24000);
  await page.keyboard.up("w");
  const walled = await bodyAt();
  /* The wall's inner face is at z −77.2; the explorer stops a body's width short of it. */
  check("collision: the far wall holds", walled.z > -77.2 && walled.z < -75.5, `z ${walled.z.toFixed(2)}`);

  /* The scene: signage, screen, station and hub are all built. */
  await page.evaluate(() => window.__archonPlace?.(-42, -66, -90));
  await page.waitForTimeout(gpu ? 900 : 4000);
  const east = await page.evaluate(() => window.__archonBreakdown?.());
  check("signage: the sign over the passage is drawn", (east?.["aracimgo:sign"] ?? 0) > 0, JSON.stringify(east?.["aracimgo:sign"]));
  await page.screenshot({ path: ".qa/aracimgo/world-sign.png" });
  await page.evaluate(() => window.__archonPlace?.(-38, -66, 90));
  await page.waitForTimeout(gpu ? 900 : 4000);
  const west = await page.evaluate(() => window.__archonBreakdown?.());
  check("station: AracımGo's plates hang over its station", (west?.["station:aracimgo"] ?? 0) > 0);
  check("hub: canopy and bays are drawn", (west?.["aracimgo:detail"] ?? 0) > 0);
  await page.screenshot({ path: ".qa/aracimgo/world-hub.png" });

  /* The entrance screen: approach, the CTA appears, it opens the live product. */
  /* The screen is on the south side of the door (+z), so face south: yaw 180. */
  await page.evaluate(() => window.__archonPlace?.(-42.5, -63, 180));
  await page.waitForTimeout(gpu ? 1200 : 5000);
  const prompt = await text();
  check("display: approaching shows the CTA", /AracımGo'yu keşfet/i.test(prompt), prompt.slice(0, 160));
  await page.screenshot({ path: ".qa/aracimgo/world-display.png" });
  await page.keyboard.press("e");
  await page.waitForTimeout(gpu ? 700 : 3000);
  const cta = page.locator('[data-display-cta="aracimgo-entrance"]');
  check("display: its card opens", (await cta.count()) === 1);
  if (await cta.count()) {
    check("display: the CTA goes to the production URL", hostOf(await cta.evaluate((a) => a.href)) === PROD_HOST);
    check("display: in a new tab", (await cta.getAttribute("target")) === "_blank");
    const card = await text();
    check("display: title, line and four capabilities", /AracımGo/.test(card) && /Oto servis yönetimi\. Tek yerde\./.test(card) && /Müşteri Yönetimi/.test(card) && /Plaka ile Arama/.test(card));
    await page.screenshot({ path: ".qa/aracimgo/world-display-card.png" });
  }
  /* Back to the world: the card's own button (Escape would be the world's too). */
  await page.locator('[role="dialog"] button', { hasText: "Dünyaya dön" }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  check("display: the card closes back to the world", (await page.locator('[data-display-cta="aracimgo-entrance"]').count()) === 0);
  await page.mouse.click(720, 450);
  await page.waitForTimeout(300);

  /* The teleport matrix: 1–6 → 7, and 7 → 1–6. */
  const matrix = [];
  for (const key of [1, 2, 3, 4, 5, 6]) {
    const there = await go(key);
    const back = await go(7);
    const out = await go(key);
    matrix.push(`${key}${there && back && out ? "✓" : "✗"}`);
    check(`teleport ${key} → 7 → ${key}`, there && back && out);
  }
  console.log("matrix:", matrix.join(" "));

  /* The host: "What is AracımGo?" */
  await go(1);
  /* A step from the host (9.5, 20), facing her — worldlife walks the same line. */
  await page.evaluate(() => window.__archonPlace?.(7.4, 19.1, -113));
  await page.waitForTimeout(gpu ? 900 : 4000);
  await page.keyboard.press("e");
  await page.waitForTimeout(gpu ? 900 : 4000);
  const option = page.locator('[data-host-option="aracimgo"]');
  check("host: offers \"AracımGo nedir?\"", (await option.count()) === 1 && /AracımGo nedir/.test((await option.textContent()) ?? ""));
  if (await option.count()) {
    await option.click();
    await page.waitForTimeout(400);
    const answer = await page.locator('[data-host-answer="aracimgo"]').innerText().catch(() => "");
    check("host: answers in one sentence", /AracımGo, oto servislerin müşteri, araç ve servis süreçlerini tek yerden yönetmesini sağlayan ArchonSoft ürünüdür\./.test(answer), answer.slice(0, 120));
    check("host: offers to open it", hostOf(await page.locator('[data-host-cta="aracimgo"]').evaluate((a) => a.href)) === PROD_HOST);
    await page.screenshot({ path: ".qa/aracimgo/world-host.png" });
    await page.locator('[data-host-visit="aracimgo"]').click();
    const start = Date.now();
    let body = null;
    while (Date.now() - start < (gpu ? 6000 : 40000)) {
      await page.waitForTimeout(gpu ? 150 : 600);
      body = await bodyAt();
      if (body && Math.hypot(body.x - DEST[7].x, body.z - DEST[7].z) < 0.6) break;
    }
    check("host: takes the visitor to the hub", body && Math.hypot(body.x - DEST[7].x, body.z - DEST[7].z) < 0.6);
  }

  check("world: no console errors or failed requests", issues.length === 0, issues.slice(0, 4).join(" | "));
  await worldBrowser.close();
}

/* ======================================================== world, phone */

{
  const phoneBrowser = await launch();
  const context = await phoneBrowser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  const issues = watch(page, "world-phone");
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" });
  if (gpu) await page.bringToFront();
  await enterWorld(page, "tr", 6000);
  const rail = page.locator("[data-rail-compact] [data-destination]");
  check("phone: seven thumb-sized destinations", (await rail.count()) === 7);
  const box = await page.locator('[data-rail-compact] [data-destination="aracimgo"]').boundingBox();
  check("phone: 07 is on screen and thumb-sized", !!box && box.y + box.height <= 844 && box.width >= 44, JSON.stringify(box));
  await page.locator('[data-rail-compact] [data-destination="aracimgo"]').tap();
  const start = Date.now();
  let body = null;
  while (Date.now() - start < (gpu ? 8000 : 45000)) {
    await page.waitForTimeout(gpu ? 200 : 700);
    body = await page.evaluate(() => window.__archonBody?.());
    if (body && Math.hypot(body.x - DEST[7].x, body.z - DEST[7].z) < 0.6) break;
  }
  check("phone: tapping 07 teleports to AracımGo", body && Math.hypot(body.x - DEST[7].x, body.z - DEST[7].z) < 0.6, body ? `${body.x.toFixed(1)},${body.z.toFixed(1)}` : "");
  await page.waitForTimeout(gpu ? 1200 : 4000);
  await page.screenshot({ path: ".qa/aracimgo/phone-arrival.png" });
  await page.evaluate(() => window.__archonPlace?.(-42.5, -63, 180));
  await page.waitForTimeout(gpu ? 1500 : 6000);
  const focus = page.locator("[data-touch-act]").first();
  const hasFocus = (await focus.count()) === 1;
  check("phone: the screen's CTA is a tap", hasFocus && /AracımGo'yu keşfet/.test((await focus.textContent()) ?? ""));
  if (hasFocus) {
    await focus.tap();
    await page.waitForTimeout(gpu ? 800 : 3000);
    const cta = page.locator('[data-display-cta="aracimgo-entrance"]');
    check("phone: the card's CTA opens the live product", (await cta.count()) === 1 && hostOf(await cta.evaluate((a) => a.href)) === PROD_HOST);
    await page.screenshot({ path: ".qa/aracimgo/phone-card.png" });
  }
  check("phone: no console errors or failed requests", issues.length === 0, issues.slice(0, 4).join(" | "));
  await phoneBrowser.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
