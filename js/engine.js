/* Sprout & Skillet — game rules: economy, actions and the tick loop */
(function (SS) {
  "use strict";
  var C = SS.C;
  var listeners = {};
  SS.on = function (evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); };
  SS.emit = function (evt, data) { (listeners[evt] || []).forEach(function (fn) { fn(data); }); };

  function S() { return SS.state; }

  /* ---------- lookups ---------- */
  SS.currentRepTier = function () {
    var tier = SS.REP_TIERS[0];
    for (var i = 0; i < SS.REP_TIERS.length; i++) if (S().reputation >= SS.REP_TIERS[i].min) tier = SS.REP_TIERS[i];
    return tier;
  };
  SS.nextRepTier = function () {
    var idx = SS.REP_TIERS.indexOf(SS.currentRepTier());
    return idx < SS.REP_TIERS.length - 1 ? SS.REP_TIERS[idx + 1] : null;
  };
  SS.activeEvent = function () {
    var e = S().event;
    if (e && e.until > Date.now()) return SS.eventDef(e.id);
    return null;
  };
  SS.weather = function () { return SS.weatherDef(S().weather); };
  SS.inSeason = function (cropId) {
    if (S().upgrades.greenhouse) return true;
    return SS.currentSeason().boost.indexOf(cropId) >= 0;
  };

  /* ---------- multipliers ---------- */
  SS.growMult = function (cropId) {
    var m = S().upgrades.herbboxes ? 0.9 : 1;
    m *= SS.weather().grow;
    if (SS.inSeason(cropId)) m *= SS.SEASON_BOOST;
    return m;
  };
  SS.cookMult = function () { return (S().upgrades.cookware ? 0.85 : 1) * Math.pow(0.92, S().chefs); };
  SS.patienceMult = function () {
    var s = S();
    var m = s.upgrades.fountain ? 1.15 : 1;
    m *= SS.weather().patience;
    m *= s.level <= 1 ? 1.4 : (s.level === 2 ? 1.25 : (s.level === 3 ? 1.1 : 1));
    m *= 1 + s.servers * 0.10;
    var ev = SS.activeEvent(); if (ev && ev.id === "chill") m *= 1.35;
    return m;
  };
  SS.spawnIntervalMult = function () {
    var m = S().upgrades.music ? 0.8 : 1;
    m *= SS.currentRepTier().spawnMult;
    m /= SS.weather().spawn;
    var ev = SS.activeEvent(); if (ev && ev.id === "rush") m *= 0.45;
    return m;
  };
  SS.comboMult = function () { return 1 + Math.min(S().combo, 10) * 0.04; };
  SS.prestigeMult = function () { return Math.pow(1 + C.PRESTIGE_BONUS, S().prestige); };
  SS.tipMult = function () {
    var s = S();
    var m = s.upgrades.lighting ? 1.1 : 1;
    m *= SS.comboMult() * SS.currentRepTier().tipBonus * (1 + s.servers * 0.05) * SS.prestigeMult();
    var ev = SS.activeEvent(); if (ev && ev.id === "rush") m *= 1.25;
    return m;
  };
  SS.seedCost = function (crop) {
    var ev = SS.activeEvent();
    return ev && ev.id === "market" ? Math.max(1, Math.floor(crop.cost / 2)) : crop.cost;
  };
  SS.qualityMult = function (q) { return q === "perfect" ? 1.15 : (q === "cold" ? C.COLD_PENALTY : 1); };

  SS.computeEarn = function (recipe, guest, quality) {
    var type = SS.guestType(guest.type);
    var base = recipe.value * type.tip * SS.qualityMult(quality);
    return Math.round(base * SS.tipMult());
  };

  /* ---------- progress helpers ---------- */
  SS.plotProgress = function (plot, now) {
    now = now || Date.now();
    var effNow = plot.pest ? plot.pestAt : now;
    var total = plot.readyAt - plot.plantedAt;
    return SS.clamp((effNow - plot.plantedAt) / total, 0, 1);
  };
  SS.plotReady = function (plot, now) { return !plot.pest && (now || Date.now()) >= plot.readyAt; };
  SS.plotSecsLeft = function (plot, now) { now = now || Date.now(); return Math.max(0, Math.ceil((plot.readyAt - (plot.pest ? plot.pestAt : now)) / 1000)); };
  SS.stationProgress = function (st, now) { now = now || Date.now(); return SS.clamp((now - st.startedAt) / (st.doneAt - st.startedAt), 0, 1); };
  SS.stationReady = function (st, now) { return (now || Date.now()) >= st.doneAt; };
  SS.stationSecsLeft = function (st, now) { return Math.max(0, Math.ceil((st.doneAt - (now || Date.now())) / 1000)); };
  SS.dishQuality = function (dish, now) {
    now = now || Date.now();
    if (!S().upgrades.warmer && now - dish.platedAt > C.COLD_AFTER_MS) return "cold";
    return dish.quality;
  };
  SS.platedCount = function (recipeId) {
    var n = 0; S().plated.forEach(function (d) { if (d.recipeId === recipeId) n++; }); return n;
  };
  SS.canCook = function (recipe) {
    for (var k in recipe.ingredients) if ((S().pantry[k] || 0) < recipe.ingredients[k]) return false;
    return true;
  };
  SS.countReadyPlots = function () { var n = 0, now = Date.now(); S().plots.forEach(function (p) { if (p && SS.plotReady(p, now)) n++; }); return n; };
  SS.countPests = function () { var n = 0; S().plots.forEach(function (p) { if (p && p.pest) n++; }); return n; };
  SS.countReadyStations = function () { var n = 0, now = Date.now(); S().stations.forEach(function (st) { if (st && SS.stationReady(st, now)) n++; }); return n; };
  SS.countServable = function () {
    var n = 0; S().tables.forEach(function (t) { if (t && !t.exiting && SS.platedCount(t.recipeId) > 0) n++; }); return n;
  };
  SS.prestigeReady = function () {
    var s = S(), r = C.PRESTIGE_REQ;
    return s.level >= r.level && s.maxPlots >= r.plots && s.maxStations >= r.stations && s.maxTables >= r.tables;
  };

  /* ---------- rewards ---------- */
  SS.gainCoins = function (n, pt) {
    var s = S();
    s.coins += n;
    if (n > 0) s.stats.coinsEarned += n;
    if (n > 0) SS.questProgress("earn", null, n);
  };

  SS.addXp = function (amount) {
    var s = S();
    s.xp += amount;
    var leveled = false, unlocks = [];
    while (s.xp >= SS.xpForLevel(s.level)) {
      s.xp -= SS.xpForLevel(s.level);
      s.level += 1;
      leveled = true;
      var lv = s.level;
      SS.CROPS.forEach(function (c) { if (c.unlockLevel === lv) unlocks.push({ emoji: c.emoji, name: c.name, kind: "Crop" }); });
      SS.RECIPES.forEach(function (r) { if (r.unlockLevel === lv) unlocks.push({ emoji: r.emoji, name: r.name, kind: "Recipe" }); });
      SS.UPGRADES.forEach(function (u) { if (u.unlockLevel === lv) unlocks.push({ emoji: u.emoji, name: u.name, kind: "Upgrade" }); });
      if (lv === C.CHEF_UNLOCK_LEVEL) unlocks.push({ emoji: "👨‍🍳", name: "Hire Chefs", kind: "Staff" });
      if (lv === C.SERVER_UNLOCK_LEVEL) unlocks.push({ emoji: "🧑‍🍽️", name: "Hire Servers", kind: "Staff" });
    }
    if (leveled) {
      SS.fx.confetti(24); SS.audio.levelUp(); SS.fx.flash("gold");
      SS.emit("levelup", { level: s.level, unlocks: unlocks });
    }
  };

  SS.checkAchievements = function () {
    var s = S();
    SS.ACHIEVEMENTS.forEach(function (a) {
      if (s.achievementsDone[a.id]) return;
      if (SS.achievementProgress(a) >= a.target) {
        s.achievementsDone[a.id] = true;
        SS.gainCoins(a.reward.coins);
        SS.fx.toast("🏆 " + a.name + "! +" + a.reward.coins + " 🪙", "gold");
        SS.fx.confetti(14); SS.audio.levelUp();
        SS.addXp(a.reward.xp);
      }
    });
  };
  SS.achievementProgress = function (a) {
    var s = S();
    if (a.stat) return s.stats[a.stat] || 0;
    if (a.field) return s[a.field] || 0;
    if (a.custom === "staff") return Math.min(s.chefs, 3) + Math.min(s.servers, 3);
    return 0;
  };

  /* ---------- quests ---------- */
  function makeQuest() {
    var s = S();
    var tpl = SS.pick(SS.QUEST_TEMPLATES);
    var tier = Math.min(2, Math.floor((s.level - 1) / 3));
    var n = tpl.counts[tier];
    var q = { id: "q" + Date.now() + Math.floor(Math.random() * 1000), kind: tpl.kind, n: n, progress: 0 };
    if (tpl.kind === "harvest") {
      var crops = SS.CROPS.filter(function (c) { return c.unlockLevel <= s.level; });
      var crop = SS.pick(crops);
      q.target = crop.id; q.label = "Harvest " + n + " " + crop.name; q.emoji = crop.emoji;
      q.reward = { coins: Math.round(n * crop.cost * 1.6) + 20, xp: n * 3 };
    } else if (tpl.kind === "cook") {
      var recipes = SS.RECIPES.filter(function (r) { return r.unlockLevel <= s.level; });
      var recipe = SS.pick(recipes);
      q.target = recipe.id; q.label = "Cook " + n + " " + recipe.name; q.emoji = recipe.emoji;
      q.reward = { coins: Math.round(n * recipe.value * 0.6) + 20, xp: n * recipe.xp };
    } else if (tpl.kind === "serve") {
      q.label = "Serve " + n + " guests"; q.emoji = "🍽️";
      q.reward = { coins: n * 14 + 20, xp: n * 6 };
    } else {
      n = tpl.counts[tier] * (1 + Math.floor(s.level / 2));
      q.n = n; q.label = "Earn " + n + " coins"; q.emoji = "🪙";
      q.reward = { coins: Math.round(n * 0.3), xp: Math.round(n * 0.2) };
    }
    return q;
  }
  SS.ensureQuests = function () {
    var s = S();
    while (s.quests.length < 3) s.quests.push(makeQuest());
  };
  SS.questProgress = function (kind, target, n) {
    var s = S();
    var done = [];
    s.quests.forEach(function (q) {
      if (q.kind !== kind) return;
      if (q.target && q.target !== target) return;
      q.progress = Math.min(q.n, q.progress + n);
      if (q.progress >= q.n) done.push(q);
    });
    done.forEach(function (q) {
      s.quests.splice(s.quests.indexOf(q), 1);
      s.stats.quests++;
      s.coins += q.reward.coins; s.stats.coinsEarned += q.reward.coins;
      SS.fx.toast("📜 Order complete: " + q.label + " · +" + q.reward.coins + " 🪙", "gold");
      SS.audio.levelUp();
      SS.addXp(q.reward.xp);
    });
    if (done.length) SS.ensureQuests();
  };
  SS.rerollQuest = function (id) {
    var s = S();
    var day = SS.dayNumber();
    if (s.rerollDay === day) return false;
    var idx = -1;
    s.quests.forEach(function (q, i) { if (q.id === id) idx = i; });
    if (idx < 0) return false;
    s.quests[idx] = makeQuest();
    s.rerollDay = day;
    SS.audio.tap();
    SS.saveGame(); SS.render();
    return true;
  };

  /* ---------- garden ---------- */
  SS.plantCrop = function (i, cropId, pt) {
    var s = S(), crop = SS.cropDef(cropId);
    if (!crop || s.plots[i] || crop.unlockLevel > s.level) return false;
    var cost = SS.seedCost(crop);
    if (s.coins < cost) return false;
    s.coins -= cost;
    var now = Date.now();
    var need = crop.growTime * SS.growMult(cropId) * 1000;
    s.plots[i] = { cropId: cropId, plantedAt: now, readyAt: now + need, watered: !!s.upgrades.sprinklers, pest: false, pestAt: 0 };
    SS.audio.plant();
    if (pt) SS.fx.leaves(pt.x, pt.y);
    SS.saveGame(); SS.render();
    return true;
  };

  SS.waterPlot = function (i, pt) {
    var s = S(), p = s.plots[i];
    if (!p || p.watered || p.pest || SS.plotReady(p)) return false;
    p.watered = true;
    var total = p.readyAt - p.plantedAt;
    p.readyAt -= Math.round(total * C.WATER_BONUS);
    s.stats.watered++;
    SS.audio.water();
    if (pt) { SS.fx.droplets(pt.x, pt.y); SS.fx.floatText(pt.x, pt.y, "💧 +25%", "water"); }
    SS.checkAchievements(); SS.saveGame(); SS.render();
    return true;
  };

  SS.shooPest = function (i, pt) {
    var s = S(), p = s.plots[i];
    if (!p || !p.pest) return false;
    var paused = Date.now() - p.pestAt;
    p.plantedAt += paused; p.readyAt += paused;
    p.pest = false; p.pestAt = 0;
    s.stats.pests++;
    SS.audio.pest();
    if (pt) { SS.fx.burst(pt.x, pt.y, ["🐛", "💨"], 5, 30); SS.fx.floatText(pt.x, pt.y, "Shoo!", "bad"); }
    SS.checkAchievements(); SS.saveGame(); SS.render();
    return true;
  };

  function doHarvest(i) {
    var s = S(), p = s.plots[i], crop = SS.cropDef(p.cropId);
    var bonus = p.watered && Math.random() < 0.35 ? 1 : 0;
    var amount = crop.yield + bonus;
    s.pantry[p.cropId] = (s.pantry[p.cropId] || 0) + amount;
    s.plots[i] = null;
    s.stats.harvested++;
    SS.questProgress("harvest", p.cropId, 1);
    return { crop: crop, amount: amount, bonus: bonus };
  }

  SS.harvestPlot = function (i, pt) {
    var s = S(), p = s.plots[i];
    if (!p || !SS.plotReady(p)) return false;
    var r = doHarvest(i);
    SS.addXp(2 + (r.bonus ? 1 : 0));
    SS.audio.harvest();
    if (pt) {
      SS.fx.leaves(pt.x, pt.y);
      SS.fx.floatText(pt.x, pt.y, "+" + r.amount + " " + r.crop.emoji + (r.bonus ? " bonus!" : ""), r.bonus ? "gold" : "");
    }
    SS.checkAchievements(); SS.saveGame(); SS.render();
    return true;
  };

  SS.harvestAll = function () {
    var s = S(), n = 0, xp = 0, now = Date.now();
    for (var i = 0; i < s.plots.length; i++) {
      if (s.plots[i] && SS.plotReady(s.plots[i], now)) { var r = doHarvest(i); n++; xp += 2 + (r.bonus ? 1 : 0); }
    }
    if (!n) return;
    SS.addXp(xp); SS.audio.harvest();
    SS.fx.toast("🧺 Harvested " + n + " crop" + (n > 1 ? "s" : "") + "!");
    SS.checkAchievements(); SS.saveGame(); SS.render();
  };

  SS.buyPlot = function () {
    var s = S();
    if (s.maxPlots >= C.PLOT_CAP) return false;
    var cost = SS.plotCost(s.maxPlots);
    if (s.coins < cost) return false;
    s.coins -= cost; s.maxPlots++; s.plots.push(null);
    SS.audio.buy(); SS.fx.toast("🪵 New plot tilled!");
    SS.checkAchievements(); SS.saveGame(); SS.render();
    return true;
  };

  /* ---------- kitchen ---------- */
  SS.startCooking = function (i, recipeId, pt) {
    var s = S(), recipe = SS.recipeDef(recipeId);
    if (!recipe || s.stations[i] || recipe.unlockLevel > s.level || !SS.canCook(recipe)) return false;
    for (var k in recipe.ingredients) s.pantry[k] -= recipe.ingredients[k];
    var now = Date.now();
    s.stations[i] = { recipeId: recipeId, startedAt: now, doneAt: now + recipe.cookTime * SS.cookMult() * 1000 };
    SS.audio.cook();
    SS.saveGame(); SS.render();
    return true;
  };

  function doCollect(i, now) {
    var s = S(), st = s.stations[i], recipe = SS.recipeDef(st.recipeId);
    var perfect = now - st.doneAt <= C.PERFECT_WINDOW_MS;
    s.plated.push({ recipeId: st.recipeId, platedAt: now, quality: perfect ? "perfect" : "good" });
    s.stations[i] = null;
    s.stats.cooked++;
    if (perfect) s.stats.perfect++;
    SS.questProgress("cook", st.recipeId, 1);
    return { recipe: recipe, perfect: perfect };
  }

  SS.collectDish = function (i, pt) {
    var s = S(), st = s.stations[i], now = Date.now();
    if (!st || !SS.stationReady(st, now)) return false;
    var r = doCollect(i, now);
    SS.addXp(Math.round(r.recipe.xp * (r.perfect ? 0.45 : 0.3)));
    if (r.perfect) { SS.audio.perfect(); if (pt) { SS.fx.sparkle(pt.x, pt.y); SS.fx.floatText(pt.x, pt.y, "✨ Perfect!", "gold"); } }
    else { SS.audio.collect(); if (pt) SS.fx.floatText(pt.x, pt.y, r.recipe.emoji + " plated"); }
    SS.checkAchievements(); SS.saveGame(); SS.render();
    return true;
  };

  SS.collectAll = function () {
    var s = S(), n = 0, xp = 0, perfect = 0, now = Date.now();
    for (var i = 0; i < s.stations.length; i++) {
      if (s.stations[i] && SS.stationReady(s.stations[i], now)) { var r = doCollect(i, now); n++; xp += Math.round(r.recipe.xp * (r.perfect ? 0.45 : 0.3)); if (r.perfect) perfect++; }
    }
    if (!n) return;
    SS.addXp(xp); (perfect ? SS.audio.perfect : SS.audio.collect)();
    SS.fx.toast("🧺 Plated " + n + " dish" + (n > 1 ? "es" : "") + (perfect ? " · " + perfect + " perfect ✨" : "") + "!");
    SS.checkAchievements(); SS.saveGame(); SS.render();
  };

  SS.rushCost = function (st) { return Math.max(C.RUSH_MIN_COST, Math.ceil(SS.stationSecsLeft(st) * C.RUSH_RATE)); };

  SS.rushCook = function (i, pt) {
    var s = S(), st = s.stations[i], now = Date.now();
    if (!st || SS.stationReady(st, now)) return false;
    var recipe = SS.recipeDef(st.recipeId);
    var cost = SS.rushCost(st);
    if (s.coins < cost) return false;
    s.coins -= cost;
    if (Math.random() < C.MISHAP_CHANCE) {
      s.stations[i] = null; s.stats.burnt++;
      SS.audio.mishap(); SS.fx.shake();
      SS.fx.toast("🔥 Kitchen mishap! The " + recipe.name + " burned.", "bad");
      if (pt) { SS.fx.smoke(pt.x, pt.y); SS.fx.floatText(pt.x, pt.y, "burnt!", "bad"); }
    } else {
      s.plated.push({ recipeId: recipe.id, platedAt: now, quality: "good" });
      s.stations[i] = null; s.stats.cooked++;
      SS.questProgress("cook", recipe.id, 1);
      SS.addXp(Math.round(recipe.xp * 0.3));
      SS.audio.collect();
      SS.fx.toast("⚡ Rushed " + recipe.name + "!");
      if (pt) SS.fx.floatText(pt.x, pt.y, recipe.emoji + " done!");
    }
    SS.checkAchievements(); SS.saveGame(); SS.render();
    return true;
  };

  SS.discardDish = function (idx) {
    var s = S();
    if (!s.plated[idx]) return;
    s.plated.splice(idx, 1);
    SS.audio.tap(); SS.saveGame(); SS.render();
  };

  /* ---------- dining ---------- */
  function takeDish(recipeId) {
    var s = S(), best = -1, bestScore = -1, now = Date.now();
    s.plated.forEach(function (d, i) {
      if (d.recipeId !== recipeId) return;
      var q = SS.dishQuality(d, now);
      var score = q === "perfect" ? 3 : (q === "good" ? 2 : 1);
      if (score > bestScore) { bestScore = score; best = i; }
    });
    if (best < 0) return null;
    var dish = s.plated[best];
    s.plated.splice(best, 1);
    return { dish: dish, quality: SS.dishQuality(dish, now) };
  }

  SS.serveTable = function (i, pt) {
    var s = S(), t = s.tables[i];
    if (!t || t.exiting) return false;
    var taken = takeDish(t.recipeId);
    if (!taken) return false;
    var recipe = SS.recipeDef(t.recipeId), type = SS.guestType(t.type), now = Date.now();
    var earned = SS.computeEarn(recipe, t, taken.quality);
    var usedPct = (now - t.arrivedAt) / t.patienceMs;
    var tip = 0;
    if (s.upgrades.tipjar && usedPct < 0.4) tip = Math.max(1, Math.round(earned * 0.1));
    var critic = t.type === "critic";
    var repGain = type.rep;
    if (taken.quality === "perfect") repGain += 1;
    if (taken.quality === "cold") repGain = Math.max(0, repGain - 2);
    s.coins += earned + tip; s.stats.coinsEarned += earned + tip;
    SS.questProgress("earn", null, earned + tip);
    SS.questProgress("serve", null, 1);
    s.combo += critic ? 3 : 1;
    if (s.combo > s.stats.bestCombo) s.stats.bestCombo = s.combo;
    s.reputation = SS.clamp(s.reputation + repGain, 0, 9999);
    s.stats.served++;
    if (critic) s.stats.criticsServed++;
    t.exiting = "happy"; t.exitAt = now; t.earned = earned + tip; t.quality = taken.quality;
    SS.addXp(Math.round(recipe.xp * type.xp));
    var coinEl = document.getElementById("coins");
    if (critic) {
      SS.audio.critic(); SS.fx.flash("gold");
      SS.fx.toast("👑 The critic loved it! +" + earned + " 🪙 · +" + repGain + " reputation", "gold");
    } else {
      SS.audio.serve();
      if (tip) SS.fx.toast(t.name + " loved the " + recipe.name + " and tipped " + tip + " 🪙!");
    }
    if (pt) {
      SS.fx.hearts(pt.x, pt.y);
      SS.fx.floatText(pt.x, pt.y - 10, "+" + (earned + tip) + " 🪙" + (taken.quality === "perfect" ? " ✨" : (taken.quality === "cold" ? " (cold)" : "")), critic || taken.quality === "perfect" ? "gold" : "");
      SS.fx.flyTo(pt.x, pt.y, coinEl, "🪙", critic ? 6 : 3, function () { SS.audio.coin(); });
    }
    SS.checkAchievements(); SS.saveGame(); SS.render();
    return true;
  };

  /* ---------- shop ---------- */
  SS.buyExpansion = function (type) {
    var s = S(), cost;
    if (type === "plot") return SS.buyPlot();
    if (type === "station") {
      if (s.maxStations >= C.STATION_CAP) return false;
      cost = SS.stationCost(s.maxStations); if (s.coins < cost) return false;
      s.coins -= cost; s.maxStations++; s.stations.push(null);
      SS.fx.toast("🍳 New cooking station installed!");
    } else if (type === "table") {
      if (s.maxTables >= C.TABLE_CAP) return false;
      cost = SS.tableCost(s.maxTables); if (s.coins < cost) return false;
      s.coins -= cost; s.maxTables++; s.tables.push(null);
      SS.fx.toast("🪑 New table set!");
    } else return false;
    SS.audio.buy();
    SS.checkAchievements(); SS.saveGame(); SS.render();
    return true;
  };

  SS.buyUpgrade = function (id) {
    var s = S(), up = SS.upgradeDef(id);
    if (!up || s.upgrades[id] || s.coins < up.cost || up.unlockLevel > s.level) return false;
    s.coins -= up.cost; s.upgrades[id] = true;
    if (id === "sprinklers") s.plots.forEach(function (p) { if (p && !p.watered && !SS.plotReady(p)) { p.watered = true; p.readyAt -= Math.round((p.readyAt - p.plantedAt) * C.WATER_BONUS); } });
    if (id === "scarecrow") s.plots.forEach(function (p) { if (p && p.pest) { var paused = Date.now() - p.pestAt; p.plantedAt += paused; p.readyAt += paused; p.pest = false; } });
    SS.audio.buy(); SS.fx.confetti(10);
    SS.fx.toast(up.emoji + " " + up.name + " installed!", "gold");
    SS.saveGame(); SS.render();
    return true;
  };

  SS.hireStaff = function (role) {
    var s = S(), cost;
    if (role === "chef") {
      if (s.level < C.CHEF_UNLOCK_LEVEL || s.chefs >= C.MAX_STAFF) return false;
      cost = C.CHEF_BASE_COST + s.chefs * C.CHEF_COST_STEP; if (s.coins < cost) return false;
      s.coins -= cost; s.chefs++;
      SS.fx.toast("👨‍🍳 Hired a chef! Cooking is faster.");
    } else if (role === "server") {
      if (s.level < C.SERVER_UNLOCK_LEVEL || s.servers >= C.MAX_STAFF) return false;
      cost = C.SERVER_BASE_COST + s.servers * C.SERVER_COST_STEP; if (s.coins < cost) return false;
      s.coins -= cost; s.servers++;
      SS.fx.toast("🧑‍🍽️ Hired a server! Guests are happier.");
    } else return false;
    SS.audio.buy();
    SS.checkAchievements(); SS.saveGame(); SS.render();
    return true;
  };

  SS.doPrestige = function () {
    var s = S();
    if (!SS.prestigeReady()) return false;
    var fresh = SS.defaultState();
    fresh.prestige = s.prestige + 1;
    fresh.stats = s.stats;
    fresh.achievementsDone = s.achievementsDone;
    fresh.soundOn = s.soundOn; fresh.reduceMotion = s.reduceMotion;
    fresh.seenWelcome = true; fresh.tutorialDone = true;
    fresh.startedAt = s.startedAt;
    SS.state = fresh;
    SS.ensureQuests();
    SS.fx.confetti(30); SS.audio.levelUp(); SS.fx.flash("gold");
    SS.fx.toast("⭐ Prestige " + fresh.prestige + "! Permanent +" + Math.round(C.PRESTIGE_BONUS * 100 * fresh.prestige) + "% tips.", "gold");
    SS.checkAchievements(); SS.saveGame(true); SS.render();
    return true;
  };

  SS.restartGame = function () {
    SS.state = SS.defaultState();
    SS.ensureQuests();
    SS.saveGame(true); SS.render();
  };

  SS.toggleSound = function () { S().soundOn = !S().soundOn; if (S().soundOn) SS.audio.ensure(); SS.saveGame(); SS.render(); };
  SS.toggleMotion = function () { S().reduceMotion = !S().reduceMotion; document.body.classList.toggle("reduce-motion", S().reduceMotion); SS.saveGame(); SS.render(); };

  /* ---------- spawning ---------- */
  function spawnGuest(now) {
    var s = S();
    var empty = [];
    for (var j = 0; j < s.tables.length; j++) if (!s.tables[j]) empty.push(j);
    if (!empty.length) return;
    var slot = SS.pick(empty);
    var options = SS.RECIPES.filter(function (r) { return r.unlockLevel <= s.level; });
    var hasCritic = s.tables.some(function (t) { return t && t.type === "critic"; });
    var tier = SS.currentRepTier();
    var typeId = (!hasCritic && Math.random() < tier.criticChance) ? "critic" : SS.weighted(SS.GUEST_TYPES.filter(function (g) { return g.weight > 0; })).id;
    var type = SS.guestType(typeId);
    var recipe;
    if (typeId === "critic" || typeId === "foodie") {
      var sorted = options.slice().sort(function (a, b) { return b.value - a.value; });
      recipe = SS.pick(sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2))));
    } else if (typeId === "kid") {
      var cheap = options.slice().sort(function (a, b) { return a.value - b.value; });
      recipe = SS.pick(cheap.slice(0, Math.max(1, Math.ceil(cheap.length / 2))));
    } else {
      // Regulars lean toward dishes you can actually make right now.
      var makeable = options.filter(function (r) { return SS.platedCount(r.id) > 0 || SS.canCook(r); });
      recipe = (makeable.length && Math.random() < 0.6) ? SS.pick(makeable) : SS.pick(options);
    }
    s.ticketCounter++;
    s.tables[slot] = {
      ticketNo: s.ticketCounter,
      recipeId: recipe.id,
      type: typeId,
      name: typeId === "critic" ? "The Critic" : SS.pick(SS.GUEST_NAMES),
      seed: Math.floor(Math.random() * 1000),
      arrivedAt: now,
      patienceMs: Math.round(C.BASE_PATIENCE * type.patience * SS.patienceMult() * 1000),
      exiting: null
    };
    if (typeId === "critic") { SS.fx.toast("🎩 A food critic just sat down! Serve them fast.", "gold"); SS.audio.event(); }
  }

  /* ---------- weather, events, days ---------- */
  function rollWeather(now) {
    var s = S();
    var pool = SS.WEATHER.filter(function (w) { return w.id !== s.weather; });
    var w = SS.weighted(pool);
    s.weather = w.id;
    s.weatherUntil = now + SS.WEATHER_MIN_MS + Math.random() * (SS.WEATHER_MAX_MS - SS.WEATHER_MIN_MS);
    SS.fx.toast(w.emoji + " " + w.name + (w.id === "rain" ? " — crops grow faster, fewer guests." : w.id === "wind" ? " — crops grow slower, guests are restless." : w.id === "cloudy" ? " — a calm spell." : " — a bright day."));
  }

  function tickEvents(now) {
    var s = S();
    if (s.event && s.event.until <= now) { s.event = null; SS.fx.toast("The " + (SS.eventDef(s.eventLast) || { name: "event" }).name.toLowerCase() + " is over."); }
    if (!s.event && now >= s.nextEventAt) {
      var ev = SS.pick(SS.EVENTS);
      s.event = { id: ev.id, until: now + ev.duration }; s.eventLast = ev.id;
      s.nextEventAt = now + ev.duration + SS.EVENT_MIN_GAP + Math.random() * (SS.EVENT_MAX_GAP - SS.EVENT_MIN_GAP);
      SS.audio.event(); SS.fx.flash("blue");
      SS.fx.toast(ev.emoji + " " + ev.name + "! " + ev.desc, "event");
    }
  }

  /* ---------- the tick ---------- */
  SS.tick = function () {
    var s = S(), now = Date.now(), i;

    // day change
    var day = SS.dayNumber(now);
    if (s.lastDay !== day) {
      if (s.lastDay) {
        var season = SS.currentSeason(now);
        SS.fx.toast("🌅 Day " + day + " · " + season.emoji + " " + season.name + (season.boost.length ? " — in season: " + season.boost.map(function (id) { return SS.cropDef(id).emoji; }).join(" ") : ""));
      }
      s.lastDay = day;
    }

    if (now >= s.weatherUntil) rollWeather(now);
    tickEvents(now);
    SS.ensureQuests();

    // pests
    if (!s.upgrades.scarecrow) {
      for (i = 0; i < s.plots.length; i++) {
        var p = s.plots[i];
        if (p && !p.pest && !SS.plotReady(p, now) && SS.plotProgress(p, now) > 0.15 && Math.random() < C.PEST_CHANCE_PER_SEC) {
          p.pest = true; p.pestAt = now;
          SS.fx.toast("🐛 A pest is nibbling your " + SS.cropDef(p.cropId).name.toLowerCase() + "! Tap it to shoo it away.", "bad");
        }
      }
    }

    // guests: patience, exits, spawns
    for (i = 0; i < s.tables.length; i++) {
      var t = s.tables[i];
      if (!t) continue;
      if (!t.exiting && now - t.arrivedAt > t.patienceMs) {
        s.combo = 0;
        var forgive = s.level <= 3 ? 0.5 : 1;
        var loss = Math.round((t.type === "critic" ? 25 : 8) * forgive);
        s.reputation = SS.clamp(s.reputation - loss, 0, 9999);
        s.stats.walkouts++;
        SS.audio.walkout();
        SS.fx.toast(t.type === "critic" ? "👑 The critic walked out — bad review! -" + loss + " reputation" : t.name + " left hungry. -" + loss + " reputation", "bad");
        t.exiting = "sad"; t.exitAt = now;
      }
      if (t.exiting && now - t.exitAt >= C.EXIT_ANIM_MS) s.tables[i] = null;
    }
    if (now >= s.nextSpawnAt) {
      spawnGuest(now);
      s.nextSpawnAt = now + (7000 + Math.random() * 6000) * SS.spawnIntervalMult();
    }

    // wages
    if (now - s.lastWageAt >= C.WAGE_INTERVAL) {
      var wage = s.chefs * C.CHEF_WAGE + s.servers * C.SERVER_WAGE;
      if (wage > 0) {
        if (s.coins >= wage) { s.coins -= wage; SS.fx.toast("💸 Payday: " + wage + " 🪙 in wages paid."); }
        else if (s.chefs > 0) { s.chefs--; s.reputation = SS.clamp(s.reputation - 5, 0, 9999); SS.fx.toast("👨‍🍳 A chef quit — wages went unpaid!", "bad"); }
        else if (s.servers > 0) { s.servers--; s.reputation = SS.clamp(s.reputation - 5, 0, 9999); SS.fx.toast("🧑‍🍽️ A server quit — wages went unpaid!", "bad"); }
      }
      s.lastWageAt = now;
    }

    SS.checkAchievements();
    SS.saveGame();
    SS.render();
  };

  /* ---------- offline return ---------- */
  SS.applyOfflineReturn = function () {
    var s = S(), now = Date.now();
    var away = now - (s.lastSeenAt || now);
    if (away < 45000) return null;
    var summary = { away: away, cropsReady: 0, dishesReady: 0, guestsSent: 0 };
    s.plots.forEach(function (p) { if (p && SS.plotReady(p, now)) summary.cropsReady++; });
    s.stations.forEach(function (st) { if (st && SS.stationReady(st, now)) summary.dishesReady++; });
    for (var i = 0; i < s.tables.length; i++) { if (s.tables[i]) { summary.guestsSent++; s.tables[i] = null; } }
    // Pests can't eat while you're away, and nobody fires staff for a closed shift.
    s.plots.forEach(function (p) { if (p && p.pest) { var paused = now - p.pestAt; p.plantedAt += paused; p.readyAt += paused; p.pest = false; } });
    s.lastWageAt = now;
    s.nextSpawnAt = now + 4000;
    s.weatherUntil = Math.max(s.weatherUntil, now + 30000);
    if (s.event && s.event.until < now) s.event = null;
    s.nextEventAt = Math.max(s.nextEventAt, now + 60000);
    s.combo = 0;
    return summary;
  };
})(window.SS = window.SS || {});
