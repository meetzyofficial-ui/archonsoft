/**
 * The service explorer under the opening: what it lists, how it is chosen,
 * the gallery, the brief it hands to the contact form, and the door into the
 * world.
 *
 *   node scripts/services.mjs          (headed Chrome; phones are emulated — not devices)
 *   GPU=1 node scripts/services.mjs    (also walks into the world through the explorer)
 */
import { chromium, devices } from "playwright";
import { enterWorld } from "./lib/enter.mjs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const gpu = process.env.GPU === "1";
let failed = 0;
const check = (name, ok, note = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
  if (!ok) failed += 1;
};

const browser = await chromium.launch({
  headless: false,
  channel: "chrome",
  args: ["--window-size=1480,960", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"],
});
const errors = [];
const failedRequests = [];
const watch = (page, label) => {
  page.on("pageerror", (e) => errors.push(`${label} ${String(e).slice(0, 160)}`));
  page.on("console", (m) => m.type() === "error" && !/status of 4\d\d/.test(m.text()) && errors.push(`${label} ${m.text().slice(0, 160)}`));
  page.on("requestfailed", (r) => {
    const text = `${r.failure()?.errorText} ${r.url()}`;
    if (/ERR_ABORTED/.test(text) && /_rsc=|\/_next\/image/.test(r.url())) return;
    failedRequests.push(`${label} ${text}`);
  });
};
const dismissWorld = async (ctx) =>
  ctx.addInitScript(() => {
    try {
      sessionStorage.setItem("archon-world-dismissed", "1");
    } catch {}
  });
const toExplorer = async (page) => {
  await page.locator("#services").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
};

/* ------------------------------------------------------------ the markup */
{
  const html = await (await fetch(`${BASE}/tr`)).text();
  const titles = ["Mobil uygulama", "Web platformu &amp; SaaS", "Özel yazılım", "E-ticaret", "Yapay zekâ", "Otomasyon", "API &amp; entegrasyon", "Etkileşimli 3D &amp; WebGL", "Ürün &amp; arayüz tasarımı"];
  check("every service name is in the server markup", titles.every((one) => html.includes(one)), titles.filter((one) => !html.includes(one)).join(", "));
  check("every service's text is in the markup too", (html.match(/data-service-panel="/g) ?? []).length === 9);
  check("the explorer comes straight after the opening", html.indexOf('id="services"') > html.indexOf('id="hero-heading"') && html.indexOf('id="services"') < html.indexOf('id="projects"'));
  check("the old capability rows are gone", !/id="capabilities"/.test(html));
  check("no codename reaches the page", !/\b(Divan|Kervan|Ulak|Vardiya|Tezgah|Vesile)\b/.test(html.replace(/\/labs\/[a-z]+/g, "")));
  check("no price is named", !/\$\s?\d|₺\s?\d|\d+\s?(TL|USD)\b/.test(html.slice(html.indexOf('id="services"'), html.indexOf('id="projects"'))));
}

/* ---------------------------------------------------------------- desktop */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "tr-TR" });
  await dismissWorld(ctx);
  const page = await ctx.newPage();
  await page.bringToFront();
  watch(page, "desktop");
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" });
  await toExplorer(page);

  const tabs = page.locator('#services [role="tab"]');
  check("nine services are offered as tabs", (await tabs.count()) === 9, String(await tabs.count()));
  const ids = await tabs.evaluateAll((els) => els.map((el) => el.getAttribute("data-service")));
  check("no service appears twice", new Set(ids).size === ids.length, ids.join(","));
  check("the first one is open to begin with", (await tabs.first().getAttribute("aria-selected")) === "true");
  check("its stage is on the page", (await page.locator('#services [data-service-panel="mobile"] .project-stage img').count()) >= 3);
  check("no other service has loaded a picture", (await page.locator('#services [data-service-panel]:not([data-service-panel="mobile"]) img').count()) === 0);

  /* Hover: the others step back. */
  await page.locator('#services [role="tab"][data-service="ai"]').hover();
  await page.waitForTimeout(700);
  const dim = await page.locator('#services [role="tab"][data-service="commerce"]').evaluate((el) => Number(getComputedStyle(el).opacity));
  check("considering one dims the others", dim < 0.7, String(dim));

  /* Click. */
  const before = await page.locator('#services [data-service-panel][data-open="true"] h3').innerText();
  await page.locator('#services [role="tab"][data-service="ai"]').click();
  await page.waitForTimeout(900);
  check("choosing a service selects it", (await page.locator('#services [role="tab"][data-service="ai"]').getAttribute("aria-selected")) === "true");
  const after = await page.locator('#services [data-service-panel][data-open="true"] h3').innerText();
  check("and the panel becomes that service", before !== after && (await page.locator('#services [data-service-panel="ai"]').getAttribute("data-open")) === "true", after);
  check("a concept is labelled as one", /konsept/i.test(await page.locator('#services [data-service-panel="ai"]').innerText()));

  /* Keyboard. */
  await page.locator('#services [role="tab"][data-service="ai"]').focus();
  await page.keyboard.press("ArrowDown");
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-service"));
  check("arrow keys move along the list", focused === "automation", String(focused));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(700);
  check("Enter opens the focused service", (await page.locator('#services [data-service-panel="automation"]').getAttribute("data-open")) === "true");
  await page.keyboard.press("End");
  await page.keyboard.press(" ");
  await page.waitForTimeout(700);
  check("End and Space reach and open the last", (await page.locator('#services [data-service-panel="design"]').getAttribute("data-open")) === "true");

  /* Gallery. */
  await page.locator('#services [role="tab"][data-service="webgl"]').click();
  await page.waitForTimeout(900);
  const trigger = page.locator('#services [data-service-panel="webgl"] [data-service-explore]');
  await trigger.click();
  await page.waitForTimeout(800);
  const dialog = page.locator('[role="dialog"][data-service-gallery]');
  check("the gallery opens as a dialog", (await dialog.count()) === 1 && (await dialog.getAttribute("aria-modal")) === "true");
  const count = async () => (await dialog.locator("p").first().innerText()).replace(/\s+/g, " ");
  const first = await count();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  check("arrow keys move through it", first !== (await count()), `${first} → ${await count()}`);
  await dialog.getByRole("button", { name: /Önceki/ }).click();
  await page.waitForTimeout(400);
  check("and the buttons do too", first === (await count()));
  check("focus is held inside", await page.evaluate(() => Boolean(document.activeElement?.closest("[data-service-gallery]"))));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  check("Escape closes it", (await dialog.count()) === 0);
  check("and focus goes back to what opened it", await page.evaluate(() => document.activeElement?.hasAttribute("data-service-explore") ?? false));

  /* Related work. */
  await page.locator('#services [role="tab"][data-service="mobile"]').click();
  await page.waitForTimeout(700);
  check("a service names the real project it points to", (await page.locator('#services [data-service-panel="mobile"] [data-service-project="meetzy"]').count()) === 1);

  /* The brief. */
  await page.locator('#services [data-service-panel="mobile"] [data-service-lead]').click();
  await page.waitForTimeout(1200);
  const brief = page.locator("#services [data-service-brief]");
  check("tell-us opens the contact form in place", (await brief.isVisible()) && (await brief.locator("form").count()) === 1);
  check("with the service chosen", (await brief.locator('[data-chosen-service="mobile"]').count()) === 1);
  check("and its project type selected", (await brief.locator('input[name="projectType"][value="mobile"]').isChecked()));
  await brief.locator('input[name="name"]').fill("Explorer QA");
  await brief.getByRole("button", { name: /Hizmeti değiştir/ }).click();
  await page.waitForTimeout(700);
  check("change-the-service goes back to the explorer", !(await brief.isVisible()) && (await page.locator('#services [data-service-panel="mobile"]').getAttribute("data-open")) === "true");
  await page.locator('#services [role="tab"][data-service="commerce"]').click();
  await page.waitForTimeout(600);
  await page.locator('#services [data-service-panel="commerce"] [data-service-lead]').click();
  await page.waitForTimeout(1000);
  check("the new choice reaches the form", (await brief.locator('[data-chosen-service="commerce"]').count()) === 1 && (await brief.locator('input[name="projectType"][value="commerce"]').isChecked()));
  check("and nothing typed was lost", (await brief.locator('input[name="name"]').inputValue()) === "Explorer QA");
  await brief.getByRole("button", { name: /Gönder/ }).click();
  await page.waitForTimeout(600);
  check("the form still validates the way it did", (await brief.locator("[aria-invalid=true]").count()) > 0);

  /* The project link navigates. */
  await brief.getByRole("button", { name: /Hizmeti değiştir/ }).click();
  await page.waitForTimeout(500);
  await page.locator('#services [data-service-panel="commerce"] [data-service-project="erden"]').click();
  await page.waitForURL("**/tr/projects/erden", { timeout: 8000 }).catch(() => {});
  check("the related project opens its case study", page.url().endsWith("/tr/projects/erden"), page.url());

  /* Deep links. */
  await page.goto(`${BASE}/tr?service=ai`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  check("a link can open a service", (await page.locator('#services [role="tab"][data-service="ai"]').getAttribute("aria-selected")) === "true");
  await page.goto(`${BASE}/tr?service=nope`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  check("an unknown service falls back to the first", (await page.locator('#services [role="tab"][data-service="mobile"]').getAttribute("aria-selected")) === "true");
  await page.goto(`${BASE}/tr/contact?service=ai`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  check("the contact page takes the service from its link", (await page.locator('[data-chosen-service="ai"]').count()) === 1 && (await page.locator('input[name="projectType"][value="ai"]').isChecked()));
  await page.goto(`${BASE}/tr/contact?service=nope`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  check("and ignores one it does not know", (await page.locator("[data-chosen-service]").count()) === 0);

  await ctx.close();
}

/* ------------------------------------------------------------- the route */
{
  const post = (body) =>
    fetch(`${BASE}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const valid = { name: "Explorer QA", email: "qa@example.com", projectType: "mobile", message: "Explorer QA: validation probe, not a real request." };
  const bad = await post({ ...valid, service: "nope" });
  const badBody = await bad.json().catch(() => ({}));
  check("the route refuses a service it does not list", bad.status === 422 && badBody.errors?.service === "serviceInvalid", `${bad.status} ${JSON.stringify(badBody)}`);
  const good = await post({ ...valid, service: "mobile" });
  const goodBody = await good.json().catch(() => ({}));
  check("and accepts one it does, exactly as before", good.status !== 422, `${good.status} ${JSON.stringify(goodBody)}`);
  const none = await post(valid);
  check("a message without a service is unchanged", none.status !== 422, String(none.status));
}

/* ----------------------------------------------------------------- phone */
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "tr-TR" });
  await dismissWorld(ctx);
  const page = await ctx.newPage();
  await page.bringToFront();
  watch(page, "phone");
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" });
  await toExplorer(page);
  const tab = page.locator('#services [role="tab"][data-service="commerce"]');
  await tab.scrollIntoViewIfNeeded();
  await tab.tap();
  await page.waitForTimeout(900);
  check("phone: a tap opens a service", (await page.locator('#services [data-service-panel="commerce"]').getAttribute("data-open")) === "true");
  const height = await tab.evaluate((el) => el.getBoundingClientRect().height);
  check("phone: every service is a full-size target", height >= 44, `${Math.round(height)}px`);
  await page.locator('#services [data-service-panel="commerce"] [data-service-explore]').tap();
  await page.waitForTimeout(800);
  const dialog = page.locator("[data-service-gallery]");
  const counter = async () => (await dialog.locator("p").first().innerText()).replace(/\s+/g, " ");
  const first = await counter();
  const box = await dialog.boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.width * 0.8, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.width * 0.45, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.width * 0.2, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(500);
  check("phone: a swipe moves the gallery", first !== (await counter()), `${first} → ${await counter()}`);
  await dialog.getByRole("button", { name: /Kapat/ }).tap();
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("phone: nothing overflows sideways", overflow <= 1, `${overflow}px`);
  check("phone: no robot cursor on touch", (await page.locator("[data-cursor-root]").count()) === 0);
  await ctx.close();
}

/* --------------------------------------------------------- reduced motion */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "tr-TR", reducedMotion: "reduce" });
  await dismissWorld(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" });
  await toExplorer(page);
  await page.locator('#services [role="tab"][data-service="web"]').click();
  await page.waitForTimeout(300);
  const animation = await page.locator('#services [data-service-panel="web"] .service-enter').evaluate((el) => getComputedStyle(el).animationName);
  check("reduced motion: a service changes without animating", animation === "none", animation);
  check("reduced motion: and still changes", (await page.locator('#services [data-service-panel="web"]').getAttribute("data-open")) === "true");
  await page.locator('#services [data-service-panel="web"] [data-service-explore]').click();
  await page.waitForTimeout(300);
  check("reduced motion: the gallery still works", (await page.locator("[data-service-gallery]").count()) === 1);
  await page.keyboard.press("Escape");
  await ctx.close();
}

/* ------------------------------------------------------------------ no JS */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "tr-TR", javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/tr`, { waitUntil: "domcontentloaded" });
  const shown = await page.locator("#services [data-service-panel]").evaluateAll((els) => els.filter((el) => getComputedStyle(el).display !== "none").length);
  check("without JavaScript every service is readable", shown === 9, String(shown));
  const href = await page.locator('#services [data-service-panel="ai"] [data-service-lead]').getAttribute("href");
  check("and tell-us is a link that carries the service", href === "/tr/contact?service=ai", String(href));
  await ctx.close();
}

/* ------------------------------------------------------------------ world */
if (gpu) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "tr-TR" });
  await dismissWorld(ctx);
  const page = await ctx.newPage();
  await page.bringToFront();
  watch(page, "world");
  await page.goto(`${BASE}/tr`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.getAttribute("data-logo-live") === "true", null, { timeout: 20000 }).catch(() => {});
  await toExplorer(page);
  await page.locator('#services [role="tab"][data-service="webgl"]').click();
  await page.waitForTimeout(700);
  await page.locator('#services [data-service-panel="webgl"] [data-world-trigger]').click();
  await page.waitForTimeout(1500);
  check("3D: explore-in-the-world opens the world", (await page.locator(".world-overlay").count()) === 1);
  const layers = await page.evaluate(() => ({ open: document.documentElement.getAttribute("data-world-open"), logo: document.querySelectorAll(".logo-field canvas").length }));
  check("3D: the site's logo layer is gone while it is open", layers.open === "true" && layers.logo === 0, JSON.stringify(layers));
  await enterWorld(page, "tr", 9000);
  const body = await page.evaluate(() => window.__archonBody?.());
  check("3D: the visitor is taken away from the gate", body && Math.hypot(body.x, body.z - 24) > 10, JSON.stringify(body && { x: Math.round(body.x), z: Math.round(body.z) }));
  let card = "";
  for (let i = 0; i < 12 && !/3D \/ Oyun/i.test(card); i += 1) {
    await page.waitForTimeout(500);
    card = await page.locator(".world-overlay [role=dialog], .world-overlay").first().innerText();
  }
  check("3D: and the 3D studio's office card opens for the brief", /3D \/ Oyun/i.test(card), card.replace(/\s+/g, " ").match(/.{0,30}3D \/ Oyun.{0,30}/i)?.[0] ?? card.replace(/\s+/g, " ").slice(0, 80));

  await ctx.close();
}

check("no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
check("no failed requests", failedRequests.length === 0, failedRequests.slice(0, 3).join(" | "));
await browser.close();
console.log(`\n${failed === 0 ? "All service explorer checks passed." : `${failed} check(s) failed.`}`);
process.exit(failed ? 1 : 0);
