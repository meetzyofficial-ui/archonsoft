import { chromium, devices } from "playwright";
import path from "node:path";

const OUT = ".qa/site";
const BASE = "http://localhost:3210";
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
const lines = [];
const check = (label, ok, detail = "") =>
  lines.push(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);

const make = async (options = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, ...options });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem("archon-world-dismissed", "1");
    } catch {}
  });
  return ctx;
};

/* The cursor is meant to say what a thing does. */
{
  const ctx = await make();
  const page = await ctx.newPage();
  await page.goto(BASE + "/en/work", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  check("the custom cursor is mounted", (await page.locator("[data-cursor-root]").count()) === 1);

  await page.locator("article h2").first().hover();
  await page.waitForTimeout(500);
  const label = await page.locator("[data-cursor-root]").innerText();
  check("and it names what a row will do", /case study/i.test(label), label.replace(/\s+/g, " "));

  await page.locator("article").nth(3).locator("h2").hover();
  await page.waitForTimeout(500);
  const conceptLabel = await page.locator("[data-cursor-root]").innerText();
  check("a concept row says so instead", /concept/i.test(conceptLabel), conceptLabel.replace(/\s+/g, " "));
  await page.screenshot({ path: path.join(OUT, "p-cursor.png") });
  await ctx.close();
}

/* The 404 is branded, in both languages, and gets out of the way. */
{
  const ctx = await make();
  const page = await ctx.newPage();
  const res = await page.goto(BASE + "/en/no-such-thing", { waitUntil: "networkidle" });
  check("a missing page is a real 404", res?.status() === 404, String(res?.status()));
  const text = await page.locator("main").innerText();
  check("with Archon's own words on it", /Archon|not here|404/i.test(text), text.replace(/\s+/g, " ").slice(0, 60));
  check("and a way back", (await page.getByRole("link").count()) > 2);
  await page.screenshot({ path: path.join(OUT, "p-404.png") });

  const tr = await page.goto(BASE + "/tr/hicbir-sey", { waitUntil: "networkidle" });
  check("the Turkish 404 is Turkish", tr?.status() === 404);
  check(
    "with no English left on it",
    !/Page not found|Back to/i.test(await page.locator("main").innerText()),
  );
  await ctx.close();
}

/* A case study ends somewhere rather than stopping. */
{
  const ctx = await make();
  const page = await ctx.newPage();
  await page.goto(BASE + "/en/work/meetzy", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const h1 = await page.locator("h1").first().innerText();
  check("the case study names the product", /Meetzy/.test(h1), h1);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1400);
  const tail = await page.locator("main").innerText();
  /* Which project comes next is an editorial decision that has changed once
     already; what matters is that the page hands the reader on to a different
     one rather than to itself. */
  check(
    "and leads on to the next one",
    /Erden|DP Pano/i.test(tail) && !/next[\s\S]{0,80}Meetzy/i.test(tail),
  );
  await page.screenshot({ path: path.join(OUT, "p-case-tail.png") });
  await ctx.close();
}

/* Contact reports what actually happened. */
{
  const ctx = await make();
  const page = await ctx.newPage();
  await page.goto(BASE + "/en/contact", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  check("the form is there", (await page.locator("form").count()) >= 1);
  await page.getByRole("button", { name: /send|submit/i }).first().click();
  await page.waitForTimeout(700);
  const invalid = await page.locator("[aria-invalid=true]").count();
  check("an empty submission is refused in the browser", invalid > 0, `${invalid} invalid`);
  await ctx.close();
}

/* The narrow end of the range, on the pages that changed. */
{
  const ctx = await make(devices["iPhone SE"]);
  const page = await ctx.newPage();
  for (const route of ["/en", "/en/work", "/tr/work"]) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(`375px ${route} does not overflow`, overflow <= 2, `${overflow}px`);
  }
  await page.goto(BASE + "/en/work", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, "p-375-work.png") });
  await ctx.close();
}

console.log(lines.join("\n"));
const failed = lines.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${lines.length - failed} passed, ${failed} failed`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
