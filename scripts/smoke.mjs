/* Headless smoke test: boots the game, plays through the core loop with time
   acceleration, and fails on any console error. Run: node scripts/smoke.mjs */
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Resolve playwright from the project, then from a global install (e.g. npm -g).
const require = createRequire(import.meta.url);
const globalRoot = process.env.NODE_PATH || "/opt/node22/lib/node_modules";
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require(path.join(globalRoot, "playwright"))); }
const outDir = process.env.SHOT_DIR || path.join(root, ".smoke");
fs.mkdirSync(outDir, { recursive: true });
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|net::ERR/.test(m.text())) errors.push("console: " + m.text()); });
// block web fonts so the test is offline-safe
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

const assert = (cond, msg) => { if (!cond) throw new Error("ASSERT: " + msg); };
const shot = (name) => page.screenshot({ path: path.join(outDir, name + ".png") });
// Skip ahead in game time by shifting every timestamp in the save.
const warp = (ms) => page.evaluate((ms) => {
  const s = SS.state, shift = (o, k) => { if (o && typeof o[k] === "number") o[k] -= ms; };
  s.plots.forEach((p) => { shift(p, "plantedAt"); shift(p, "readyAt"); shift(p, "pestAt"); });
  s.stations.forEach((st) => { shift(st, "startedAt"); shift(st, "doneAt"); });
  s.tables.forEach((t) => { shift(t, "arrivedAt"); shift(t, "exitAt"); });
  s.plated.forEach((d) => shift(d, "platedAt"));
  shift(s, "nextSpawnAt"); shift(s, "lastWageAt"); shift(s, "dayOffset");
  s.weatherUntil += ms; s.nextEventAt += ms; // keep weather/events out of the way
  SS.tick();
}, ms);

try {
  await page.goto(url);
  await page.waitForSelector("#app.loaded");
  assert(await page.isVisible("#modal-overlay.open"), "welcome modal shown on first run");
  await shot("00-welcome");
  await page.click("#modal-close");

  // Garden: plant on every plot (tomato x2, lettuce x2)
  const plots = await page.locator('[data-action="plant-open"]').count();
  assert(plots === 4, "four starting plots, got " + plots);
  for (let i = 0; i < 4; i++) {
    await page.click(`[data-action="plant-open"][data-plot="${i}"]`);
    await page.click(`[data-action="plant-choose"][data-crop="${i < 2 ? "tomato" : "lettuce"}"]`);
  }
  await shot("01-garden-planted");
  // Water every crop
  for (let i = 0; i < 4; i++) await page.click(`[data-action="water"][data-plot="${i}"]`);
  const watered = await page.evaluate(() => SS.state.stats.watered);
  assert(watered === 4, "watered 4 crops, got " + watered);
  // Force a pest and shoo it
  await page.evaluate(() => { SS.state.plots[0].pest = true; SS.state.plots[0].pestAt = Date.now(); SS.render(); });
  await page.click('[data-action="shoo"][data-plot="0"]');
  assert(await page.evaluate(() => SS.state.stats.pests) === 1, "pest shooed");
  await warp(60000);
  await shot("02-garden-ready");
  await page.click('[data-action="harvest"][data-plot="0"]');
  await page.click("#harvest-all-btn");
  const pantry = await page.evaluate(() => SS.state.pantry);
  assert(pantry.tomato >= 6 && pantry.lettuce >= 6, "pantry stocked: " + JSON.stringify(pantry));

  // Kitchen: cook a salad and a tomato soup
  await page.click('[data-tab="kitchen"]');
  await page.click('[data-action="station-open"][data-station="0"]');
  await page.click('[data-action="cook-choose"][data-recipe="salad"]');
  await page.click('[data-action="station-open"][data-station="1"]');
  await page.click('[data-action="cook-choose"][data-recipe="tomatosoup"]');
  await shot("03-kitchen-cooking");
  // open zoom modal then close
  await page.click('[data-action="station-open"][data-station="0"]');
  assert(await page.isVisible(".zoom-ring"), "zoom modal renders");
  await page.click("#modal-close");
  await warp(15500); // salad (15s) just finished
  await page.click('[data-action="collect"][data-station="0"]');
  await warp(5000);  // soup (20s) just finished
  await page.click('[data-action="collect"][data-station="1"]');
  const plated = await page.evaluate(() => SS.state.plated.map((d) => d.recipeId + ":" + d.quality));
  assert(plated.length === 2 && plated.every((p) => p.endsWith(":perfect")), "two perfect plates: " + plated);
  await shot("04-kitchen-pass");

  // Dining: seat a guest who wants tomato soup and serve them
  await page.evaluate(() => {
    SS.state.tables[0] = { ticketNo: 99, recipeId: "tomatosoup", type: "foodie", name: "Test", seed: 7, arrivedAt: Date.now(), patienceMs: 60000, exiting: null };
    SS.state.tables[1] = { ticketNo: 100, recipeId: "bread", type: "critic", name: "The Critic", seed: 3, arrivedAt: Date.now(), patienceMs: 60000, exiting: null };
    SS.render();
  });
  await page.click('[data-tab="dining"]');
  await shot("05-dining");
  const coinsBefore = await page.evaluate(() => SS.state.coins);
  await page.click('[data-action="serve"][data-table="0"]');
  const after = await page.evaluate(() => ({ coins: SS.state.coins, served: SS.state.stats.served, combo: SS.state.combo, exiting: SS.state.tables[0].exiting }));
  assert(after.coins > coinsBefore && after.served === 1 && after.exiting === "happy", "serve paid out: " + JSON.stringify(after));
  await page.waitForTimeout(400);
  await shot("06-dining-served");

  // Shop + goals render, buy a plot
  await page.click('[data-tab="shop"]');
  await page.evaluate(() => { SS.state.coins += 1000; SS.render(); });
  await page.click('[data-action="buy-expand"][data-type="plot"]');
  assert(await page.evaluate(() => SS.state.maxPlots) === 5, "bought a plot");
  await page.click('[data-action="buy-upgrade"][data-id="lighting"]');
  assert(await page.evaluate(() => SS.state.upgrades.lighting === true), "bought lighting");
  await shot("07-shop");
  await page.click('[data-tab="goals"]');
  assert(await page.locator(".quest").count() === 3, "three daily orders");
  await shot("08-goals");

  // Level up flow: pump xp
  await page.evaluate(() => { SS.addXp(200); SS.render(); });
  await page.waitForTimeout(400);
  assert(await page.isVisible(".levelup"), "level-up modal");
  await shot("09-levelup");
  await page.click("#modal-close");

  // Night-time + rain rendering
  await page.evaluate(() => { SS.state.dayOffset = Date.now() - SS.DAY_MS * 0.8; SS.state.weather = "rain"; SS.render(); });
  await page.click('[data-tab="garden"]');
  await page.waitForTimeout(300);
  assert(await page.evaluate(() => document.body.classList.contains("night")), "night class applied");
  await shot("10-night-rain");

  // Persistence: reload and confirm state survived
  await page.evaluate(() => SS.saveGame(true));
  await page.reload();
  await page.waitForSelector("#app.loaded");
  const reloaded = await page.evaluate(() => ({ plots: SS.state.maxPlots, lighting: SS.state.upgrades.lighting, served: SS.state.stats.served }));
  assert(reloaded.plots === 5 && reloaded.lighting && reloaded.served === 1, "state persisted across reload: " + JSON.stringify(reloaded));

  // Guest walkout path + spawn path via natural ticks
  await page.evaluate(() => {
    SS.state.tables[0] = { ticketNo: 101, recipeId: "bread", type: "regular", name: "Late", seed: 1, arrivedAt: Date.now() - 999999, patienceMs: 1000, exiting: null };
    SS.state.nextSpawnAt = 0; SS.tick();
  });
  const walk = await page.evaluate(() => ({ walkouts: SS.state.stats.walkouts, tables: SS.state.tables.filter(Boolean).length }));
  assert(walk.walkouts === 1 && walk.tables >= 1, "walkout + spawn: " + JSON.stringify(walk));

  // Full-speed tick soak: run 200 ticks quickly and make sure nothing throws
  await page.evaluate(() => { for (let i = 0; i < 200; i++) SS.tick(); });

  if (errors.length) throw new Error("Browser errors:\n" + errors.join("\n"));
  console.log("SMOKE OK — screenshots in " + outDir);
} catch (e) {
  await shot("99-failure");
  console.error(e.message);
  if (errors.length) console.error(errors.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
