/**
 * The client journey, end to end: `GPU=1 node scripts/leads.mjs`
 *
 * Desktop: stand before the lobby team, talk, pick a department by letter,
 * be taken to its office, hear it out, pick a service, give the brief, send
 * it, and read the thanks. Then the route itself: validation, the honeypot,
 * the throttle. Then the same journey on a phone, by touch. Against a local
 * server the lead lands in .qa/leads.jsonl; against production the route is
 * only asked to refuse what it should (a real lead is never sent from here).
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const production = /archonsoft\.tr/.test(BASE);
const gpu = process.env.GPU === "1";
const browser = gpu
  ? await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1460,900", "--disable-backgrounding-occluded-windows"] })
  : await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] });
let passed = 0;
let failed = 0;
const check = (name, ok, note = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
  if (ok) passed += 1;
  else failed += 1;
};
fs.mkdirSync(".qa/world", { recursive: true });

/* ------------------------------------------------------------- desktop */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 160));
  });
  await page.goto(BASE + "/tr", { waitUntil: "networkidle" });
  await enterWorld(page, "tr", 5000);

  /* To the lobby team: stand at their arrival point, facing the desks. */
  await page.evaluate(() => window.__archonPlace?.(-8.5, 13, 90));
  await page.waitForTimeout(1200);
  const focus = await page.locator("[data-focus='true']").count();
  check("the lobby team comes into focus", focus === 1);
  const prompt = (await page.locator(".world-overlay").innerText()).replace(/\s+/g, " ");
  check("the prompt names the team", /Archon Soft ek[iİ]b[iİ]/i.test(prompt), prompt.slice(-160));

  await page.keyboard.press("e");
  await page.waitForTimeout(700);
  const card = page.locator("[data-office-card]");
  check("E opens the team's card at the lobby stage", (await card.getAttribute("data-stage")) === "lobby");
  const said = await card.locator("[data-transcript]").innerText();
  check("they introduce themselves in Turkish", /Merhaba, biz Archon Soft çalışanlarıyız/.test(said), said.slice(0, 80));
  check("and ask what they can do", /Sizler için ne yapabiliriz/.test(said));
  check("ten departments, A to J", (await card.locator("[data-department]").count()) === 10);
  check("the explorer attends the speaker", await page.evaluate(() => window.__archonBody?.() && true));

  /* A — Web & Mobile — by letter. The team takes the visitor there. */
  await page.keyboard.press("a");
  await page.waitForTimeout(400);
  check("the letter A picks web & mobile and the card says where it is going", (await card.locator("[data-office-going]").count()) === 1);
  await page.waitForTimeout(3200);
  const body = await page.evaluate(() => window.__archonBody?.());
  check("the teleport lands at the web office", body && Math.abs(body.x - -4.5) < 1.5 && Math.abs(body.z - -62) < 1.5, `${body?.x?.toFixed(1)},${body?.z?.toFixed(1)}`);
  await page.waitForTimeout(1200);
  check("the office's card opens by itself, at the department stage", (await card.getAttribute("data-office")) === "web" && (await card.getAttribute("data-stage")) === "department");
  const intro = await card.locator("[data-transcript]").innerText();
  check("its people explain what they build", /Web ve mobil projeler geliştiriyoruz/.test(intro), intro.slice(0, 80));
  check("eight services offered", (await card.locator("[data-service]").count()) === 8);

  await page.keyboard.press("b");
  await page.waitForTimeout(400);
  check("B picks the SaaS platform and the brief begins", (await card.getAttribute("data-stage")) === "brief" && (await card.locator("[data-office-form]").count()) === 1);

  /* Send it empty first. */
  await card.locator("[data-office-submit]").click();
  await page.waitForTimeout(300);
  const formText = await card.innerText();
  check("an empty brief is refused with the fields named", /Adınızı yazın/.test(formText) && /onayınız gerekiyor/.test(formText));

  check("the brief opens short: name, email, project", (await card.locator("input, textarea, select").count()) <= 5);
  await card.locator("[data-office-more]").click();
  await page.waitForTimeout(200);
  check("more detail unfolds the optional fields", (await card.locator("select[name=budget]").count()) === 1);
  await card.locator("input[name=name]").fill("QA Ziyaretçi");
  await card.locator("input[name=company]").fill("QA Studio");
  await card.locator("input[name=email]").fill("qa@example.com");
  await card.locator("input[name=phone]").fill("+90 555 000 00 00");
  await card.locator("textarea[name=description]").fill("Archon World QA: end-to-end lead flow test, not a real request.");
  await card.locator("select[name=budget]").selectOption("10-25");
  await card.locator("select[name=timeline]").selectOption("1-3m");
  await card.locator("input[name=consent]").check();

  if (production) {
    /* On production the brief is not sent: a QA row must never reach the studio. */
    check("production: the brief is filled but not sent", true);
  } else {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/lead") && r.request().method() === "POST"),
      card.locator("[data-office-submit]").click(),
    ]);
    const data = await response.json();
    check("the route accepts it", response.status() === 200 && data.ok === true, JSON.stringify(data));
    check("the lead is kept", data.stored === "file" || data.stored === "firestore", data.stored);
    check("the record carries a status", ["new", "notified", "notification_partial", "failed"].includes(data.status), data.status);
    check("the notifications report honestly", ["sent", "skipped", "mocked", "failed"].includes(data.notified?.whatsapp) && ["sent", "skipped", "failed"].includes(data.notified?.email), JSON.stringify(data.notified));
    await page.waitForTimeout(600);
    check("the card thanks the visitor", (await card.getAttribute("data-stage")) === "done" && /Talebinizi ekibimize ilettik/.test(await card.innerText()));
    check("with a reference", /wl_[a-z0-9_]+/i.test(await card.innerText()));
    if (data.stored === "file") {
      const rows = fs.readFileSync(".qa/leads.jsonl", "utf8").trim().split(/\r?\n/).map((row) => JSON.parse(row));
      const last = rows.filter((row) => row.department).pop();
      const update = rows.filter((row) => row.update && row.id === last.id).pop();
      check("the stored row is followed by its notification status", Boolean(update?.update?.status), JSON.stringify(update?.update));
      check("the stored row carries the journey", last.department === "web" && last.service === "saas" && last.source === "archon_world" && Array.isArray(last.journey), JSON.stringify(last.journey));
      check("and the locale and device", last.locale === "tr" && last.device === "desktop");
    }
    await card.locator("[data-office-lobby]").click();
    await page.waitForTimeout(2600);
    const back = await page.evaluate(() => window.__archonBody?.());
    check("back to the lobby closes the card and teleports home", (await page.locator("[data-office-card]").count()) === 0 && back && Math.abs(back.z - 16) < 1.5, `${back?.x?.toFixed(1)},${back?.z?.toFixed(1)}`);
  }
  await page.screenshot({ path: ".qa/world/leads-desktop.png" });

  /* The three rooms the lobby used to handle: marketing, consulting, innovation. */
  for (const [dept, at, word] of [
    ["marketing", [8.5, -8, -90], /PAZARLAMA|Pazarlama/],
    ["consulting", [-8.5, -8, 90], /DANIŞMANLIK|Danışmanlık/],
    ["other", [-6.5, -34, 90], /ÖZEL PROJE|Özel Proje/],
  ]) {
    await page.evaluate(([x, z, d]) => window.__archonPlace?.(x, z, d), at);
    await page.locator("[data-focus='true']").waitFor({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(1400);
    const label = (await page.locator(".world-overlay").innerText()).replace(/\s+/g, " ");
    check(`${dept}: its room is in the world and in focus`, word.test(label), label.slice(-120));
    await page.keyboard.press("e");
    await page.waitForTimeout(600);
    check(`${dept}: talking opens the department stage`, (await card.getAttribute("data-office")) === dept && (await card.getAttribute("data-stage")) === "department");
    await page.screenshot({ path: `.qa/world/leads-${dept}.png` });
    await card.locator("[data-office-close]").click();
    await page.waitForTimeout(300);
  }

  /* The world's effects, by the scene. */
  const effects = await page.evaluate(() => {
    const scene = window.__archonScene();
    let firePoints = 0;
    let torches = 0;
    scene.traverse((o) => {
      if (o.name === "fire") o.traverse((p) => { if (p.isPoints) firePoints += p.geometry.attributes.position?.count ?? 0; });
      if (o.name === "torches") torches += 1;
    });
    return { firePoints, torches };
  });
  check("the robot burns: fire particles on it", effects.firePoints > 500, String(effects.firePoints));
  check("fire columns stand on every bridge", effects.torches === 5, String(effects.torches));
  await page.evaluate(() => window.__archonComet?.());
  /* Sample the pass: it crosses the visitor's view, low, in front of the skyline. */
  let best = null;
  for (let i = 0; i < 24; i += 1) {
    await page.waitForTimeout(400);
    const comet = await page.evaluate(() => window.__archonCometView?.());
    if (comet?.visible && (!best || Math.abs(comet.x) < Math.abs(best.x))) best = comet;
    if (comet?.inView && best && Math.abs(best.x) < 0.5) break;
  }
  check("the comet crosses the visitor's view, low, in front of the skyline", best && best.inView && best.height < 60 && Math.abs(best.x) < 0.6, JSON.stringify(best));

  check("no page errors on the desktop journey", errors.length === 0, errors.join(" | ").slice(0, 200));
  await page.close();
}

/* ------------------------------------------------------------- privacy */
{
  for (const locale of ["tr", "en"]) {
    const response = await fetch(`${BASE}/${locale}/privacy`);
    const html = await response.text();
    check(`the privacy notice answers at /${locale}/privacy`, response.status === 200 && /KVKK/.test(html) && /info@archonsoft\.tr/.test(html));
  }
  const status = await (await fetch(`${BASE}/api/lead`)).json();
  check("the lead route reports what is wired up, without secrets", status.ok === true && ["active", "inactive"].includes(status.store) && ["active", "inactive"].includes(status.email) && ["active", "inactive"].includes(status.whatsapp) && ["firestore", "file", "none"].includes(status.detail?.store) && ["configured", "missing"].includes(status.detail?.email) && ["configured", "mocked", "missing"].includes(status.detail?.whatsapp) && Array.isArray(status.missing) && !JSON.stringify(status).includes("BEGIN PRIVATE"), JSON.stringify(status));
}

/* --------------------------------------------------------------- route */
{
  const post = async (payload) => {
    const response = await fetch(BASE + "/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return { status: response.status, data: await response.json().catch(() => null) };
  };
  const valid = {
    name: "QA",
    email: "qa@example.com",
    department: "ai",
    service: "assistant",
    description: "Archon World QA: validation probe, not a real request.",
    consent: true,
    locale: "en",
    device: "desktop",
  };
  const bad = await post({ ...valid, email: "nope", service: "unknown", consent: false });
  check("the route refuses a bad brief with field errors", bad.status === 422 && bad.data?.errors?.email === "emailInvalid" && bad.data?.errors?.service === "service" && bad.data?.errors?.consent === "consent", JSON.stringify(bad.data));
  const malformed = await fetch(BASE + "/api/lead", { method: "POST", body: "{" });
  check("and malformed JSON", malformed.status === 400);
  const bot = await post({ ...valid, website: "http://spam" });
  check("the honeypot answers ok and keeps nothing", bot.status === 200 && bot.data?.ok === true && bot.data?.stored === undefined);
  if (!production) {
    let limited = 0;
    for (let i = 0; i < 6; i += 1) {
      const one = await post({ ...valid, description: `Archon World QA: throttle probe ${i}, not a real request.` });
      if (one.status === 429) limited += 1;
    }
    check("the throttle closes after a few briefs from one address", limited >= 1, `${limited} refused`);
  }
}

/* ---------------------------------------------------------------- phone */
{
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: ua });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 4000);
  await page.evaluate(() => window.__archonPlace?.(-8.5, 13, 90));
  await page.waitForTimeout(1200);
  const act = page.locator("[data-touch-act]");
  check("phone: the tappable prompt appears before the team", (await act.count()) === 1);
  await act.tap();
  await page.waitForTimeout(700);
  const card = page.locator("[data-office-card]");
  check("phone: the card opens as a sheet", (await card.getAttribute("data-stage")) === "lobby");
  check("phone: the joystick is put away while the card is up", (await page.locator("[data-joystick]").count()) === 0);
  await card.locator("[data-department='consulting']").tap();
  await page.waitForTimeout(400);
  check("phone: consulting has a room; the team says where it is taking the visitor", (await card.locator("[data-office-going]").count()) === 1 && /Danışmanlık/.test(await card.innerText()));
  await page.waitForTimeout(3600);
  check("phone: the strategy room's card opens on arrival", (await card.getAttribute("data-office")) === "consulting" && (await card.getAttribute("data-stage")) === "department");
  await card.locator("[data-service='discovery']").tap();
  await page.waitForTimeout(500);
  check("phone: the brief opens", (await card.locator("[data-office-form]").count()) === 1);
  const box = await card.locator("input[name=name]").boundingBox();
  check("phone: inputs are thumb-sized", box && box.height >= 44, `${box?.height}px`);
  await card.locator("input[name=name]").tap();
  await page.keyboard.type("QA");
  await page.waitForTimeout(200);
  const scrollable = await page.locator("[data-office-card] > div > div").first().evaluate((el) => getComputedStyle(el).overflowY === "auto");
  check("phone: the sheet scrolls inside itself, keyboard or not", scrollable && (await card.locator("[data-office-submit]").count()) === 1);
  check("phone: the brief opens short on a phone too", (await card.locator("input, textarea, select").count()) <= 5);
  await page.screenshot({ path: ".qa/world/leads-mobile-form.png" });
  await card.locator("[data-office-close]").tap();
  await page.waitForTimeout(500);
  check("phone: closing brings the joystick back", (await page.locator("[data-joystick]").count()) === 1);
  await page.screenshot({ path: ".qa/world/leads-mobile.png" });
  check("no page errors on the phone journey", errors.length === 0, errors.join(" | ").slice(0, 200));
  await ctx.close();
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
