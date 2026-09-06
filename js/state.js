/* Sprout & Skillet — game state, persistence and time helpers */
(function (SS) {
  "use strict";

  SS.state = null;
  var saveTimer = null;

  SS.clamp = function (v, min, max) { return Math.max(min, Math.min(max, v)); };
  SS.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  SS.weighted = function (arr) {
    var total = 0, i;
    for (i = 0; i < arr.length; i++) total += arr[i].weight;
    var r = Math.random() * total;
    for (i = 0; i < arr.length; i++) { r -= arr[i].weight; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  };
  SS.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  SS.defaultState = function () {
    var now = Date.now();
    return {
      version: SS.SAVE_VERSION,
      coins: SS.C.START_COINS,
      xp: 0,
      level: 1,
      maxPlots: 4,
      maxStations: 2,
      maxTables: 2,
      plots: [null, null, null, null],
      stations: [null, null],
      tables: [null, null],
      pantry: {},
      plated: [],                 // [{recipeId, platedAt, quality}]
      upgrades: {},
      nextSpawnAt: now + 4000,
      reputation: 0,
      combo: 0,
      chefs: 0,
      servers: 0,
      lastWageAt: now,
      ticketCounter: 0,
      soundOn: true,
      reduceMotion: false,
      stats: { harvested: 0, cooked: 0, served: 0, criticsServed: 0, watered: 0, pests: 0, perfect: 0, bestCombo: 0, quests: 0, coinsEarned: 0, walkouts: 0, burnt: 0 },
      achievementsDone: {},
      prestige: 0,
      tutorialStep: 0,
      tutorialDone: false,
      seenWelcome: false,
      startedAt: now,
      dayOffset: now,             // clock reference for the day/night cycle
      weather: "sunny",
      weatherUntil: now + 120000,
      event: null,                // {id, until}
      nextEventAt: now + 120000,
      quests: [],
      questDay: -1,
      lastSeenAt: now,
      unlockedLog: {}
    };
  };

  /* ---- clock ---- */
  SS.dayProgress = function (now) {
    now = now || Date.now();
    var t = (now - SS.state.dayOffset) % SS.DAY_MS;
    if (t < 0) t += SS.DAY_MS;
    return t / SS.DAY_MS; // 0..1, 0 = dawn, 0.5 = dusk
  };
  SS.dayNumber = function (now) {
    now = now || Date.now();
    return Math.floor((now - SS.state.dayOffset) / SS.DAY_MS) + 1;
  };
  SS.currentSeason = function (now) {
    var day = SS.dayNumber(now) - 1;
    return SS.SEASONS[Math.floor(day / SS.DAYS_PER_SEASON) % SS.SEASONS.length];
  };
  SS.isNight = function (now) { var p = SS.dayProgress(now); return p > 0.62 || p < 0.08; };

  /* ---- persistence ---- */
  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, val) {
    try { window.localStorage.setItem(key, val); return true; } catch (e) { return false; }
  }

  SS.migrate = function (parsed) {
    var base = SS.defaultState();
    var s = Object.assign(base, parsed);
    s.stats = Object.assign(base.stats, parsed.stats || {});
    s.upgrades = Object.assign({}, parsed.upgrades || {});
    if (!Array.isArray(s.plated)) s.plated = [];
    if (parsed.readyDishes) { // v1 save format
      Object.keys(parsed.readyDishes).forEach(function (id) {
        for (var i = 0; i < parsed.readyDishes[id]; i++) s.plated.push({ recipeId: id, platedAt: Date.now(), quality: "good" });
      });
    }
    while (s.plots.length < s.maxPlots) s.plots.push(null);
    while (s.stations.length < s.maxStations) s.stations.push(null);
    while (s.tables.length < s.maxTables) s.tables.push(null);
    s.version = SS.SAVE_VERSION;
    return s;
  };

  SS.loadGame = function () {
    var raw = storageGet(SS.SAVE_KEY);
    if (!raw) return SS.defaultState();
    try { return SS.migrate(JSON.parse(raw)); } catch (e) { return SS.defaultState(); }
  };

  SS.saveGame = function (immediate) {
    clearTimeout(saveTimer);
    var doSave = function () {
      if (!SS.state) return;
      SS.state.lastSeenAt = Date.now();
      storageSet(SS.SAVE_KEY, JSON.stringify(SS.state));
    };
    if (immediate) doSave(); else saveTimer = setTimeout(doSave, 500);
  };

  SS.exportSave = function () { return JSON.stringify(SS.state); };
  SS.importSave = function (text) {
    var parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || typeof parsed.coins !== "number") throw new Error("Not a Sprout & Skillet save");
    SS.state = SS.migrate(parsed);
    SS.saveGame(true);
  };
  SS.wipeSave = function () { try { window.localStorage.removeItem(SS.SAVE_KEY); } catch (e) {} };
})(window.SS = window.SS || {});
