/**
 * Production smoke: the page, the world, the mark, the lobby team, a
 * department chosen and reached, its office, a service and the brief form
 * (never submitted), back to the world; then a phone: the stick walks and
 * the tap prompt opens the team's card. Console errors and failed requests
 * are counted throughout (an aborted RSC prefetch is reported separately:
 * the browser cancels those itself when a navigation supersedes them).
 *
 *   ARCHON_BASE=https://archonsoft.tr node scripts/prodsmoke.mjs
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";

const BASE = process.env.ARCHON_BASE ?? "https://archonsoft.tr";
let failed = 0;
const check = (name, ok, note = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
  if (!ok) failed += 1;
};
const consoleErrors = [];
const failedRequests = [];
const aborted = [];
const watch = (page) => {
  page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  });
  page.on("requestfailed", (r) => {
    const text = `${r.failure()?.errorText} ${r.url()}`;
    if (/ERR_ABORTED/.test(text) && /_rsc=/.test(r.url())) aborted.push(text);
    else failedRequests.push(text);
  });
  page.on("response", (r) => {
    if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`);
  });
};

/* ---------------------------------------------------------------- desktop */
{
  const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1460,900", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  await page.bringToFront();
  watch(page);
  const res = await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  check("page loads", res?.status() === 200, String(res?.status()));
  await enterWorld(page, "tr", 5000);
  check("world opens", (await page.locator(".world-overlay").count()) === 1 && (await page.evaluate(() => Boolean(window.__archonScene?.()))));
  const scene = await page.evaluate(() => {
    const s = window.__archonScene();
    return { gate: Boolean(s.getObjectByName("gate")), ring: Boolean(s.getObjectByName("landmark-ring")), stars: Boolean(s.getObjectByName("cosmos:stars")) };
  });
  check("the logo stands, no ring behind it, black sky with stars", scene.gate && !scene.ring && scene.stars, JSON.stringify(scene));
  await page.screenshot({ path: ".qa/final5/prod-desktop-spawn.png" });

  await page.evaluate(() => window.__archonPlace?.(-8.5, 13, 90));
  await page.waitForTimeout(1400);
  check("lobby: the team comes into focus", (await page.locator("[data-focus='true']").count()) === 1);
  await page.keyboard.press("e");
  await page.waitForTimeout(900);
  const card = page.locator("[data-office-card]");
  check("NPC interaction: the team's card opens and they introduce themselves", (await card.getAttribute("data-stage")) === "lobby" && /Merhaba, biz Archon Soft çalışanlarıyız/.test(await card.innerText()));
  await page.keyboard.press("g");
  await page.waitForTimeout(4200);
  const body = await page.evaluate(() => window.__archonBody?.());
  check("department selection and teleport: E-Ticaret, landed at its office", body && Math.abs(body.x - 4.5) < 1.5 && Math.abs(body.z - -62) < 1.5, `${body?.x?.toFixed(1)},${body?.z?.toFixed(1)}`);
  check("office: its card opens at the department stage", (await card.getAttribute("data-office")) === "commerce" && (await card.getAttribute("data-stage")) === "department");
  const sign = await page.evaluate(() => window.__archonScene().getObjectByName("office:commerce")?.getObjectByName("office-sign")?.userData.text);
  check("office: its sign names it", sign === "E-TİCARET ÇÖZÜMLERİ", sign);
  await card.locator("[data-service]").first().click();
  await page.waitForTimeout(700);
  check("form: the brief opens (not submitted)", (await card.locator("[data-office-form]").count()) === 1);
  await page.screenshot({ path: ".qa/final5/prod-desktop-form.png" });
  await card.locator("[data-office-close]").click();
  await page.waitForTimeout(600);
  check("back to the world", (await card.count()) === 0 && (await page.locator(".world-overlay").count()) === 1);
  await browser.close();
}

/* ------------------------------------------------------------------ phone */
{
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=460,1020", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: ua });
  const page = await ctx.newPage();
  await page.bringToFront();
  watch(page);
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 5000);
  check("phone: joystick and jump are up", (await page.locator("[data-joystick]").count()) === 1 && (await page.locator("[data-jump]").count()) === 1);
  const cdp = await ctx.newCDPSession(page);
  const box = await page.locator("[data-joystick]").boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.evaluate(() => window.__archonPlace?.(0, 18, 0));
  await page.waitForTimeout(600);
  const before = await page.evaluate(() => window.__archonBody());
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - 90, id: 1 }] });
  await page.waitForTimeout(1000);
  const moving = await page.evaluate(() => ({ body: window.__archonBody(), move: window.__archonMove?.() }));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(250);
  const stopped = await page.evaluate(() => window.__archonBody());
  const speed = moving.body.pace * 8.8;
  check("phone: the stick walks the explorer, fast, and stops on release", before.z - moving.body.z > 3 && speed > 5 && stopped.pace < 0.05, `moved ${(before.z - moving.body.z).toFixed(1)} m in 1 s, ~${speed.toFixed(1)} m/s, stick ${moving.move?.stick?.toFixed(2)}, pace after release ${stopped.pace.toFixed(2)}`);
  await page.evaluate(() => window.__archonPlace?.(-8.5, 13, 90));
  await page.waitForTimeout(1400);
  const act = page.locator("[data-touch-act]");
  if (await act.count()) await act.tap();
  await page.waitForTimeout(900);
  check("phone: the tap prompt opens the team's card", (await page.locator("[data-office-card]").getAttribute("data-stage").catch(() => null)) === "lobby");
  await page.screenshot({ path: ".qa/final5/prod-phone-card.png" });
  await browser.close();
}

check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
check("no failed requests", failedRequests.length === 0, failedRequests.slice(0, 3).join(" | "));
console.log(`aborted RSC prefetches (browser-cancelled, not failures): ${aborted.length}`);
console.log(`\n${failed ? "SMOKE FAIL" : "SMOKE PASS"} (${failed} failed)`);
process.exit(failed ? 1 : 0);
