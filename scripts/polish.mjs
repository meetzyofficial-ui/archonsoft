/**
 * The final polish pass, checked — the assertions beyond `cleanup.mjs`:
 * locomotion measured for every moving figure (backwards, sideways, turn
 * rate), the removed landmarks staying removed, the logo's surroundings
 * clear, the sky black, signs and boards from the department data, trees
 * that vary and carry apples, oranges and lemons, readable phone signs, the
 * voice initialising safely and never speaking a line twice, no building on
 * a walkable deck, office staff seated at their desks, and the first seconds
 * after entering the world free of long frames.
 *
 *   node scripts/polish.mjs        (headed Chrome, real GPU; phones are emulated — not devices)
 */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";
import sharp from "sharp";

const BASE = process.env.ARCHON_BASE ?? "http://localhost:3210";
const OUT = ".qa/final3/polish";
fs.mkdirSync(OUT, { recursive: true });
let passed = 0;
let failed = 0;
const check = (name, ok, note = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
  if (ok) passed += 1;
  else failed += 1;
};
const upper = (text) => text.toLocaleUpperCase("tr-TR");
const launch = (w, h) =>
  chromium.launch({ headless: false, channel: "chrome", args: [`--window-size=${w + 60},${h + 180}`, "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"] });

/* ---------------------------------------------------------------- desktop */
{
  const browser = await launch(1440, 860);
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  await page.bringToFront();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 200));
  });
  /* Frame times from before the page's first script. */
  await page.addInitScript(() => {
    window.__gaps = [];
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      window.__gaps.push([now, now - last]);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 0);
  const entered = await page.evaluate(() => performance.now());
  await page.waitForTimeout(3200);
  const firstThree = await page.evaluate((from) => window.__gaps.filter(([t]) => t > from && t < from + 3000).map(([, g]) => g), entered);
  const sorted = [...firstThree].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const worst = sorted[sorted.length - 1];
  check("entering the world: the first three seconds have no long frame (desktop, unthrottled)", worst < 100 && p95 < 25, `p95 ${p95?.toFixed(1)}ms, worst ${worst?.toFixed(1)}ms over ${firstThree.length} frames`);

  const plan = await page.evaluate(() => window.__archonPlan());

  /* 1: nobody walks backwards, sideways, or snaps round. */
  await page.evaluate(() => window.__archonPlace?.(2, 0, 0));
  await page.evaluate(() => window.__archonNpcMotion?.(true));
  await page.waitForTimeout(9000);
  /* The lobby team and a guide group: turn to the visitor as they arrive. */
  await page.evaluate(() => window.__archonPlace?.(-6, 13, 90));
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.__archonPlace?.(-2, 16, -60));
  await page.waitForTimeout(5000);
  const motion = await page.evaluate(() => window.__archonNpcMotion?.());
  check("no backward locomotion, for every figure that moves", motion.samples > 150 && motion.backwards === 0, JSON.stringify(motion));
  check("no sideways crabbing on the way to a target", motion.sideways === 0, `sideways ${motion.sideways} of ${motion.samples}`);
  check("no snap turns: every turn is bounded", motion.maxTurn < 7, `fastest turn ${motion.maxTurn.toFixed(2)} rad/s`);

  /* 2, 3, 4, 14: removed things stay removed; the logo stands alone. */
  const scene = await page.evaluate(() => {
    const s = window.__archonScene();
    s.updateMatrixWorld(true);
    const names = [];
    const nearLogo = [];
    let erdenTori = 0;
    let tall = 0;
    s.traverse((o) => {
      if (o.name) names.push(o.name);
    });
    s.getObjectByName("station:erden")?.traverse((o) => {
      if (o.geometry?.type === "TorusGeometry") erdenTori += 1;
    });
    s.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry) return;
      let skip = false;
      for (let up = o; up; up = up.parent) if (/^cosmos:|^gate$/.test(up.name ?? "")) skip = true;
      if (skip || (o.geometry.parameters?.width ?? 0) > 800 || (o.geometry.parameters?.radius ?? 0) > 300) return;
      o.geometry.computeBoundingBox();
      const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (b.max.y - Math.max(b.min.y, -4) > 30) tall += 1;
      /* Round the mark — across the plaza's width, from the far bridge to the
         arrival — nothing standing taller than twelve metres of its own
         height (a merged set spanning the whole campus is not one object). */
      const span = Math.max(b.max.x - b.min.x, b.max.z - b.min.z);
      if (span < 60 && b.max.y - Math.max(b.min.y, 0) > 12 && b.max.x > -24 && b.min.x < 24 && b.max.z > -30 && b.min.z < 6) {
        let owner = o;
        while (owner && !owner.name) owner = owner.parent;
        nearLogo.push(`${owner?.name ?? "?"}@${b.max.y.toFixed(0)}m`);
      }
      if (o.geometry.type === "TorusGeometry" && o.geometry.parameters.radius > 8) nearLogo.push(`ring r${o.geometry.parameters.radius}`);
    });
    return { names, nearLogo, erdenTori, tall };
  });
  check("no landmark-ring", !scene.names.includes("landmark-ring"));
  check("no unnecessary towers: no spires, pylons or anything over thirty metres", !scene.names.some((n) => ["spires", "towers", "cosmos:spires", "cosmos:distantstructures"].includes(n)) && scene.tall === 0, `${scene.tall} tall meshes`);
  check("no tilted rings behind Erden's screens", scene.erdenTori === 0);
  check("the logo area is clean: nothing else stands high round the mark, no ring anywhere near", scene.nearLogo.length === 0, scene.nearLogo.slice(0, 6).join(" "));
  check("no planet, halo, floating islands or sky shards", !scene.names.some((n) => ["cosmos:planet", "cosmos:halo", "cosmos:floaters", "cosmos:spires"].includes(n)));

  /* 5: the sky, measured on the picture, either side of the mark. */
  await page.evaluate(() => window.__archonPlace?.(0, 20, 0));
  await page.evaluate(() => window.__archonTurn?.(0, -31));
  await page.waitForTimeout(1400);
  const shot = await page.screenshot({ path: `${OUT}/sky.png` });
  let r = 0, g = 0, b = 0, sat = 0, n = 0, bright = 0;
  for (const left of [0, 1020]) {
    const { data, info } = await sharp(shot).extract({ left, top: 90, width: 420, height: 180 }).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      r += data[i]; g += data[i + 1]; b += data[i + 2];
      sat += Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
      if (data[i] + data[i + 1] + data[i + 2] > 300) bright += 1;
      n += 1;
    }
  }
  check("space is black with a starfield: dark, colourless, with points of light", (r + g + b) / n / 3 < 12 && sat / n < 10 && bright > 20, `mean ${((r + g + b) / n / 3).toFixed(1)}, saturation ${(sat / n).toFixed(1)}, bright points ${bright}`);

  /* 6, 7: signs and boards come from departments.ts. */
  const signage = await page.evaluate(() => {
    const out = {};
    window.__archonScene().traverse((o) => {
      const m = o.name.match(/^office:(.+)$/);
      if (!m) return;
      out[m[1]] = { sign: o.getObjectByName("office-sign")?.userData.text, title: o.getObjectByName("office-board")?.userData.title, items: o.getObjectByName("office-board")?.userData.items };
    });
    return out;
  });
  const wrongSigns = plan.offices.filter((o) => o.department).filter((o) => signage[o.id]?.sign !== upper(plan.departments.find((d) => d.id === o.department).name.tr));
  check("department signs use departments.ts, Turkish capitals intact", wrongSigns.length === 0 && Object.values(signage).some((s) => /[İŞĞÇÖÜ]/.test(s.sign ?? "")), wrongSigns.map((o) => o.id).join(","));
  const wrongBoards = plan.offices.filter((o) => o.department).filter((o) => {
    const d = plan.departments.find((x) => x.id === o.department);
    return signage[o.id]?.title !== d.name.tr || JSON.stringify(signage[o.id]?.items) !== JSON.stringify(d.services.filter((s) => s.id !== "other").map((s) => s.name.tr));
  });
  check("employee panels use the same source: name and services", wrongBoards.length === 0, wrongBoards.map((o) => o.id).join(","));

  /* 8, 9: trees vary; fruit is apples, oranges and lemons. */
  const trees = await page.evaluate(() => {
    const leaves = window.__archonScene().getObjectByName("trees:leaves");
    const d = leaves?.userData ?? {};
    const spread = (a) => (a?.length ? Math.max(...a) - Math.min(...a) : 0);
    const colours = new Set();
    const c = leaves?.instanceColor?.array ?? [];
    for (let i = 0; i < c.length; i += 3) colours.add(`${c[i].toFixed(2)},${c[i + 1].toFixed(2)},${c[i + 2].toFixed(2)}`);
    return {
      heightRange: spread(d.heights),
      girthRange: spread(d.girths),
      open: d.open,
      greens: colours.size,
      fruit: [...new Set((d.fruit ?? []).filter(Boolean))],
      limbs: Boolean(window.__archonScene().getObjectByName("trees:limbs")),
      draws: window.__archonScene().getObjectByName("trees")?.children.length,
    };
  });
  check("trees vary: height, girth, open and full canopies, greens, visible limbs, few draws", trees.heightRange > 1.5 && trees.girthRange > 0.08 && trees.open > 3 && trees.greens >= 6 && trees.limbs && trees.draws <= 8, JSON.stringify(trees));
  check("fruit types are apple, orange and lemon", ["#b8322c", "#e8842a", "#e3c83a"].every((one) => trees.fruit.includes(one)), JSON.stringify(trees.fruit));

  /* 11, 12: the voice initialises safely and never speaks a line twice. */
  const voice = await page.evaluate(async () => {
    const out = { supported: null, utterances: 0, error: null };
    try {
      const v = window.__archonVoice?.();
      out.supported = v?.state.supported ?? null;
      if (!window.speechSynthesis) return out;
      const original = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = () => {
        out.utterances += 1;
      };
      v.store.enable(true);
      const line = "Merhaba, Archon Soft'a hoş geldiniz. Ben size yardımcı olmak için buradayım. Hangi konuda birlikte çalışmak istersiniz?";
      v.store.speak("qa", line, "tr-TR");
      v.store.speak("qa", line, "tr-TR");
      v.store.stop();
      v.store.enable(false);
      window.speechSynthesis.speak = original;
    } catch (error) {
      out.error = String(error);
    }
    return out;
  });
  check("the voice provider initialises safely", voice.error === null && typeof voice.supported === "boolean", JSON.stringify(voice));
  check("no duplicate speech: the same line asked twice is spoken once, a sentence at a time", voice.utterances === 3, `${voice.utterances} utterances queued`);

  /* 13: no building on a walkable deck. */
  const inside = plan.campus.filter((bld) => {
    const [w, d] = bld.size;
    const turned = Math.abs(Math.sin(bld.turn)) > 0.5;
    const hx = (turned ? d : w) / 2;
    const hz = (turned ? w : d) / 2;
    return plan.zones.some(({ bounds: [minX, minZ, maxX, maxZ] }) => bld.at[0] + hx > minX && bld.at[0] - hx < maxX && bld.at[2] + hz > minZ && bld.at[2] - hz < maxZ);
  });
  const overlap = plan.campus.filter((a, i) => plan.campus.some((c, j) => j > i && Math.hypot(a.at[0] - c.at[0], a.at[2] - c.at[2]) < (Math.max(...a.size) + Math.max(...c.size)) / 2));
  check("no buildings inside walkable zones, and none inside another", inside.length === 0 && overlap.length === 0, `${inside.map((x) => x.for)} / ${overlap.map((x) => x.for)}`);

  /* Office staff: seated at their desks, not sunk into them, and not in step. */
  await page.evaluate(() => window.__archonPlace?.(-6, 13, 90));
  await page.waitForTimeout(2500);
  const staff = await page.evaluate(() => {
    const office = window.__archonScene().getObjectByName("office:lobby");
    const heads = [];
    const turns = [];
    office?.traverse((o) => {
      if (o.name !== "head" || !o.isBone) return;
      const p = o.getWorldPosition(o.position.clone());
      heads.push(+(p.y - office.getWorldPosition(o.position.clone()).y).toFixed(2));
      turns.push(+o.rotation.y.toFixed(3));
    });
    return { heads, distinct: new Set(turns).size, count: turns.length };
  });
  check("office staff sit at their desks: heads above the desk, below standing height", staff.count >= 2 && staff.heads.every((h) => h > 0.95 && h < 1.5), JSON.stringify(staff.heads));
  check("and are not animated in lockstep", staff.distinct >= staff.count - 1, `${staff.distinct} distinct head turns of ${staff.count}`);
  await page.screenshot({ path: `${OUT}/lobby.png` });

  check("no page errors on the desktop checks", errors.length === 0, errors.join(" | ").slice(0, 300));
  await browser.close();
}

/* 10: phones — every department's name readable from its arrival. */
for (const [tag, viewport] of [["portrait", { width: 390, height: 844 }], ["landscape", { width: 844, height: 390 }]]) {
  const browser = await launch(viewport.width, viewport.height);
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
  const page = await ctx.newPage();
  await page.bringToFront();
  await page.goto(BASE + "/tr", { waitUntil: "domcontentloaded" });
  await enterWorld(page, "tr", 4000);
  const plan = await page.evaluate(() => window.__archonPlan());
  const letters = [];
  for (const office of plan.offices) {
    const [ax, , az] = office.at;
    const [rx, , rz] = office.arrival;
    await page.evaluate(([x, z, d]) => window.__archonPlace?.(x, z, d), [rx, rz, (Math.atan2(-(ax - rx), -(az - rz)) * 180) / Math.PI]);
    await page.evaluate(() => window.__archonTurn?.(0, 10));
    await page.waitForTimeout(1100);
    const view = await page.evaluate((id) => window.__archonSignView?.(id), office.id);
    letters.push([office.id, view && view.shown && view.inFront ? view.height * view.cap : 0]);
  }
  const low = letters.filter(([, px]) => px < 12);
  const median = [...letters].map(([, px]) => px).sort((a, b) => a - b)[Math.floor(letters.length / 2)];
  check(`phone ${tag}: department names readable (all ≥ 12 CSS px)`, low.length === 0, `median ${median.toFixed(0)}px, smallest ${Math.min(...letters.map(([, px]) => px)).toFixed(0)}px`);
  await browser.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
