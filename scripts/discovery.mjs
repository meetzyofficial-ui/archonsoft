import { chromium, devices } from "playwright";
import path from "node:path";

const OUT = ".qa/site";
const BASE = "http://localhost:3210";
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
const lines = [];
const check = (label, ok, detail = "") =>
  lines.push(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);

const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem("archon-world-dismissed", "1");
  } catch {}
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));

await page.goto(BASE + "/en/work", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const rows = () => page.locator("article[data-provenance]").count();
/* Read from the page rather than written down here.
   The counts on the filter chips come from the same data the rows do, so
   asserting one against the other tests that the index agrees with itself —
   which is the thing worth testing, and does not go stale the next time a
   piece of work is added. */
const chipCount = async (label) => {
  const text = await page
    .getByRole("button", { name: new RegExp(`^${label}`, "i") })
    .first()
    .innerText();
  return Number(text.match(/(\d+)\s*$/)?.[1] ?? -1);
};
const total = await chipCount("All");
const shipped = await chipCount("Shipped");
check("the index lists everything built here", (await rows()) === total, `${await rows()} rows`);
check(
  "the count is announced",
  new RegExp(String(total)).test(
    await page.locator("[aria-live=polite]").first().innerText(),
  ),
  await page.locator("[aria-live=polite]").first().innerText(),
);

await page.getByRole("button", { name: /^Shipped/ }).click();
await page.waitForTimeout(400);
check(
  "filtering to shipped narrows the list",
  (await rows()) === shipped && shipped < total,
  `${await rows()} rows`,
);
check(
  "and only shipped work is left",
  (await page.locator('article[data-provenance="concept"]').count()) === 0,
);
await page.screenshot({ path: path.join(OUT, "f-shipped.png") });

await page.getByRole("button", { name: /^Commerce/ }).click();
await page.waitForTimeout(400);
check("the two axes combine", (await rows()) === 1, `${await rows()} rows`);
check("and it is the right one", /Erden/.test(await page.locator("article h2").first().innerText()));

await page.getByRole("button", { name: /^Archon Labs/ }).click();
await page.waitForTimeout(400);
const left = await rows();
check("a combination with nothing in it is handled", left === 2, `${left} rows`);

/* Ask for something no piece carries on both axes. */
await page.getByRole("button", { name: /^Shipped/ }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /^AI/ }).click();
await page.waitForTimeout(400);
check("an empty result says so", (await rows()) === 0, `${await rows()} rows`);
const empty = await page.locator("main").innerText();
check("with a way out of it", /Clear the filters/i.test(empty));
await page.screenshot({ path: path.join(OUT, "f-empty.png") });

await page.getByRole("button", { name: /Clear the filters/i }).click();
await page.waitForTimeout(400);
check("clearing brings everything back", (await rows()) === total, `${await rows()} rows`);

/* Keyboard: the filters are buttons and must behave like buttons. */
await page.keyboard.press("Tab");
await page.waitForTimeout(200);
const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
check("the filters are reachable by keyboard", focused.length > 0, focused.slice(0, 30));

/* Rows are links to real pages.
   Which project sits at the top of the index is an editorial decision that has
   changed; what the row has to do is open the page it names. */
const firstHref = await page.locator("article a").first().getAttribute("href");
await page.locator("article h2").first().click();
await page.waitForTimeout(1600);
check(
  "a row opens its case study",
  Boolean(firstHref) && page.url().endsWith(firstHref),
  `${page.url()} vs ${firstHref}`,
);

check("no page errors", errors.length === 0, errors[0] ?? "");
await ctx.close();

/* Turkish carries the same machinery. */
{
  const trCtx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await trCtx.addInitScript(() => {
    try {
      sessionStorage.setItem("archon-world-dismissed", "1");
    } catch {}
  });
  const tr = await trCtx.newPage();
  await tr.goto(BASE + "/tr/work", { waitUntil: "networkidle" });
  await tr.waitForTimeout(1000);
  const text = await tr.locator("main").innerText();
  /* Labels are uppercased in CSS, and Turkish uppercase turns i into İ, so
     the comparison has to be case-insensitive to mean anything. */
  check(
    "the Turkish index is Turkish",
    /yayında/i.test(text) && /g[öo]ster[iİ]len/i.test(text),
    text.replace(/\s+/g, " ").slice(0, 70),
  );
  check(
    "and nothing English leaked into it",
    !/Showing|Shipped\b|Clear the filters/.test(text),
    text.slice(0, 60).replace(/\n/g, " "),
  );
  await tr.getByRole("button", { name: /^Ticaret|^Commerce/ }).first().click();
  await tr.waitForTimeout(400);
  check(
    "and it filters",
    (await tr.locator("article[data-provenance]").count()) === 3,
    `${await tr.locator("article[data-provenance]").count()} rows`,
  );
  await trCtx.close();
}

/* Touch. */
{
  const mCtx = await browser.newContext({ ...devices["iPhone 13"] });
  await mCtx.addInitScript(() => {
    try {
      sessionStorage.setItem("archon-world-dismissed", "1");
    } catch {}
  });
  const m = await mCtx.newPage();
  await m.goto(BASE + "/en/work", { waitUntil: "networkidle" });
  await m.waitForTimeout(1000);
  const overflow = await m.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check("nothing overflows sideways on a phone", overflow <= 2, `${overflow}px`);
  await m.getByRole("button", { name: /^Shipped/ }).click();
  await m.waitForTimeout(400);
  check(
    "and the filters work on a phone",
    (await m.locator("article[data-provenance]").count()) === shipped,
  );
  await m.screenshot({ path: path.join(OUT, "f-mobile.png") });
  await mCtx.close();
}

console.log(lines.join("\n"));
const failed = lines.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${lines.length - failed} passed, ${failed} failed`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
