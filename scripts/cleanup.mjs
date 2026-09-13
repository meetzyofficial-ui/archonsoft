/**
 * The cleanup pass, checked: department signage from the data, what was
 * removed staying removed, the campus plan off the walkable decks, people
 * walking the way they face, readable signs on a phone in both
 * orientations, a black starry sky, natural trees with fruit, the voice
 * hooks, the lead route and the privacy pages.
 *
 *   node scripts/cleanup.mjs          (headed Chrome, real GPU; phones are emulated — not devices)
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";
import sharp from "sharp";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const OUT = ".qa/final2/cleanup";
fs.mkdirSync(OUT, { recursive: true });
let passed = 0;
let failed = 0;
const check = (name, ok, note = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
  if (ok) passed += 1;
  else failed += 1;
};
const upper = (text, locale) => text.toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US");
const args = (w, h) => ["--window-size=" + (w + 60) + "," + (h + 180), "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"];

async function open(viewport, mobile) {
  const browser = await chromium.launch({ headless: false, channel: "chrome", args: args(viewport.width, viewport.height) });
  const ctx = await browser.newContext(
    mobile
      ? { viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" }
      : { viewport },
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 200));
  });
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 5000);
  return { browser, page, errors };
}

/** Stand at an office's arrival, facing the room. */
async function standAt(page, office, back = 0) {
  const [ax, , az] = office.at;
  const [rx, , rz] = office.arrival;
  const len = Math.hypot(rx - ax, rz - az);
  const x = rx + ((rx - ax) / len) * back;
  const z = rz + ((rz - az) / len) * back;
  const deg = (Math.atan2(-(ax - rx), -(az - rz)) * 180) / Math.PI;
  await page.evaluate(([x, z, d]) => window.__archonPlace?.(x, z, d), [x, z, deg]);
  await page.evaluate(() => window.__archonTurn?.(0, 10));
}

/* ---------------------------------------------------------------- desktop */
{
  const { browser, page, errors } = await open({ width: 1440, height: 860 }, false);
  await page.waitForTimeout(2500);
  const plan = await page.evaluate(() => window.__archonPlan());

  /* 1, 2: signs and boards say the department, from the data. */
  const signage = await page.evaluate(() => {
    const out = {};
    window.__archonScene().traverse((o) => {
      const m = o.name.match(/^office:(.+)$/);
      if (!m) return;
      const sign = o.getObjectByName("office-sign");
      const board = o.getObjectByName("office-board");
      out[m[1]] = { sign: sign?.userData.text ?? null, title: board?.userData.title ?? null, items: board?.userData.items ?? [] };
    });
    return out;
  });
  for (const office of plan.offices) {
    const found = signage[office.id];
    if (!office.department) {
      check("lobby: a sign and a board listing the departments", Boolean(found?.sign) && found.items.length === plan.departments.length, JSON.stringify(found?.sign));
      continue;
    }
    const dept = plan.departments.find((d) => d.id === office.department);
    const services = dept.services.filter((s) => s.id !== "other").map((s) => s.name.tr);
    check(`${office.id}: the sign names the department`, found?.sign === upper(dept.name.tr, "tr"), `${found?.sign} / ${upper(dept.name.tr, "tr")}`);
    check(`${office.id}: the board behind the team names it and its services`, found?.title === dept.name.tr && JSON.stringify(found.items) === JSON.stringify(services), found?.title);
  }

  /* 3, 4, 6: what was removed is gone. */
  const audit = await page.evaluate(() => {
    const scene = window.__archonScene();
    const names = [];
    const tall = [];
    let erdenTori = 0;
    let stars = 0;
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (o.name) names.push(o.name);
      if (o.name === "cosmos:stars") stars = o.geometry.attributes.position.count;
    });
    const erden = scene.getObjectByName("station:erden");
    erden?.traverse((o) => {
      if (o.geometry?.type === "TorusGeometry" && o.geometry.parameters.radius > 3) erdenTori += 1;
    });
    /* Anything standing taller than thirty metres above the sea, except the
       sky, the sea and the comet. */
    scene.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      let skip = false;
      for (let up = o; up; up = up.parent) if (/^cosmos:|^ocean/.test(up.name ?? "")) skip = true;
      if (skip || o.geometry?.type === "SphereGeometry" && o.geometry.parameters.radius > 300) return;
      if (o.geometry?.parameters?.width > 800) return;
      o.geometry.computeBoundingBox?.();
      const b = o.geometry.boundingBox?.clone().applyMatrix4(o.matrixWorld);
      if (b && b.max.y - Math.max(b.min.y, -4) > 30) tall.push(`${o.name || o.parent?.name}:${(b.max.y - b.min.y).toFixed(0)}`);
    });
    return { names, tall: tall.slice(0, 10), erdenTori, stars };
  });
  check("the ring behind the logo is gone", !audit.names.includes("landmark-ring"));
  check("no spire skyline, no light towers, no sky shards or distant towers", !audit.names.some((n) => ["spires", "towers", "cosmos:spires", "cosmos:distantstructures", "cosmos:floaters", "cosmos:planet", "cosmos:halo"].includes(n)));
  check("nothing but the sky stands over thirty metres", audit.tall.length === 0, audit.tall.join(" "));
  check("Erden's screens have no rings behind them", audit.erdenTori === 0 && audit.names.includes("station:backdrop"), String(audit.erdenTori));

  /* 5: every campus building stands outside every walkable deck. */
  const inside = plan.campus.filter((b) => {
    const [w, d] = b.size;
    const turned = Math.abs(Math.sin(b.turn)) > 0.5;
    const hx = (turned ? d : w) / 2;
    const hz = (turned ? w : d) / 2;
    return plan.zones.some(({ bounds: [minX, minZ, maxX, maxZ] }) => b.at[0] + hx > minX && b.at[0] - hx < maxX && b.at[2] + hz > minZ && b.at[2] - hz < maxZ);
  });
  check("no glass building stands on a walkable deck", inside.length === 0, inside.map((b) => b.for).join(","));
  const tiers = await page.evaluate(() => {
    let count = 0;
    window.__archonScene().getObjectByName("facades")?.children.forEach((c) => {
      if (c.isInstancedMesh && c.geometry.type === "BoxGeometry" && c.material.type === "MeshStandardMaterial" && c.material.roughness === 0.6) count = c.count;
    });
    return count;
  });
  check("the campus is the plan: one building per department, a few in all", plan.campus.length <= 12 && tiers === plan.campus.reduce((n, b) => n + b.tiers.length, 0), `${plan.campus.length} buildings, ${tiers} masses drawn`);

  /* 10: the sky is black with stars. */
  await page.evaluate(() => window.__archonPlace?.(0, 20, 0));
  /* Negative pitch looks up. */
  await page.evaluate(() => window.__archonTurn?.(0, -31));
  await page.waitForTimeout(1500);
  const shot = await page.screenshot({ path: `${OUT}/sky.png` });
  /* Measured on the picture itself: the sky either side of the mark, below
     the interface's top line. */
  let r = 0, g = 0, b = 0, sat = 0, n = 0;
  for (const left of [0, 1020]) {
    const { data, info } = await sharp(shot).extract({ left, top: 90, width: 420, height: 180 }).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      r += data[i]; g += data[i + 1]; b += data[i + 2];
      sat += Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
      n += 1;
    }
  }
  const sky = { r: r / n, g: g / n, b: b / n, sat: sat / n };
  check("the sky is black: dark and colourless overhead", (sky.r + sky.g + sky.b) / 3 < 16 && sky.sat < 14, JSON.stringify(Object.fromEntries(Object.entries(sky).map(([k, v]) => [k, +v.toFixed(1)]))));
  check("and full of stars", audit.stars >= 3000, String(audit.stars));

  /* 11: natural trees, some fruit. */
  const trees = await page.evaluate(() => {
    const group = window.__archonScene().getObjectByName("trees");
    const colours = (mesh) => {
      const set = new Set();
      const a = mesh?.instanceColor?.array;
      if (!a) return 0;
      for (let i = 0; i < a.length; i += 3) set.add(`${a[i].toFixed(2)},${a[i + 1].toFixed(2)},${a[i + 2].toFixed(2)}`);
      return set.size;
    };
    return {
      leaves: colours(group?.getObjectByName("trees:leaves")),
      fruit: colours(group?.getObjectByName("trees:fruit")),
      blossom: group?.getObjectByName("trees:leaves")?.userData.blossoms ?? 0,
      flat: group?.getObjectByName("trees:leaves")?.material.flatShading ?? null,
      draws: group?.children.length ?? 0,
    };
  });
  check("trees: many greens, smooth foliage, blossom, fruit of three kinds, a handful of draws", trees.leaves >= 6 && trees.flat === false && trees.blossom >= 1 && trees.fruit >= 3 && trees.draws <= 8, JSON.stringify(trees));
  await page.evaluate(() => window.__archonPlace?.(27, 12, -100));
  await page.evaluate(() => window.__archonZoom?.(2.4, 2.4));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/trees.png` });
  await page.evaluate(() => window.__archonZoom?.(4.2, 2.2));

  /* 7: people walk the way they face. */
  await page.evaluate(() => window.__archonPlace?.(2, 0, 0));
  await page.evaluate(() => window.__archonNpcMotion?.(true));
  await page.waitForTimeout(16000);
  const motion = await page.evaluate(() => window.__archonNpcMotion?.());
  check("nobody walks backwards: travel and facing agree on every step", motion && motion.samples > 200 && motion.backwards === 0, JSON.stringify(motion));

  /* 12: the voice hooks. */
  const voice = await page.evaluate(() => window.__archonVoice?.());
  check("the voice provider is wired and splits speech into sentences", voice?.state.provider === "browser" && voice.sentences.length === 3, JSON.stringify(voice?.sentences));
  const toggle = page.locator(".world-overlay button", { hasText: /ANLATIM|Anlatım/i }).first();
  if (await toggle.count()) {
    await toggle.click();
    await page.waitForTimeout(300);
  }
  const enabled = await page.evaluate(() => window.__archonVoice?.().state.enabled);
  check("the narration switch still turns the voice on", enabled === true, `voices for tr: ${JSON.stringify(voice?.ranked.slice(0, 3))}`);

  check("no page errors on the desktop checks", errors.length === 0, errors.join(" | ").slice(0, 300));
  await browser.close();
}

/* ------------------------------------------------------------------ phones */
for (const [tag, viewport] of [["portrait", { width: 390, height: 844 }], ["landscape", { width: 844, height: 390 }]]) {
  const { browser, page, errors } = await open(viewport, true);
  const plan = await page.evaluate(() => window.__archonPlan());
  const small = [];
  for (const office of plan.offices) {
    await standAt(page, office, 0);
    await page.waitForTimeout(1300);
    const view = await page.evaluate((id) => window.__archonSignView?.(id), office.id);
    /* The capitals' height, as painted, on screen. */
    const cap = view ? view.height * view.cap : 0;
    if (!view || !view.shown || !view.inFront || cap < 12) small.push(`${office.id}:${cap.toFixed(0)}px`);
    if (office.id === "web" || office.id === "lobby" || office.id === "ai") await page.screenshot({ path: `${OUT}/${tag}-${office.id}.png` });
    console.log(`  ${tag} ${office.id}: sign ${view?.width.toFixed(0)}×${view?.height.toFixed(0)}px, letters ~${cap.toFixed(0)}px`);
  }
  check(`phone ${tag}: every department's name reads from its arrival (letters ≥ 12 CSS px)`, small.length === 0, small.join(" "));
  check(`phone ${tag}: no page errors`, errors.length === 0, errors.join(" | ").slice(0, 300));
  await browser.close();
}

/* --------------------------------------------------------- lead, privacy */
{
  const status = await (await fetch(`${BASE}/api/lead`)).json();
  check("the lead route still reports its channels", ["active", "inactive"].includes(status.store) && Array.isArray(status.missing), JSON.stringify({ store: status.store, email: status.email, whatsapp: status.whatsapp }));
  const bad = await fetch(`${BASE}/api/lead`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "", email: "x" }) });
  check("and still refuses an invalid brief", bad.status === 422, String(bad.status));
  for (const locale of ["tr", "en"]) {
    const res = await fetch(`${BASE}/${locale}/privacy`);
    check(`privacy /${locale}/privacy answers`, res.status === 200, String(res.status));
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
