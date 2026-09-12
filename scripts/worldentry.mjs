import { chromium, devices } from "playwright";
import path from "node:path";

const OUT = ".qa/site";
const BASE = "http://localhost:3210";
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
const lines = [];
const check = (label, ok, detail = "") =>
  lines.push(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);

/** A visitor who has already dismissed the world, which is the case that matters. */
const returning = async (options = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, ...options });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem("archon-world-dismissed", "1");
    } catch {}
  });
  return ctx;
};

/* From the navigation, on a page that is not the home page. */
{
  const ctx = await returning();
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  await page.goto(BASE + "/en/capabilities", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  check("the navigation carries the world", (await page.getByRole("link", { name: "World", exact: true }).count()) >= 1);

  await page.getByRole("link", { name: "World", exact: true }).first().click();
  await page.waitForTimeout(2600);
  check("it takes the visitor home", /\/en$/.test(page.url()), page.url());
  check("and opens the world", (await page.locator(".world-overlay").count()) === 1);
  check("no page errors", errors.length === 0, errors[0] ?? "");
  await page.screenshot({ path: path.join(OUT, "w-from-nav.png") });
  await ctx.close();
}

/* From the invitation band, on the home page itself. */
{
  const ctx = await returning();
  const page = await ctx.newPage();
  await page.goto(BASE + "/en", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  check("a returning visitor is not ambushed by it", (await page.locator(".world-overlay").count()) === 0);

  const band = page.locator("#world");
  await band.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const text = await band.innerText();
  check("the home page has a chapter for it", /Archon World/i.test(text));
  check("which lists the districts", /Shipped/i.test(text) && /Archive/i.test(text), text.replace(/\s+/g, " ").slice(0, 80));
  await page.screenshot({ path: path.join(OUT, "w-band.png") });

  await page.getByRole("link", { name: /Enter the world/i }).click();
  await page.waitForTimeout(2200);
  check("and the button opens it from the home page", (await page.locator(".world-overlay").count()) === 1);
  await ctx.close();
}

/* Turkish. */
{
  const ctx = await returning();
  const page = await ctx.newPage();
  await page.goto(BASE + "/tr", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const band = page.locator("#world");
  await band.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const text = await band.innerText();
  check("the Turkish chapter is Turkish", /Dünyas/i.test(text) && /Yed[iİ] ada/i.test(text));
  check("with no English left in it", !/districts|Enter the world/i.test(text));
  await page.getByRole("link", { name: /Dünyaya gir/i }).click();
  await page.waitForTimeout(2200);
  check("and it opens", (await page.locator(".world-overlay").count()) === 1);
  await ctx.close();
}

/* The mobile menu. */
{
  const ctx = await returning(devices["iPhone 13"]);
  const page = await ctx.newPage();
  await page.goto(BASE + "/en/labs", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /menu/i }).first().click();
  await page.waitForTimeout(900);
  check("the mobile menu carries it too", (await page.getByRole("link", { name: /World/ }).count()) >= 1);
  await page.screenshot({ path: path.join(OUT, "w-menu.png") });
  await page.getByRole("link", { name: /World/ }).first().click();
  await page.waitForTimeout(2600);
  check("and it opens from a phone", (await page.locator(".world-overlay").count()) === 1, page.url());
  await ctx.close();
}

/* A machine that cannot run it must not be invited. */
{
  const ctx = await returning();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function () {
      return null;
    };
  });
  await page.goto(BASE + "/en", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  check(
    "without WebGL no dead invitation is offered",
    (await page.getByRole("link", { name: /Enter the world/i }).count()) === 0,
  );
  check(
    "and the navigation drops it as well",
    (await page.getByRole("link", { name: "World", exact: true }).count()) === 0,
  );
  check(
    "but the chapter still explains what it is",
    /Archon World/i.test(await page.locator("#world").innerText()),
  );
  await ctx.close();
}

console.log(lines.join("\n"));
const failed = lines.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${lines.length - failed} passed, ${failed} failed`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
