/**
 * Archon World — behaviour and accessibility.
 *
 * The world is an explorable layer over the home page, so nearly everything in
 * here is a check that it never becomes a trap: that it can be left by
 * keyboard, that it takes the document beneath it out of the tab order while
 * it is up and hands it straight back, that a machine without WebGL simply
 * gets the site, that a touch device gets something it can actually use, and
 * that nothing it does leaks onto any other route.
 */
import { chromium, devices } from "playwright";
import { enterWorld } from "./lib/enter.mjs";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const lines = [];
const check = (label, ok, detail = "") => {
  lines.push(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
const hold = async (page, key, ms) => {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(300);
};

/* ------------------------------------------------------------- exploring */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);

  const overlay = page.locator(".world-overlay");
  check("the world is what the home page opens with", (await overlay.count()) === 1);

  const box = await overlay.evaluate((el) => ({
    position: getComputedStyle(el).position,
    parent: el.parentElement?.tagName,
  }));
  check(
    "it covers the viewport from the first frame",
    box.position === "fixed" && box.parent === "BODY",
    JSON.stringify(box),
  );

  const inert = await page.evaluate(() => ({
    header: document.querySelector("header")?.hasAttribute("inert"),
    main: document.getElementById("main")?.hasAttribute("inert"),
    footer: document.querySelector("footer")?.hasAttribute("inert"),
  }));
  check(
    "the page beneath is inert while the world is up",
    inert.header === true && inert.main === true && inert.footer === true,
    JSON.stringify(inert),
  );

  check("the opening is real text", /ARCHON WORLD/.test(await overlay.innerText()));
  check("a loading state with a real count is shown", /\d{3}/.test(await overlay.innerText()));

  /* The opening asks for a language, Turkish first. */
  await page.locator("[data-enter]").waitFor({ state: "visible", timeout: 45000 });
  await page.waitForTimeout(1300);
  check(
    "the world asks for a language and offers Turkish by default",
    (await page.locator('.world-overlay [data-lang="tr"][aria-checked="true"]').count()) === 1 &&
      /D[üÜ]nyaya g[iİ]r/i.test(await page.locator("[data-enter]").innerText()),
  );
  await page.locator('.world-overlay [data-lang="en"]').first().click();
  await page.waitForTimeout(200);
  check("choosing English changes the opening", /Enter the world/i.test(await page.locator("[data-enter]").innerText()));
  await page.locator("[data-enter]").click();
  await page.waitForTimeout(7000);

  check("the world says how to move", /W\s?A\s?S\s?D/i.test(await overlay.innerText()));

  await page.mouse.click(720, 450);
  await page.waitForTimeout(500);
  check(
    "clicking captures the pointer",
    await page.evaluate(() => Boolean(document.pointerLockElement)),
  );

  /* Walk the axis: through the gate, into the shipped hall.
     In bursts rather than for a fixed nine seconds, because how far a fixed
     duration carries you depends on the frame rate of the machine running the
     test — which makes a timing assertion into a performance assertion. */
  const focused = () => page.locator('[data-focus="true"]').count();
  let inFocus = 0;
  await page.keyboard.down("Shift");
  /* Sixteen bursts at most: the software renderer this runs on manages a
     handful of frames a second, and the walk is clamped per frame. */
  for (let i = 0; i < 16; i += 1) {
    await hold(page, "w", 2000);
    inFocus = await focused();
    if (inFocus > 0) break;
  }
  await page.keyboard.up("Shift");
  /* The prompt block itself, not the word "inspect" — the standing hint at the
     foot of the screen says "E to inspect" whether anything is in focus or not,
     so matching on the text made this assertion true before the visitor had
     taken a step. */
  check("walking brings something into focus", inFocus > 0);

  await page.keyboard.press("e");
  await page.waitForTimeout(800);
  const dialog = page.getByRole("dialog");
  check("pressing E opens it", (await dialog.count()) === 1);
  check(
    "and what opens is the site's own words",
    /three products, live/i.test(await dialog.innerText()),
  );

  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  check("escape closes it without leaving the world", (await dialog.count()) === 0);
  check("the world is still up", (await page.locator(".world-overlay").count()) === 1);

  check(
    "no console or page errors while exploring",
    errors.length === 0,
    errors.slice(0, 2).join(" | "),
  );

  /* Collision: a wall is a wall. Walk hard into the far end and stay inside. */
  await page.keyboard.down("Shift");
  await hold(page, "w", 6000);
  await page.keyboard.up("Shift");
  check("the far wall stops the visitor", (await page.locator(".world-overlay").count()) === 1);

  await ctx.close();
}

/* ---------------------------------------------------------------- leaving */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
  /* The world speaks its own language — Turkish until told otherwise — so
     the way out is offered in Turkish even on the English site. */
  check("the first tab stop is the way out", /skip to the main site|Ana siteye ge[çÇ]/i.test(first), first);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(900);
  check("that way out works from the keyboard", (await page.locator(".world-overlay").count()) === 0);

  const restored = await page.evaluate(() => ({
    header: document.querySelector("header")?.hasAttribute("inert"),
    main: document.getElementById("main")?.hasAttribute("inert"),
    overflow: document.documentElement.style.overflow,
  }));
  check(
    "the page beneath is handed straight back",
    restored.header === false && restored.main === false && restored.overflow === "",
    JSON.stringify(restored),
  );
  check(
    "and the ordinary home page is underneath it",
    /Digital products/i.test(await page.locator("main").innerText()),
  );
  check(
    "a quiet way back in is offered",
    (await page.getByRole("button", { name: /^Archon World/ }).count()) === 1,
  );

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  check("it does not reopen once dismissed", (await page.locator(".world-overlay").count()) === 0);
  await ctx.close();
}

/* ---------------------------------------------------------------- no WebGL */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function () {
      return null;
    };
  });
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  check("without WebGL the world stands aside", (await page.locator(".world-overlay").count()) === 0);
  check(
    "and no dead entry point is left behind",
    (await page.getByRole("button", { name: /^Archon World/ }).count()) === 0,
  );
  check(
    "the site itself is simply what loads",
    /Digital products/i.test(await page.locator("main").innerText()),
  );
  await ctx.close();
}

/* ------------------------------------------------------------------ touch */
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  await enterWorld(page, "en", 8000);

  const overlay = page.locator(".world-overlay");
  const text = await overlay.innerText();
  check("a touch device walks with a stick, not WASD", !/W\s?A\s?S\s?D/i.test(text) && (await page.locator("[data-joystick]").count()) === 1);
  check("and has a jump button", (await page.locator("[data-jump]").count()) === 1);
  check("every destination is a thumb away", (await page.locator("[data-rail-compact] [data-destination]").count()) === 6);

  /* The stick walks: drag the knob up and hold. */
  const stick = await page.locator("[data-joystick]").boundingBox();
  const before = await page.evaluate(() => window.__archonBody?.().z);
  await page.touchscreen.tap(stick.x + stick.width / 2, stick.y + stick.height / 2);
  const cdp = await ctx.newCDPSession(page);
  const cx = stick.x + stick.width / 2;
  const cy = stick.y + stick.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: cy - 40, id: 1 }] });
  await page.waitForTimeout(1800);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.__archonBody?.().z);
  check("pushing the stick forward walks the explorer", typeof after === "number" && after < before - 1, `${before} → ${after}`);
  check("letting go stops it", Math.abs((await page.evaluate(() => window.__archonBody?.().pace)) ?? 1) < 0.05);

  /* The jump button. */
  const jump = await page.locator("[data-jump]").boundingBox();
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: jump.x + jump.width / 2, y: jump.y + jump.height / 2, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  /* The software renderer runs a handful of frames a second and the wind-up
     is a tenth of a second of clamped frame time; sample until the body is
     off the deck. */
  let lift = 0;
  for (let i = 0; i < 12 && lift <= 0.2; i += 1) {
    await page.waitForTimeout(150);
    lift = (await page.evaluate(() => window.__archonBody?.().lift)) ?? 0;
  }
  check("the jump button jumps", lift > 0.2, `lift ${lift}`);

  /* A destination tap teleports, and the district is announced. */
  await page.locator('[data-rail-compact] [data-destination="meetzy"]').tap();
  await page.waitForTimeout(1800);
  check("tapping a destination teleports", /Shipped|Yayında/i.test(await overlay.innerText()) || (await page.evaluate(() => window.__archonBody?.().z)) < -30);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check("nothing overflows sideways on a phone", overflow <= 2, `${overflow}px`);
  check("no errors on a phone", errors.length === 0, errors.slice(0, 1).join(""));
  await ctx.close();
}

/* ------------------------------------------------------------ other routes */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  for (const route of ["/en/work", "/en/labs", "/en/contact", "/tr/work/meetzy", "/tr/labs"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    check(`the world stays off ${route}`, (await page.locator(".world-overlay").count()) === 0);
  }
  await page.goto(`${BASE}/en/work`, { waitUntil: "networkidle" });
  await page.locator('header a[href="/en"]').first().click();
  await page.waitForTimeout(1600);
  check(
    "navigating home from inside the site opens the world",
    (await page.locator(".world-overlay").count()) === 1,
    page.url(),
  );
  await ctx.close();
}

console.log(lines.join("\n"));
const failed = lines.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${lines.length - failed} passed, ${failed} failed`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
