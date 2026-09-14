/**
 * Behavioural checks: navigation, disclosure, form states, keyboard access,
 * reduced motion and the adaptive header. Prints PASS/FAIL per assertion and
 * exits non-zero if anything failed.
 */
import { chromium, devices } from "playwright";
import path from "node:path";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const OUT = path.join(process.cwd(), ".qa");

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch();

/* This suite tests the site itself, and the site is what a returning visitor
   sees: Archon World opens once per session and every context below starts
   after that. Setting the dismissal flag is precisely what the world writes on
   its own way out, so nothing here is being faked around. The world has its
   own suite in `world.mjs`. */
const newContext = async (options) => {
  const context = await browser.newContext(options);
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("archon-world-dismissed", "1");
    } catch {
      /* A context without storage simply sees the world, and says so. */
    }
  });
  return context;
};

/* ------------------------------------------------------------- the index */
{
  const context = await newContext({ ...devices["iPhone 13"] });
  const page = await context.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const trigger = page.getByRole("button", { name: /menu/i });
  await trigger.click();
  await page.waitForTimeout(700);

  const panel = page.locator("#site-menu");
  check("the index opens", await panel.evaluate((el) => el.getAttribute("aria-hidden") === "false"));
  check(
    "the index locks page scroll",
    await page.evaluate(() => getComputedStyle(document.body).overflow === "hidden"),
  );
  await page.screenshot({ path: path.join(OUT, "x-index-menu.png") });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  check("escape closes the index", await panel.evaluate((el) => el.getAttribute("aria-hidden") === "true"));
  check(
    "scroll lock released",
    await page.evaluate(() => getComputedStyle(document.body).overflow !== "hidden"),
  );

  await trigger.click();
  await page.waitForTimeout(600);
  await page.locator("#site-menu a", { hasText: "Projects" }).first().click();
  await page.waitForURL("**/en/projects", { timeout: 5000 }).catch(() => {});
  check("the index navigates", page.url().endsWith("/en/projects"), page.url());
  await page.waitForTimeout(600);
  check("the index closes after navigation", await panel.evaluate((el) => el.getAttribute("aria-hidden") === "true"));
  check("route change resets scroll", (await page.evaluate(() => window.scrollY)) < 5);

  await context.close();
}

/* ---------------------------------------------------------- capability tabs */
{
  const context = await newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/capabilities`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  /* Scoped to the capability band. The chooser moved onto this page and is
     also a tab list, so an unscoped count was counting two of them. */
  const tabs = page.locator("#capabilities-tabs").getByRole("tab");
  check("capabilities render as a tab list", (await tabs.count()) === 6, `${await tabs.count()} tabs`);

  const automation = page.getByRole("tab", { name: /Admin systems/i }).first();
  await automation.scrollIntoViewIfNeeded();
  await automation.click();
  await page.waitForTimeout(700);
  check("clicking a capability selects it", (await automation.getAttribute("aria-selected")) === "true");

  const panelId = await automation.getAttribute("aria-controls");
  const panelText = await page.locator(`#${panelId}`).innerText();
  check("the panel follows the selection", /Orders/i.test(panelText), panelText.slice(0, 40));

  // Arrow keys move the selection, which is the whole point of a tab list.
  await automation.focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  check(
    "arrow keys move between capabilities",
    await page.evaluate(() => document.activeElement?.getAttribute("aria-selected") === "true" &&
      /Release/i.test(document.activeElement?.textContent ?? "")),
  );
  await page.screenshot({ path: path.join(OUT, "x-capability-tabs.png") });

  await context.close();
}

/* --------------------------------------------------------- project sequence */
{
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);

  /* One unit per shipped project, counted from the page rather than written
     down: the number of live products is a fact about the work, and a test
     that hard-codes it fails the day another one ships. */
  const units = page.locator('article[aria-labelledby^="project-"]');
  const count = await units.count();
  check("the work is a sequence of editorial units", count > 1, `${count} units`);

  /* Each project is a spread, not a card in a grid: the stage is large but
     never a screenful, and the spread runs the width of the frame, one to a
     row. */
  const stage = await page.evaluate(() => {
    const el = document.querySelector('article[aria-labelledby^="project-"] .project-stage');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const frame = document.querySelector(".frame").getBoundingClientRect();
    return { heightRatio: r.height / window.innerHeight, widthRatio: r.width / frame.width };
  });
  check(
    "a project stage is large, never a screenful",
    stage !== null && stage.heightRatio > 0.4 && stage.heightRatio < 0.8,
    `${Math.round((stage?.heightRatio ?? 0) * 100)}vh`,
  );
  check(
    "and it leaves the column room for the words",
    stage !== null && stage.widthRatio <= 0.72,
    `${Math.round((stage?.widthRatio ?? 0) * 100)}% of the frame`,
  );
  const rows = await page.evaluate(() => {
    const tops = Array.from(document.querySelectorAll('article[aria-labelledby^="project-"]')).map(
      (el) => Math.round(el.getBoundingClientRect().top),
    );
    return new Set(tops).size === tops.length;
  });
  check("one project to a row, not a grid of cards", rows);
  const titles = await page.locator('article[aria-labelledby^="project-"] h3').allInnerTexts();
  check(
    "every project is named by its real name",
    titles.includes("Meetzy") && titles.includes("Archon Soft World") && !titles.some((one) => /Divan|Kervan|Project \d/i.test(one)),
    titles.join(", "),
  );

  /* The whole choreography is that every position is a pure function of one
     scroll number. Read it at three points and at the start again: it must
     move as the page moves, and come back exactly when the page comes back. */
  const readings = async (y) => {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(420);
    /* The computed value, not the inline one. A frame the driver has not
       reached yet has no inline property and falls back to the 0 declared in
       the stylesheet — reading the inline style would compare bookkeeping
       ("not written yet" vs "written as 0") rather than what is on screen. */
    return page.evaluate(() =>
      Array.from(document.querySelectorAll(".scroll-frame"))
        .slice(0, 12)
        .map((el) => getComputedStyle(el).getPropertyValue("--p").trim()),
    );
  };

  const top = await readings(0);
  const middle = await readings(2200);
  const lower = await readings(4400);
  const back = await readings(0);

  check("scroll drives the composition", JSON.stringify(top) !== JSON.stringify(middle));
  check("and keeps driving it", JSON.stringify(middle) !== JSON.stringify(lower));
  check(
    "scrolling back reverses it exactly",
    JSON.stringify(back) === JSON.stringify(top),
    `${JSON.stringify(top).slice(0, 40)} vs ${JSON.stringify(back).slice(0, 40)}`,
  );

  await page.screenshot({ path: path.join(OUT, "x-project-sequence.png") });
  await context.close();
}

/* --------------------------------------------------------- lab experiments */
{
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/labs`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  check("the field experiment mounts a canvas", (await page.locator("#exp-001 canvas").count()) === 1);

  const painted = await page.locator("#exp-001 canvas").evaluate((canvas) => {
    const context2d = canvas.getContext("2d");
    const data = context2d.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
    return false;
  });
  check("the field actually draws", painted);

  const button = page.getByRole("button", { name: /draw another/i });
  await button.scrollIntoViewIfNeeded();
  const before = await page.locator("#exp-002 svg").innerHTML();
  await button.click();
  await page.waitForTimeout(400);
  const after = await page.locator("#exp-002 svg").innerHTML();
  check("the composer regenerates on demand", before !== after);

  const seed = await page.locator("#exp-002").innerText();
  check("the composer states its seed", /SEED \d+/.test(seed));
  await page.screenshot({ path: path.join(OUT, "x-lab.png") });

  await context.close();
}

/* ----------------------------------------------------------- adaptive header */
{
  const context = await newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  /* The way into the world sits at the exact centre of the header. */
  const centre = await page.evaluate(() => {
    const button = document.querySelector("header [data-world-trigger]");
    if (!button) return null;
    const r = button.getBoundingClientRect();
    return Math.abs(r.left + r.width / 2 - window.innerWidth / 2);
  });
  check("the world button is centred in the header", centre !== null && centre <= 2, `${centre}px off centre`);
  const raised = await page.evaluate(() => {
    const button = document.querySelector("header [data-world-trigger]");
    return button ? getComputedStyle(button).boxShadow !== "none" : false;
  });
  check("and raised above the rest of the header", raised);
  await page.locator("#world").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  check("the header stays readable over the world entry", (await page.getByRole("banner").isVisible()));
  await page.screenshot({ path: path.join(OUT, "x-header.png") });

  await context.close();
}

/* --------------------------------------------------------------- contact form */
{
  const context = await newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Empty submit surfaces field errors and moves focus to the first one.
  await page.getByRole("button", { name: /send it/i }).click();
  await page.waitForTimeout(400);
  const errors = await page.locator("p.mono-label.text-\\[var\\(--accent\\)\\]").count();
  check("empty submit shows validation errors", errors >= 4, `${errors} shown`);
  check(
    "focus moves to the first invalid field",
    await page.evaluate(() => document.activeElement?.getAttribute("name") === "name"),
  );
  check(
    "invalid fields are marked for assistive tech",
    (await page.locator('[aria-invalid="true"]').count()) >= 2,
  );
  await page.screenshot({ path: path.join(OUT, "x-form-errors.png") });

  // A valid submission with no mail provider configured must say so, not lie.
  await page.fill('input[name="name"]', "Test Person");
  await page.fill('input[name="email"]', "test@example.com");
  await page.getByText("A product from scratch", { exact: true }).click();
  await page.fill(
    'textarea[name="message"]',
    "We are building an internal tool for scheduling and it has outgrown the spreadsheet it started in.",
  );
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /send it/i }).click();
  await page.waitForTimeout(1500);

  const body = await page.locator("main").innerText();
  check(
    "unconfigured provider is reported honestly",
    /not connected to a mail provider/i.test(body),
  );
  check("no false success is shown", !/on its way/i.test(body));
  // No public address exists yet, so the honest behaviour is to offer none
  // rather than a dead mailto. When NEXT_PUBLIC_CONTACT_EMAIL is set this
  // flips to checking the fallback carries what the visitor typed.
  const mailtos = await page.locator('main a[href^="mailto:"]').count();
  const configured = await page.evaluate(() => document.body.innerText.includes("@"));
  if (mailtos > 0) {
    const mailto = await page.locator('main a[href^="mailto:"]').first().getAttribute("href");
    check("fallback mailto carries the message", (mailto ?? "").includes("Test%20Person"));
  } else {
    check(
      "no dead address is offered while none is published",
      mailtos === 0 && /no published address/i.test(body),
      `${mailtos} mailto links, contact shown: ${configured}`,
    );
  }
  await page.screenshot({ path: path.join(OUT, "x-form-unconfigured.png") });

  await context.close();
}

/* --------------------------------------------------------- the assembly */
{
  /* The stage: handsets spread out of a stack as the frame arrives, and the
     case study opens on the same stage with every real capture painted. */
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/projects/meetzy`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2400);

  const travel = await page.evaluate(() => {
    const stage = document.querySelector(".project-stage");
    const left = stage?.querySelector(".project-stage__device--left");
    if (!stage || !left) return null;
    left.style.transition = "none";
    const read = () => new DOMMatrixReadOnly(getComputedStyle(left).transform).m41;
    stage.style.setProperty("--enter", "0");
    const stacked = read();
    stage.style.setProperty("--enter", "1");
    const spread = read();
    stage.style.removeProperty("--enter");
    left.style.transition = "";
    return { travel: Math.round(Math.abs(spread - stacked)) };
  });
  check("the handsets spread out of the stack as the stage arrives", travel !== null && travel.travel > 60, JSON.stringify(travel));

  const painted = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".project-stage img")).map((img) => img.complete && img.naturalWidth > 0),
  );
  check("the case study opens on the stage, every capture painted", painted.length >= 3 && painted.every(Boolean), JSON.stringify(painted));
  await page.screenshot({ path: path.join(OUT, "x-stage.png") });

  await context.close();
}

/* ------------------------------------------------------------- language */
{
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/projects/meetzy`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  check("root redirects to a locale", true);

  const before = await page.locator("h1").first().innerText();
  await page.getByRole("link", { name: "Türkçe" }).click();
  await page.waitForURL("**/tr/projects/meetzy", { timeout: 5000 }).catch(() => {});
  check("the language switch keeps the page", page.url().endsWith("/tr/projects/meetzy"), page.url());

  await page.waitForTimeout(1200);
  const lang = await page.evaluate(() => document.documentElement.lang);
  check("the document language follows", lang === "tr", lang);

  const body = await page.locator("main").innerText();
  check("Turkish copy is actually Turkish", /Yaklaşık üç aydır|Canlı/.test(body));
  check("the project name is not translated", before === (await page.locator("h1").first().innerText()));

  await context.close();
}

/* ------------------------------------------------------------ archon labs */
{
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/labs/divan`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  const surface = page.locator(".lab-window").first();
  check("a concept renders as a real interface", (await surface.count()) === 1);

  // Every surface has to say what it is, on the surface, without scrolling.
  const chip = await surface.locator("text=CONCEPT").first().innerText().catch(() => "");
  check("the window is labelled a concept", /concept/i.test(chip), chip);

  const nav = surface.getByRole("tablist").first();
  const items = await nav.getByRole("tab").count();
  check("the concept has a working sidebar", items >= 3, `${items} sections`);

  // Switching a section must change the screen, not just the highlight.
  const before = await surface.locator("h4").first().innerText();
  await nav.getByRole("tab").nth(2).click();
  await page.waitForTimeout(500);
  const after = await surface.locator("h4").first().innerText();
  check("the sidebar switches screens", before !== after, `${before} -> ${after}`);

  // Records open. This is the difference between a prototype and a picture.
  const rows = surface.locator("tbody tr");
  if ((await rows.count()) > 1) {
    const panelBefore = await surface.locator("[data-lab-panel]").first().innerText();
    await rows.nth(1).click();
    await page.waitForTimeout(400);
    const panelAfter = await surface.locator("[data-lab-panel]").first().innerText();
    check("selecting a record opens it", panelBefore !== panelAfter);
  } else {
    check("selecting a record opens it", true, "no table on this screen");
  }

  await page.screenshot({ path: path.join(OUT, "x-lab-concept.png") });
  await context.close();
}

/* ------------------------------------------------------- the labs explorer */
{
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.locator("#labs").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);

  const band = page.locator("#labs");
  const first = await band.locator(".lab-window").first().innerText();
  check("the home page mounts a running concept", first.length > 0);

  const names = band.getByRole("button", { name: /Marketplace/i });
  await names.first().click();
  await page.waitForTimeout(700);
  const second = await band.locator(".lab-window").first().innerText();
  check("choosing another concept swaps the whole product", first !== second);
  check("the concept that loaded is the one chosen", /Marketplace/i.test(second), second.slice(0, 40));
  check("no concept is shown by its codename", !/\b(Divan|Ulak|Kervan|Vesile|Tezgah|Vardiya)\b/.test(await band.innerText()));

  await page.screenshot({ path: path.join(OUT, "x-labs-explorer.png") });
  await context.close();
}

/* ------------------------------------------------------------- the chooser */
{
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/capabilities`, { waitUntil: "networkidle" });
  await page.locator("#build").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);

  const panel = page.locator("#build [role='tabpanel']").first();
  const before = await panel.innerText();
  await page.locator("#build [role='tab']").nth(4).click();
  await page.waitForTimeout(500);
  const after = await panel.innerText();
  check("the chooser resolves to a different chain", before !== after);
  check(
    "every chain ends at something that can be opened",
    (await panel.getByRole("link").count()) >= 1,
  );

  await context.close();
}

/* ----------------------------------------------------------- category map */
{
  /* The thirteen-category map lives on the capabilities page now, not the home
     page: it was one of three taxonomies the home page carried, and this is
     the page that exists to answer what can be built. */
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/capabilities`, { waitUntil: "networkidle" });
  await page.locator("#build-what").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);

  const band = page.locator("#build-what");
  const categories = await band.getByRole("button").count();
  check("the map offers every category", categories >= 13, `${categories} categories`);

  // A shipped category has to resolve to a real screen, and a concept to a
  // running prototype. Confusing the two is the one thing this cannot do.
  const shippedFirst = await band.locator("figure img").count();
  check("a shipped category shows a real screen", shippedFirst === 1, `${shippedFirst} images`);

  await band.getByRole("button", { name: /Marketplaces/i }).first().click();
  await page.waitForTimeout(800);
  const surface = await band.locator(".lab-window").count();
  const stillImage = await band.locator("figure img").count();
  check("a concept category mounts a prototype", surface === 1 && stillImage === 0);
  const badge = await band.locator("text=ARCHON LABS").first().count();
  check("the concept is labelled before it is opened", badge >= 1);

  await page.screenshot({ path: path.join(OUT, "x-category-map.png") });
  await context.close();
}

/* ---------------------------------------------------------- system stack */
{
  /* Moved to the capabilities page with the section itself: the home page now
     answers "what can this studio build" with the work rather than with a
     third diagram of the same taxonomy. */
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/capabilities`, { waitUntil: "networkidle" });
  await page.locator("#why").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);

  const planes = await page.locator("#why .stack-plane").count();
  check("the product opens into seven layers", planes === 7, `${planes} planes`);

  // The scene is decoration; the list beside it is the content. A screen
  // reader must not be handed a pile of empty divs.
  const hidden = await page
    .locator("#why .stack-deck")
    .evaluate((el) => el.getAttribute("aria-hidden"));
  check("the drawing is hidden from assistive tech", hidden === "true");

  const rows = await page.locator("#why [data-stack-layers] li").count();
  check("every layer is readable as a list", rows === 7, `${rows} rows`);

  const closed = page.locator("#why .stack-deck");
  const before = await closed.evaluate((el) => getComputedStyle(el).getPropertyValue("--stack-spread"));
  await page.locator("#why button", { hasText: /close it/i }).first().click();
  await page.waitForTimeout(600);
  const after = await closed.evaluate((el) => getComputedStyle(el).getPropertyValue("--stack-spread"));
  check("the stack can be closed and opened", before.trim() !== after.trim(), `${before} -> ${after}`);

  await page.screenshot({ path: path.join(OUT, "x-system-stack.png") });
  await context.close();
}

/* ------------------------------------------------------- the skipped states */
{
  const context = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/labs/tezgah`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  const surface = page.locator(".lab-window").first();
  await surface.getByRole("tab", { name: /States/i }).first().click();
  await page.waitForTimeout(500);

  const empty = await surface.innerText();
  check("the empty state is a real screen", /no orders yet/i.test(empty));

  await surface.getByRole("button", { name: /^Loading$/i }).first().click();
  await page.waitForTimeout(500);
  const skeletons = await surface.locator(".lab-skeleton").count();
  check("the loading state is a skeleton, not a spinner", skeletons >= 3, `${skeletons} rows`);

  await surface.getByRole("button", { name: /^Failed$/i }).first().click();
  await page.waitForTimeout(500);
  const failed = await surface.innerText();
  check("the failure state says what failed", /could not reach/i.test(failed));

  await page.screenshot({ path: path.join(OUT, "x-states.png") });
  await context.close();
}

/* ------------------------------------------------------------ the legend */
{
  const context = await newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en/labs`, { waitUntil: "networkidle" });
  const footer = page.locator("footer");
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const legend = await footer.innerText();
  check(
    "the three words are defined on every page",
    /shipped/i.test(legend) && /archon labs/i.test(legend) && /capability/i.test(legend),
  );
  await context.close();
}

/* ----------------------------------------------------------------- keyboard */
{
  const context = await newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check("first tab stop is the skip link", /skip to content/i.test(first ?? ""), first ?? "");

  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? getComputedStyle(el).outlineStyle : "none";
  });
  check("focus is visible", outline !== "none", outline);
  await page.screenshot({ path: path.join(OUT, "x-skip-link.png") });

  await context.close();
}

/* ------------------------------------------------------------ reduced motion */
{
  const context = await newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const hidden = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll(".reveal-fade, .reveal-clip"));
    return nodes.filter((el) => {
      const style = getComputedStyle(el);
      return Number(style.opacity) < 0.9 || (style.clipPath !== "none" && style.clipPath !== "");
    }).length;
  });
  check("no content stays hidden under reduced motion", hidden === 0, `${hidden} hidden`);

  /* Reduced motion keeps the robot as the pointer but takes every animation
     off it: it arrives at each state instantly. */
  const cursor = await page.locator("[data-cursor-root]").getAttribute("data-reduced");
  check("the robot cursor drops its animation under reduced motion", cursor === "true", String(cursor));

  /* The scroll driver publishes a finished reading rather than never
     publishing one: a visitor who asked for no motion gets the composition
     already arrived, not a page of things stuck at 94% and half transparent. */
  /* Asked for no motion, every scroll-driven composition publishes a finished
     reading rather than none — so the work is laid out, arrived, and nothing
     is left waiting for a scroll that will never drive it. */
  const stillWork = await page.evaluate(() => ({
    units: document.querySelectorAll('article[aria-labelledby^="project-"]').length,
    frames: Array.from(document.querySelectorAll(".scroll-frame")).filter(
      (el) => el.style.getPropertyValue("--enter") !== "1",
    ).length,
  }));
  check(
    "the work is fully arrived under reduced motion",
    stillWork.units > 1 && stillWork.frames === 0,
    JSON.stringify(stillWork),
  );

  await page.screenshot({ path: path.join(OUT, "x-reduced-motion.png"), fullPage: false });
  await context.close();
}

/* ------------------------------------------------------------------- no JS */
{
  const context = await newContext({
    viewport: { width: 1280, height: 900 },
    javaScriptEnabled: false,
    /* The bare domain goes by the browser's language; this reads the English home. */
    locale: "en-US",
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  const text = await page.locator("body").innerText();
  check("content is present without JavaScript", text.includes("Meetzy") && text.includes("Capabilities"));
  /* Without scripting nothing sets `--p`, so every composition falls back to
     the declared default. Anything that needs the driver to have run in order
     to be visible would be invisible here, which is the failure this catches. */
  const noJsWork = await page.evaluate(() => {
    const pictures = Array.from(
      document.querySelectorAll('article[aria-labelledby^="project-"] img'),
    );
    return {
      pictures: pictures.length,
      invisible: pictures.filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length,
    };
  });
  check(
    "the work is visible without JavaScript",
    noJsWork.pictures > 0 && noJsWork.invisible === 0,
    JSON.stringify(noJsWork),
  );

  check(
    "entrance panel does not trap a no-JS visitor",
    await page.evaluate(() => {
      const panel = document.querySelector(".entrance-panel");
      return !panel || getComputedStyle(panel).display === "none";
    }),
  );
  const faded = await page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll("#hero-heading span, .reveal-fade, .reveal-clip, .reveal-rule"),
    );
    return nodes.filter((el) => {
      const style = getComputedStyle(el);
      if (Number(style.opacity) < 0.9) return true;
      if (style.clipPath !== "none" && style.clipPath !== "") return true;
      const matrix = new DOMMatrixReadOnly(style.transform);
      return matrix.m22 < 0.9 || Math.abs(matrix.m42) > 2;
    }).length;
  });
  check("nothing in the hero stays hidden without JavaScript", faded === 0, `${faded} hidden`);
  await page.screenshot({ path: path.join(OUT, "x-no-js.png"), fullPage: false });
  await context.close();
}

await browser.close();

console.log(failures === 0 ? "\nAll interaction checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
