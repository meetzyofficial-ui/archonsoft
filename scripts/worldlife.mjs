/** Host follow, jump, teleport — on the real GPU: `GPU=1 node scripts/worldlife.mjs`. */
import { chromium } from "playwright";
import { enterWorld } from "./lib/enter.mjs";
import fs from "node:fs";
const gpu = process.env.GPU === "1";
const browser = gpu
  ? await chromium.launch({ headless: false, channel: "chrome", args: ["--window-size=1460,900"] })
  : await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
fs.mkdirSync(".qa/world", { recursive: true });
let passed = 0, failed = 0;
const check = (name, ok, note = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`); ok ? passed++ : failed++; };
const text = async () => (await page.locator(".world-overlay").innerText()).replace(/\s+/g, " ");
const pose = async () => (await text()).match(/([NSEW]+) ([+−]\d+) ([+−]\d+)( · \+\d+)?/);
const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };

await page.goto((process.env.ARCHON_BASE ?? "http://localhost:3210") + "/tr", { waitUntil: "networkidle" });
await enterWorld(page, "tr", 6000);
await page.mouse.click(720, 450);
await page.waitForTimeout(400);

/* The host. */
check("the rail lists every destination", (await page.locator("[data-rail] [data-destination]").count()) === 7);
await page.keyboard.press("6");
await page.waitForTimeout(1600);
const p0 = await pose();
check("6 teleports to the systems island", p0 && Number(p0[2].replace("−", "-")) === -40, p0?.[0]);
await page.keyboard.press("1");
await page.waitForTimeout(1600);
await page.mouse.click(720, 450);
await page.waitForTimeout(300);
await page.evaluate(() => window.__archonTurn?.(0));
/* Back at the hub arrival (0,16): the host is at (9.5,20). */
await page.evaluate(() => window.__archonTurn?.(113));
await hold("w", 1600);
await page.evaluate(() => window.__archonTurn?.(0));
await page.waitForTimeout(500);
await page.waitForTimeout(400);
check("the host offers to talk", /KONUŞ/.test(await text()), (await text()).slice(-200));
await page.keyboard.press("e");
await page.waitForTimeout(900);
check("the host card opens with the Turkish introduction", /Merhaba, Archon Soft dünyasına hoş geldiniz/.test(await text()));
await page.screenshot({ path: ".qa/world/life-host.png" });
check("she asks what the visitor would like", /Ne ile ilgilenmek/.test(await text()));
check("and offers five ways in — the last is AracımGo", (await page.locator("[data-host-option]").count()) === 5);
await page.locator("[data-host-follow]").click();
await page.waitForTimeout(400);
check("she agrees to come along", /S[İi]Z[İi]NLE Y[ÜÜ]R[ÜÜ]YOR|Sizinle yürüyor/i.test(await text()));
check("the introduction is remembered", (await page.evaluate(() => localStorage.getItem("archonWorldWelcomeSeen"))) === "1");

/* Walk, and see that she follows. */
await page.evaluate(() => window.__archonTurn?.(-67));
const hostBefore = await page.evaluate(() => JSON.stringify(window.__archonHost?.()));
await page.keyboard.down("Shift"); await hold("w", 3500); await page.keyboard.up("Shift");
await page.waitForTimeout(1500);
const hostAfter = await page.evaluate(() => JSON.stringify(window.__archonHost?.()));
console.log("host before/after:", hostBefore, hostAfter);
await page.screenshot({ path: ".qa/world/life-follow.png" });
const p1 = await pose();
check("the explorer walked", p1 && Number(p1[3].replace("−", "-")) < 10, p1?.[0]);

/* Jump. */
await page.keyboard.press(" ");
await page.waitForTimeout(380);
const lift = await page.evaluate(() => window.__archonBody?.().lift);
await page.screenshot({ path: ".qa/world/life-jump.png" });
check("space lifts the explorer off the deck", typeof lift === "number" && lift > 0.6, `lift ${lift}`);
await page.waitForTimeout(1200);
const down = await page.evaluate(() => window.__archonBody?.().lift);
check("and gravity brings it back", down === 0, `lift ${down}`);

/* Teleport. */
await page.keyboard.press("2");
await page.waitForTimeout(250);
await page.screenshot({ path: ".qa/world/life-teleport-out.png" });
await page.waitForTimeout(1400);
await page.screenshot({ path: ".qa/world/life-dppano.png" });
const p2 = await pose();
check("2 teleports to DP Pano", p2 && Number(p2[2].replace("−", "-")) > 36 && Number(p2[3].replace("−", "-")) < -60, p2?.[0]);
check("the rail marks the destination", (await page.locator('[data-rail] [data-destination="dppano"][aria-current="true"]').count()) === 1);
await page.keyboard.press("5");
await page.waitForTimeout(1600);
const p3 = await pose();
check("5 teleports up to the gallery", p3 && /\+9/.test(p3[0]), p3?.[0]);
await page.screenshot({ path: ".qa/world/life-gallery.png" });
await page.keyboard.press("3");
await page.waitForTimeout(1600);
await page.screenshot({ path: ".qa/world/life-meetzy.png" });
await page.keyboard.press("4");
await page.waitForTimeout(1600);
await page.screenshot({ path: ".qa/world/life-erden.png" });
await page.keyboard.press("1");
await page.waitForTimeout(1600);
const p4 = await pose();
check("1 returns to the hub", p4 && Math.abs(Number(p4[2].replace("−", "-"))) < 3 && Number(p4[3].replace("−", "-")) > 10, p4?.[0]);
/* Rapid switching. */
for (const key of ["1", "3", "5", "2", "4"]) { await page.keyboard.press(key); await page.waitForTimeout(350); }
await page.waitForTimeout(1600);
const p5 = await pose();
check("rapid 1→3→5→2→4 lands at Erden", p5 && Number(p5[2].replace("−", "-")) === 2 && Number(p5[3].replace("−", "-")) === -36, p5?.[0]);
check("no teleport is left half-done", (await page.evaluate(() => window.__archonBody?.().hidden)) === false);

/* Gallery pylons are solid now: from the hub arrival, aim straight at the
   pylon at (24.5, 3) and run into it. */
await page.keyboard.press("1");
await page.waitForTimeout(1500);
const aim = async (tx, tz) => {
  const b = await page.evaluate(() => window.__archonBody?.());
  const want = Math.atan2(-(tx - b.x), -(tz - b.z));
  let rel = want - b.yaw;
  rel = Math.atan2(Math.sin(rel), Math.cos(rel));
  /* The hook subtracts degrees from the yaw. */
  await page.evaluate((deg) => window.__archonTurn?.(deg), (-rel * 180) / Math.PI);
};
await aim(11.6, 34.2);
await page.keyboard.down("Shift"); await hold("w", 3200); await page.keyboard.up("Shift");
await page.waitForTimeout(400);
const bodyEnd = await page.evaluate(() => window.__archonBody?.());
console.log("after running at the totem:", bodyEnd.x.toFixed(2), bodyEnd.z.toFixed(2));
const toTotem = Math.hypot(bodyEnd.x - 11.6, bodyEnd.z - 34.2);
check("the visitor is stopped by the wayfinding totem", toTotem > 1.0 && toTotem < 2.6, `distance ${toTotem.toFixed(2)}`);
/* And the pylon: walk from the hub arrival toward the east flank pylon at (24.5, 3). */
await page.keyboard.press("1");
await page.waitForTimeout(1500);
await aim(24.5, 3);
await page.keyboard.down("Shift"); await hold("w", 4200); await page.keyboard.up("Shift");
await page.waitForTimeout(400);
const bodyP = await page.evaluate(() => window.__archonBody?.());
const toPylon = Math.hypot(bodyP.x - 24.5, bodyP.z - 3);
console.log("after running at the pylon:", bodyP.x.toFixed(2), bodyP.z.toFixed(2), "distance", toPylon.toFixed(2));
check("the visitor does not pass through the gallery pylon", toPylon > 0.6, `distance ${toPylon.toFixed(2)}`);

const hostHome = await page.evaluate(() => JSON.stringify(window.__archonHost?.()));
console.log("host after teleports:", hostHome);
console.log("info:", JSON.stringify(await page.evaluate(() => window.__archonInfo?.())));
console.log("errors:", errors);
check("no page errors", errors.length === 0);
await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
