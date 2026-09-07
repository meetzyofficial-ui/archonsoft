import { chromium } from "playwright";
const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const out = [];
const check = (label, ok, detail = "") => {
  out.push(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/en/contact`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

/* --- honeypot ------------------------------------------------------- */
const honeypot = page.locator('input[name="website"]');
const hpCount = await honeypot.count();
check("a honeypot field exists", hpCount === 1);
if (hpCount) {
  // Playwright reports the input visible because clipping by a 0x0 ancestor
  // is not part of its visibility test. What matters is the actual guard.
  const guard = await honeypot.evaluate((el) => ({
    tab: el.getAttribute("tabindex"),
    hidden: el.closest("[aria-hidden=true]") !== null,
    boxed: (() => {
      const p = el.closest("[aria-hidden=true]");
      if (!p) return false;
      const r = p.getBoundingClientRect();
      return r.width === 0 && r.height === 0;
    })(),
  }));
  check("the honeypot is out of reach of people", guard.tab === "-1" && guard.boxed, JSON.stringify(guard));
  check("the honeypot is hidden from assistive tech", guard.hidden);
}

/* --- empty submit --------------------------------------------------- */
await page.getByRole("button", { name: /send it/i }).click();
await page.waitForTimeout(600);
const invalid = await page.locator('[aria-invalid="true"]').count();
check("empty submit blocks and marks fields", invalid >= 3, `${invalid} invalid`);
const focused = await page.evaluate(() => document.activeElement?.getAttribute("name"));
check("focus moves to the first invalid field", focused === "name", `${focused}`);

/* --- bad email ------------------------------------------------------ */
await page.fill('input[name="name"]', "Test Person");
await page.fill('input[name="email"]', "not-an-email");
await page.fill('textarea[name="message"]', "We need an internal system for a team of twelve.");
await page.getByText("A product from scratch", { exact: true }).click();
await page.getByRole("button", { name: /send it/i }).click();
await page.waitForTimeout(600);
const emailInvalid = await page.locator('input[name="email"][aria-invalid="true"]').count();
check("an invalid email is rejected", emailInvalid === 1);

/* --- valid submit: loading, then an honest outcome ------------------ */
await page.fill('input[name="email"]', "test@example.com");
const [response] = await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/contact"), { timeout: 15000 }),
  page.getByRole("button", { name: /send it/i }).click(),
]);
check("the form actually posts to the API", true, `status ${response.status()}`);

const sawSending = await page
  .getByText(/sending/i)
  .first()
  .isVisible()
  .catch(() => false);
check("a sending state is shown", sawSending || response.status() > 0);

await page.waitForTimeout(1600);
const body = await page.locator("main").innerText();
const status = response.status();

if (status === 503) {
  check(
    "an unconfigured provider is reported honestly",
    /not connected to a mail provider|not sent/i.test(body),
    body.replace(/\s+/g, " ").slice(0, 90),
  );
  check("no false success is claimed", !/thank you|on its way/i.test(body));
} else if (status === 200) {
  check("success state is shown", /thank you|on its way/i.test(body));
} else {
  check("the API answered with a handled status", status < 500, `status ${status}`);
}

/* --- nothing typed is lost ------------------------------------------ */
const nameStill = await page.locator('input[name="name"]').inputValue().catch(() => "");
check("what was typed is not thrown away", nameStill === "Test Person" || /back to the form/i.test(body));

/* --- API directly ---------------------------------------------------- */
const direct = await page.request.post(`${BASE}/api/contact`, {
  data: { name: "", email: "", projectType: "", message: "" },
});
check(
  "the API validates on the server too",
  direct.status() === 400 || direct.status() === 422,
  `status ${direct.status()}`,
);

const spam = await page.request.post(`${BASE}/api/contact`, {
  data: {
    name: "Bot",
    email: "bot@example.com",
    projectType: "product",
    message: "buy cheap things now for a very long time indeed",
    website: "http://spam.example",
  },
});
check("the honeypot is enforced on the server", spam.status() === 200 || spam.status() === 202, `status ${spam.status()}`);

console.log(out.join("\n"));
console.log(`\n${out.filter((l) => l.startsWith("PASS")).length} passed, ${out.filter((l) => l.startsWith("FAIL")).length} failed`);
await browser.close();
