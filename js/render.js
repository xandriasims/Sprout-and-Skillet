/* Sprout & Skillet — DOM rendering. Slots are diffed by signature so CSS animations keep running. */
(function (SS) {
  "use strict";
  var esc = SS.esc;
  SS.currentTab = "garden";
  function S() { return SS.state; }
  function $(id) { return document.getElementById(id); }

  function syncSlots(container, n, cls) {
    while (container.children.length < n) { var d = document.createElement("div"); d.className = cls; container.appendChild(d); }
    while (container.children.length > n) container.removeChild(container.lastChild);
  }
  function pctClass(used) { return used < 0.5 ? "" : (used < 0.8 ? "amber" : "red"); }
  function fmtSecs(s) { return s >= 60 ? Math.floor(s / 60) + "m " + (s % 60) + "s" : s + "s"; }

  /* ---------- sky & day/night ---------- */
  var SKY = [
    { p: 0.00, top: "#F7A57C", bot: "#FFD9A8", dim: 0.10 },
    { p: 0.12, top: "#7EC8F0", bot: "#D3EDFF", dim: 0 },
    { p: 0.50, top: "#5FB2EA", bot: "#BFE3FF", dim: 0 },
    { p: 0.62, top: "#F58A5C", bot: "#FFC48C", dim: 0.06 },
    { p: 0.72, top: "#1A2550", bot: "#3B4A7A", dim: 0.22 },
    { p: 0.92, top: "#1A2550", bot: "#3B4A7A", dim: 0.22 },
    { p: 1.00, top: "#F7A57C", bot: "#FFD9A8", dim: 0.10 }
  ];
  function hexLerp(a, b, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    var g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    var bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  function renderSky() {
    var p = SS.dayProgress();
    var i = 0; while (i < SKY.length - 2 && SKY[i + 1].p <= p) i++;
    var a = SKY[i], b = SKY[i + 1], t = (p - a.p) / (b.p - a.p);
    var sky = $("sky");
    sky.style.setProperty("--sky-top", hexLerp(a.top, b.top, t));
    sky.style.setProperty("--sky-bot", hexLerp(a.bot, b.bot, t));
    $("night-dim").style.opacity = (a.dim * (1 - t) + b.dim * t).toFixed(3);
    var night = SS.isNight();
    document.body.classList.toggle("night", night);
    var sun = $("sun"), moon = $("moon");
    var dayPart = SS.clamp((p - 0.02) / 0.64, 0, 1);
    sun.style.display = p >= 0.02 && p <= 0.66 ? "" : "none";
    sun.style.left = (4 + dayPart * 88) + "%";
    sun.style.top = (46 - Math.sin(dayPart * Math.PI) * 40) + "%";
    var nightPart = SS.clamp((p - 0.7) / 0.3, 0, 1);
    moon.style.display = p > 0.68 ? "" : "none";
    moon.style.left = (4 + nightPart * 88) + "%";
    moon.style.top = (46 - Math.sin(nightPart * Math.PI) * 40) + "%";
    var w = S().weather;
    document.body.setAttribute("data-weather", w);
  }

  /* ---------- top bar & strips ---------- */
  function renderTopbar() {
    var s = S();
    $("coins-value").textContent = s.coins.toLocaleString();
    $("level-badge").textContent = "Lv " + s.level;
    $("xp-fill").style.width = Math.min(100, (s.xp / SS.xpForLevel(s.level)) * 100) + "%";
    $("xp-label").textContent = s.xp + " / " + SS.xpForLevel(s.level) + " xp";
    var pb = $("prestige-badge");
    pb.style.display = s.prestige > 0 ? "" : "none";
    pb.textContent = "⭐×" + s.prestige;
    var season = SS.currentSeason(), w = SS.weather();
    $("day-chip").textContent = "Day " + SS.dayNumber() + " · " + season.emoji + " " + season.name;
    $("weather-chip").textContent = w.emoji + " " + w.name;
    var tier = SS.currentRepTier();
    document.body.className = document.body.className.replace(/\btier-\w+/g, "").trim() + " tier-" + tier.name.toLowerCase();
  }

  function renderStatus() {
    var s = S(), tier = SS.currentRepTier(), next = SS.nextRepTier();
    $("rep-icon").textContent = tier.emoji;
    $("rep-name").textContent = tier.name + " · " + s.reputation;
    var pct = next ? ((s.reputation - tier.min) / (next.min - tier.min)) * 100 : 100;
    var fill = $("rep-fill"); fill.style.width = SS.clamp(pct, 0, 100) + "%"; fill.style.background = tier.color;
    var combo = $("combo-badge");
    combo.classList.toggle("show", s.combo >= 2);
    $("combo-count").textContent = "x" + SS.comboMult().toFixed(2) + " · " + s.combo + " streak";
    var ev = SS.activeEvent(), banner = $("event-banner");
    if (ev) {
      var left = Math.max(0, Math.ceil((s.event.until - Date.now()) / 1000));
      banner.style.display = "flex";
      banner.innerHTML = '<span class="ev-emoji">' + ev.emoji + '</span><span class="ev-text"><b>' + esc(ev.name) + '</b> ' + esc(ev.desc) + '</span><span class="ev-time">' + left + 's</span>';
      banner.className = "ev-" + ev.id;
    } else banner.style.display = "none";
  }

  function renderRail() {
    var s = S(), html = "", any = false, now = Date.now();
    for (var i = 0; i < s.tables.length; i++) {
      var t = s.tables[i];
      if (!t || t.exiting) continue;
      any = true;
      var recipe = SS.recipeDef(t.recipeId), used = (now - t.arrivedAt) / t.patienceMs;
      var secs = Math.max(0, Math.ceil((t.patienceMs - (now - t.arrivedAt)) / 1000));
      var ready = SS.platedCount(t.recipeId) > 0;
      var type = SS.guestType(t.type);
      html += '<button class="rail-chip' + (t.type === "critic" ? " critic" : "") + (ready ? " ready" : "") + '" ' +
        (ready ? 'data-action="serve" data-table="' + i + '"' : 'data-action="switch-tab" data-tab="dining"') + ' title="' + esc(t.name) + ' wants ' + esc(recipe.name) + '">' +
        '<span class="icons">' + type.emoji + recipe.emoji + '</span>' +
        '<span class="rail-info"><span class="mini-track"><span class="mini-fill ' + pctClass(used) + '" style="width:' + ((1 - used) * 100) + '%"></span></span>' +
        '<span class="rail-time' + (secs < 15 ? " low" : "") + '">⏱ ' + secs + 's</span></span>' +
        (ready ? '<span class="rail-check">✓</span>' : "") + '</button>';
    }
    $("ticket-rail").innerHTML = any ? html : '<span class="empty-note">No open orders — the dining room is quiet.</span>';
  }

  function setBadge(id, n) { var el = $(id); el.style.display = n > 0 ? "flex" : "none"; el.textContent = n > 9 ? "9+" : String(n); }
  function renderBadges() {
    setBadge("badge-garden", SS.countReadyPlots() + SS.countPests());
    setBadge("badge-kitchen", SS.countReadyStations());
    setBadge("badge-dining", SS.countServable());
  }

  function renderTutorial() {
    var s = S(), el = $("tutorial-banner");
    if (s.tutorialDone) { el.style.display = "none"; return; }
    while (s.tutorialStep < SS.TUTORIAL_STEPS.length && SS.TUTORIAL_STEPS[s.tutorialStep].check(s)) s.tutorialStep++;
    if (s.tutorialStep >= SS.TUTORIAL_STEPS.length) {
      s.tutorialDone = true; el.style.display = "none";
      SS.fx.toast("🎉 You've got the hang of it! Keep the guests happy.", "gold"); SS.fx.confetti(12);
      SS.saveGame(); return;
    }
    var step = SS.TUTORIAL_STEPS[s.tutorialStep];
    el.style.display = "flex";
    el.innerHTML = '<span class="tutorial-dot">' + (s.tutorialStep + 1) + '/' + SS.TUTORIAL_STEPS.length + '</span>' +
      '<button class="tutorial-text" data-action="switch-tab" data-tab="' + step.tab + '">' + esc(step.text) + '</button>' +
      '<button class="tutorial-skip" data-action="skip-tutorial">Skip</button>';
  }

  /* ---------- garden ---------- */
  function plotSig(p, now) {
    if (!p) return "empty";
    var prog = SS.plotProgress(p, now);
    return p.cropId + "-" + SS.cropStage(prog) + (p.watered ? "-w" : "") + (p.pest ? "-pest" : "") + (SS.plotReady(p, now) ? "-ready" : "");
  }
  function buildPlot(p, i, now) {
    if (!p) return '<button class="tile empty" data-action="plant-open" data-plot="' + i + '"><div class="tile-soil"></div><div class="tile-plus">＋</div><div class="tile-label">Plant</div></button>';
    var crop = SS.cropDef(p.cropId), prog = SS.plotProgress(p, now), stage = SS.cropStage(prog);
    var ready = SS.plotReady(p, now);
    var sprite = SS.cropSvg(crop, stage, { watered: p.watered, pest: p.pest });
    if (ready) return '<button class="tile ready" data-action="harvest" data-plot="' + i + '">' + sprite + '<div class="tile-label">Harvest ' + esc(crop.name) + '</div><span class="ready-tag">✓</span></button>';
    if (p.pest) return '<button class="tile pest" data-action="shoo" data-plot="' + i + '">' + sprite + '<div class="tile-label">Shoo the pest!</div></button>';
    return '<button class="tile growing' + (p.watered ? " watered" : "") + '" data-action="water" data-plot="' + i + '">' + sprite +
      '<div class="tile-meta"><span class="tile-label">' + esc(crop.name) + (SS.inSeason(p.cropId) ? ' <i class="season-tag" title="In season">' + SS.currentSeason().emoji + '</i>' : "") + '</span><span class="tile-time">' + fmtSecs(SS.plotSecsLeft(p, now)) + '</span></div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + (prog * 100) + '%"></div></div>' +
      '<div class="tile-sub">' + (p.watered ? "💧 watered" : "tap to water") + '</div></button>';
  }
  function renderGarden() {
    var s = S(), now = Date.now();
    $("harvest-all-btn").style.display = SS.countReadyPlots() > 1 ? "" : "none";
    var season = SS.currentSeason(), w = SS.weather();
    $("garden-info").innerHTML =
      '<span class="chip">' + season.emoji + ' ' + esc(season.name) + ' · in season: ' + season.boost.filter(function (id) { return SS.cropDef(id).unlockLevel <= s.level; }).map(function (id) { return SS.cropDef(id).emoji; }).join(" ") + '</span>' +
      '<span class="chip">' + w.emoji + ' ' + esc(w.name) + (w.grow < 1 ? " · crops +" + Math.round((1 / w.grow - 1) * 100) + "% faster" : (w.grow > 1 ? " · crops slower" : "")) + '</span>' +
      (s.upgrades.sprinklers ? '<span class="chip">💦 Sprinklers on</span>' : "") + (s.upgrades.scarecrow ? '<span class="chip">🎃 Scarecrow on duty</span>' : "");
    var grid = $("garden-grid");
    var extra = s.maxPlots < SS.C.PLOT_CAP ? 1 : 0;
    syncSlots(grid, s.plots.length + extra, "plot-slot");
    for (var i = 0; i < s.plots.length; i++) {
      var slot = grid.children[i], p = s.plots[i], sig = plotSig(p, now);
      if (slot.getAttribute("data-sig") !== sig) { slot.setAttribute("data-sig", sig); slot.innerHTML = buildPlot(p, i, now); }
      else if (p && !SS.plotReady(p, now) && !p.pest) {
        var fill = slot.querySelector(".progress-fill"); if (fill) fill.style.width = (SS.plotProgress(p, now) * 100) + "%";
        var tm = slot.querySelector(".tile-time"); if (tm) tm.textContent = fmtSecs(SS.plotSecsLeft(p, now));
      }
    }
    if (extra) {
      var tillSlot = grid.children[s.plots.length], cost = SS.plotCost(s.maxPlots);
      var tsig = "till-" + cost + "-" + (s.coins >= cost);
      if (tillSlot.getAttribute("data-sig") !== tsig) {
        tillSlot.setAttribute("data-sig", tsig);
        tillSlot.innerHTML = '<button class="tile untilled" data-action="till-land" ' + (s.coins < cost ? "disabled" : "") + '><div class="tile-plus">🪵</div><div class="tile-label">Till Land</div><div class="tile-sub">' + cost + ' 🪙</div></button>';
      }
    }
    // basket summary
    var basket = "";
    SS.CROPS.forEach(function (c) { var n = s.pantry[c.id] || 0; if (n > 0) basket += '<span class="chip small">' + c.emoji + ' ' + n + '</span>'; });
    $("garden-basket").innerHTML = basket || '<span class="hint-inline">Your basket is empty — harvest something!</span>';
  }

  /* ---------- kitchen ---------- */
  function stationSig(st, now) {
    if (!st) return "empty";
    return st.recipeId + (SS.stationReady(st, now) ? "-ready" : "-cooking");
  }
  function buildStation(st, i, now) {
    var variant = i % 3;
    if (!st) return '<button class="station idle" data-action="station-open" data-station="' + i + '">' + SS.chefSvg(false, "stove", variant) + SS.applianceHtml("stove", "idle") + '<div class="station-label">Station ' + (i + 1) + '<br><small>tap to cook</small></div></button>';
    var recipe = SS.recipeDef(st.recipeId);
    if (SS.stationReady(st, now)) {
      return '<button class="station ready" data-action="collect" data-station="' + i + '">' + SS.chefSvg(false, recipe.method, variant) + SS.applianceHtml(recipe.method, "done") +
        '<div class="dish-float">' + recipe.emoji + '</div><div class="station-label">' + esc(recipe.name) + '<br><small class="perfect-hint">✨ collect now!</small></div><span class="ready-tag">✓</span></button>';
    }
    var prog = SS.stationProgress(st, now);
    return '<button class="station cooking" data-action="station-open" data-station="' + i + '" style="--pct:' + (prog * 100) + '%">' + SS.chefSvg(true, recipe.method, variant) + SS.applianceHtml(recipe.method, "cooking") +
      '<div class="ring"><div class="ring-inner">' + recipe.emoji + '</div></div>' +
      '<div class="station-label">' + esc(recipe.name) + '<br><small class="station-time">' + fmtSecs(SS.stationSecsLeft(st, now)) + '</small></div></button>';
  }
  function renderKitchen() {
    var s = S(), now = Date.now();
    $("collect-all-btn").style.display = SS.countReadyStations() > 1 ? "" : "none";
    var pantry = "";
    SS.CROPS.filter(function (c) { return c.unlockLevel <= s.level; }).forEach(function (c) {
      var n = s.pantry[c.id] || 0;
      pantry += '<div class="tray' + (n < 1 ? " empty" : "") + '" title="' + esc(c.name) + '"><span class="tray-emoji">' + c.emoji + '</span><span class="tray-count">' + n + '</span></div>';
    });
    $("pantry-strip").innerHTML = pantry;
    var grid = $("stations-grid");
    syncSlots(grid, s.stations.length, "station-slot");
    for (var i = 0; i < s.stations.length; i++) {
      var slot = grid.children[i], st = s.stations[i], sig = stationSig(st, now);
      if (slot.getAttribute("data-sig") !== sig) { slot.setAttribute("data-sig", sig); slot.innerHTML = buildStation(st, i, now); }
      else if (st && !SS.stationReady(st, now)) {
        var node = slot.firstChild; node.style.setProperty("--pct", (SS.stationProgress(st, now) * 100) + "%");
        var tm = slot.querySelector(".station-time"); if (tm) tm.textContent = fmtSecs(SS.stationSecsLeft(st, now));
      }
    }
    var pass = $("pass-strip");
    var psig = s.plated.map(function (d) { return d.recipeId + ":" + SS.dishQuality(d, now); }).join(",") + "|" + (s.upgrades.warmer ? "w" : "");
    if (pass.getAttribute("data-sig") !== psig) {
      pass.setAttribute("data-sig", psig);
      var html = "";
      s.plated.forEach(function (d, idx) {
        var r = SS.recipeDef(d.recipeId), q = SS.dishQuality(d, now);
        var wanted = s.tables.some(function (t) { return t && !t.exiting && t.recipeId === d.recipeId; });
        html += '<div class="plate ' + q + (wanted ? " wanted" : "") + '" title="' + esc(r.name) + ' (' + q + ')">' +
          '<span class="plate-emoji">' + r.emoji + '</span><span class="plate-q">' + (q === "perfect" ? "✨" : (q === "cold" ? "🧊" : "")) + '</span>' +
          '<span class="plate-name">' + esc(r.name) + '</span>' +
          (wanted ? '<span class="plate-wanted">wanted</span>' : '<button class="plate-x" data-action="discard" data-dish="' + idx + '" title="Discard">×</button>') + '</div>';
      });
      pass.innerHTML = html || '<span class="hint-inline">Nothing on the pass yet. Dishes go cold after ' + Math.round(SS.C.COLD_AFTER_MS / 1000) + 's' + (s.upgrades.warmer ? " — but your plate warmer keeps them hot." : ".") + '</span>';
    }
  }

  /* ---------- dining ---------- */
  function moodFor(used) { return used < 0.45 ? "wait" : (used < 0.8 ? "anxious" : "anxious"); }
  function moodLabel(used) { return used < 0.4 ? "😊 Happy" : (used < 0.7 ? "😐 Waiting" : (used < 0.9 ? "😟 Anxious" : "😡 Fuming")); }
  function tableSig(t, now) {
    if (!t) return "empty";
    if (t.exiting) return t.ticketNo + "-exit-" + t.exiting;
    return t.ticketNo + "-" + moodFor((now - t.arrivedAt) / t.patienceMs);
  }
  function buildTable(t, i, now, fresh) {
    if (!t) return '<div class="table-card empty"><div class="table-top"><div class="table-round"></div></div><div class="table-empty">Table ' + (i + 1) + ' is free</div></div>';
    var recipe = SS.recipeDef(t.recipeId), type = SS.guestType(t.type);
    var used = (now - t.arrivedAt) / t.patienceMs;
    var mood = t.exiting === "happy" ? "happy" : (t.exiting === "sad" ? "sad" : moodFor(used));
    var wrap = t.exiting === "happy" ? "exit-happy" : (t.exiting === "sad" ? "exit-sad" : ("seated" + (fresh ? " walk-in" : "")));
    var have = SS.platedCount(t.recipeId), canCook = SS.canCook(recipe);
    var secs = Math.max(0, Math.ceil((t.patienceMs - (now - t.arrivedAt)) / 1000));
    var ings = "";
    for (var k in recipe.ingredients) {
      var c = SS.cropDef(k), short = (S().pantry[k] || 0) < recipe.ingredients[k];
      ings += '<span class="ing' + (short ? " short" : "") + '">' + c.emoji + '<b>' + recipe.ingredients[k] + '</b></span>';
    }
    var status = t.exiting === "happy" ? '<span class="served-tag">+' + t.earned + ' 🪙' + (t.quality === "perfect" ? " ✨" : "") + '</span>'
      : t.exiting === "sad" ? '<span class="left-tag">left hungry</span>'
      : (have ? '<button class="btn serve" data-action="serve" data-table="' + i + '">🍽️ Serve</button>'
        : (canCook ? '<button class="btn ghost" data-action="switch-tab" data-tab="kitchen">Cook it</button>' : '<span class="need-tag">need ingredients</span>'));
    return '<div class="table-card' + (t.type === "critic" ? " critic" : "") + (have && !t.exiting ? " servable" : "") + '">' +
      '<div class="table-top"><div class="table-round"><span class="table-no">' + (i + 1) + '</span></div>' +
        '<div class="guest-wrap ' + wrap + '">' + SS.guestSvg(t, mood) + '</div>' +
        (t.exiting ? "" : '<div class="order-bubble' + (have ? " ready" : "") + '"><span class="order-dish">' + recipe.emoji + '</span>' + (have ? '<span class="bubble-check">✓</span>' : "") + '</div>') +
      '</div>' +
      '<div class="table-info">' +
        '<div class="guest-line"><b>' + esc(t.name) + '</b> <span class="guest-type">' + type.emoji + ' ' + esc(type.name) + '</span>' + (t.type === "critic" ? ' <span class="critic-flag">VIP</span>' : "") + '</div>' +
        '<div class="order-line">wants <b>' + esc(recipe.name) + '</b> · ' + recipe.value + ' 🪙 <span class="ings">' + ings + '</span></div>' +
        (t.exiting ? "" : '<div class="mood-row"><span class="mood-tag">' + moodLabel(used) + '</span><span class="time-tag' + (secs < 15 ? " low" : "") + '">⏱ ' + secs + 's</span></div>' +
          '<div class="progress-track"><div class="progress-fill ' + pctClass(used) + '" style="width:' + ((1 - used) * 100) + '%"></div></div>') +
      '</div><div class="table-action">' + status + '</div></div>';
  }
  function renderDining() {
    var s = S(), now = Date.now();
    var list = $("tables-grid");
    syncSlots(list, s.tables.length, "table-slot");
    for (var i = 0; i < s.tables.length; i++) {
      var slot = list.children[i], t = s.tables[i], sig = tableSig(t, now);
      if (slot.getAttribute("data-sig") !== sig) { var fresh = t && !t.exiting && slot.getAttribute("data-sig") === "empty"; slot.setAttribute("data-sig", sig); slot.innerHTML = buildTable(t, i, now, fresh); }
      else if (t && !t.exiting) {
        var used = (now - t.arrivedAt) / t.patienceMs, secs = Math.max(0, Math.ceil((t.patienceMs - (now - t.arrivedAt)) / 1000));
        var fill = slot.querySelector(".progress-fill"); if (fill) { fill.style.width = ((1 - used) * 100) + "%"; fill.className = "progress-fill " + pctClass(used); }
        var mt = slot.querySelector(".mood-tag"); if (mt) mt.textContent = moodLabel(used);
        var tt = slot.querySelector(".time-tag"); if (tt) { tt.textContent = "⏱ " + secs + "s"; tt.classList.toggle("low", secs < 15); }
        var have = SS.platedCount(t.recipeId), card = slot.querySelector(".table-card");
        var wasServable = card.classList.contains("servable");
        if (!!have !== wasServable) { slot.setAttribute("data-sig", ""); renderDining(); return; }
      }
    }
    var wait = Math.max(0, Math.ceil((s.nextSpawnAt - now) / 1000));
    var free = s.tables.filter(function (t) { return !t; }).length;
    $("dining-info").innerHTML = '<span class="chip">🪑 ' + free + ' free table' + (free === 1 ? "" : "s") + '</span>' +
      (free ? '<span class="chip">🚶 next guest in ~' + wait + 's</span>' : '<span class="chip">🔥 full house!</span>') +
      '<span class="chip">' + SS.currentRepTier().emoji + ' critic chance ' + Math.round(SS.currentRepTier().criticChance * 100) + '%</span>';
  }

  /* ---------- shop ---------- */
  function card(title, sub, action, extraCls) {
    return '<div class="shop-card' + (extraCls ? " " + extraCls : "") + '"><div class="shop-body"><h3>' + title + '</h3><p>' + sub + '</p></div><div class="shop-action">' + action + '</div></div>';
  }
  function renderShop() {
    var s = S(), C = SS.C;
    var stCost = SS.stationCost(s.maxStations), tbCost = SS.tableCost(s.maxTables), plCost = SS.plotCost(s.maxPlots);
    $("expand-list").innerHTML =
      card("🪵 Garden Plot", s.maxPlots + " / " + C.PLOT_CAP + " tilled", s.maxPlots >= C.PLOT_CAP ? '<span class="tag">Max</span>' : '<button class="btn" data-action="buy-expand" data-type="plot" ' + (s.coins < plCost ? "disabled" : "") + '>' + plCost + ' 🪙</button>') +
      card("🍳 Cooking Station", s.maxStations + " / " + C.STATION_CAP + " installed", s.maxStations >= C.STATION_CAP ? '<span class="tag">Max</span>' : '<button class="btn" data-action="buy-expand" data-type="station" ' + (s.coins < stCost ? "disabled" : "") + '>' + stCost + ' 🪙</button>') +
      card("🪑 Dining Table", s.maxTables + " / " + C.TABLE_CAP + " set", s.maxTables >= C.TABLE_CAP ? '<span class="tag">Max</span>' : '<button class="btn" data-action="buy-expand" data-type="table" ' + (s.coins < tbCost ? "disabled" : "") + '>' + tbCost + ' 🪙</button>');

    function staff(emoji, label, count, cost, wage, unlock, role, effect) {
      var locked = s.level < unlock, max = count >= C.MAX_STAFF;
      var act = locked ? '<span class="tag">Lv ' + unlock + '</span>' : (max ? '<span class="tag">Max</span>' : '<button class="btn" data-action="hire-staff" data-role="' + role + '" ' + (s.coins < cost ? "disabled" : "") + '>' + cost + ' 🪙</button>');
      return card(emoji + " " + label + ' <span class="count">' + count + "/" + C.MAX_STAFF + "</span>", effect + " · wage " + wage + " 🪙/shift", act, locked ? "locked" : "");
    }
    var wage = s.chefs * C.CHEF_WAGE + s.servers * C.SERVER_WAGE;
    $("staff-list").innerHTML =
      staff("👨‍🍳", "Chef", s.chefs, C.CHEF_BASE_COST + s.chefs * C.CHEF_COST_STEP, C.CHEF_WAGE, C.CHEF_UNLOCK_LEVEL, "chef", "-8% cook time each") +
      staff("🧑‍🍽️", "Server", s.servers, C.SERVER_BASE_COST + s.servers * C.SERVER_COST_STEP, C.SERVER_WAGE, C.SERVER_UNLOCK_LEVEL, "server", "+10% patience, +5% tips each") +
      (wage > 0 ? '<p class="hint">💸 Next payday in ' + Math.max(0, Math.ceil((C.WAGE_INTERVAL - (Date.now() - s.lastWageAt)) / 1000)) + 's — ' + wage + ' 🪙 owed. Keep that much on hand or someone walks.</p>' : "");

    var up = "";
    SS.UPGRADES.forEach(function (u) {
      var owned = !!s.upgrades[u.id], locked = u.unlockLevel > s.level;
      up += card(u.emoji + " " + esc(u.name), esc(u.desc), owned ? '<span class="tag owned">Owned</span>' : (locked ? '<span class="tag">Lv ' + u.unlockLevel + '</span>' : '<button class="btn accent" data-action="buy-upgrade" data-id="' + u.id + '" ' + (s.coins < u.cost ? "disabled" : "") + '>' + u.cost + ' 🪙</button>'), owned ? "owned" : (locked ? "locked" : ""));
    });
    $("upgrades-list").innerHTML = up;

    var r = C.PRESTIGE_REQ, ready = SS.prestigeReady();
    var checks = [["Level " + r.level, s.level, r.level], [r.plots + " plots", s.maxPlots, r.plots], [r.stations + " stations", s.maxStations, r.stations], [r.tables + " tables", s.maxTables, r.tables]];
    $("prestige-card").innerHTML = '<div class="shop-card prestige"><div class="shop-body"><h3>⭐ Prestige ' + s.prestige + ' · +' + Math.round((SS.prestigeMult() - 1) * 100) + '% tips</h3>' +
      checks.map(function (c) { return '<p>' + (c[1] >= c[2] ? "✅" : "⬜") + " " + c[0] + " (" + c[1] + "/" + c[2] + ")</p>"; }).join("") +
      '</div><div class="shop-action"><button class="btn accent" data-action="do-prestige" ' + (ready ? "" : "disabled") + '>Retire & Reopen</button></div></div>';
  }

  /* ---------- goals ---------- */
  function renderGoals() {
    var s = S();
    var q = "";
    var canReroll = s.rerollDay !== SS.dayNumber();
    s.quests.forEach(function (quest) {
      var pct = Math.min(100, (quest.progress / quest.n) * 100);
      q += '<div class="quest"><div class="quest-emoji">' + quest.emoji + '</div><div class="quest-body"><b>' + esc(quest.label) + '</b>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div><small>' + quest.progress + ' / ' + quest.n + ' · reward ' + quest.reward.coins + ' 🪙 + ' + quest.reward.xp + ' xp</small></div>' +
        (canReroll ? '<button class="btn ghost small" data-action="reroll-quest" data-quest="' + quest.id + '" title="Swap this order (once a day)">🔄</button>' : "") + '</div>';
    });
    $("quests-list").innerHTML = q;
    var a = "";
    SS.ACHIEVEMENTS.forEach(function (ach) {
      var done = !!s.achievementsDone[ach.id], prog = Math.min(ach.target, SS.achievementProgress(ach));
      a += '<div class="shop-card' + (done ? " owned" : "") + '"><div class="shop-body"><h3>' + ach.emoji + ' ' + esc(ach.name) + (done ? " ✅" : "") + '</h3><p>' + esc(ach.desc) + '</p>' +
        (done ? "" : '<div class="progress-track"><div class="progress-fill" style="width:' + (prog / ach.target * 100) + '%"></div></div><p>' + prog + ' / ' + ach.target + '</p>') +
        '</div><div class="shop-action"><span class="tag' + (done ? " owned" : "") + '">' + (done ? "Done" : "+" + ach.reward.coins + " 🪙") + '</span></div></div>';
    });
    $("achievements-list").innerHTML = a;
    var st = s.stats;
    var mins = Math.round((Date.now() - s.startedAt) / 60000);
    $("stats-list").innerHTML = [["🌱 Crops harvested", st.harvested], ["💧 Crops watered", st.watered], ["🐛 Pests shooed", st.pests], ["🍳 Dishes cooked", st.cooked], ["✨ Perfect plates", st.perfect], ["🔥 Dishes burnt", st.burnt],
      ["🍽️ Guests served", st.served], ["🎩 Critics impressed", st.criticsServed], ["😡 Walkouts", st.walkouts], ["🌶️ Best streak", st.bestCombo], ["📜 Orders completed", st.quests], ["🪙 Lifetime coins", st.coinsEarned.toLocaleString()], ["⏱ Time played", mins + " min"]]
      .map(function (r) { return '<div class="stat"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join("");
  }

  /* ---------- main render ---------- */
  SS.render = function () {
    if (!S()) return;
    renderSky(); renderTopbar(); renderStatus(); renderRail(); renderBadges(); renderTutorial();
    var tab = SS.currentTab;
    if (tab === "garden") renderGarden();
    else if (tab === "kitchen") renderKitchen();
    else if (tab === "dining") renderDining();
    else if (tab === "shop") renderShop();
    else if (tab === "goals") renderGoals();
    if (SS.modalRefresh) SS.modalRefresh();
  };

  SS.switchTab = function (tab) {
    SS.currentTab = tab;
    document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === tab); });
    document.querySelectorAll(".view").forEach(function (v) {
      var on = v.id === "view-" + tab;
      if (on && !v.classList.contains("active")) { v.classList.add("enter"); setTimeout(function () { v.classList.remove("enter"); }, 350); }
      v.classList.toggle("active", on);
    });
    SS.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- modals ---------- */
  SS.modalRefresh = null;
  SS.openModal = function (title, bodyHtml, opts) {
    opts = opts || {};
    $("modal-title").innerHTML = title;
    $("modal-body").innerHTML = bodyHtml;
    $("modal-close").textContent = opts.closeText || "Close";
    var ov = $("modal-overlay");
    ov.classList.add("open");
    ov.setAttribute("data-kind", opts.kind || "");
    SS.modalRefresh = opts.refresh || null;
  };
  SS.closeModal = function () { $("modal-overlay").classList.remove("open"); SS.modalRefresh = null; };

  SS.ui = {
    plant: function (i) {
      var s = S();
      var html = "";
      SS.CROPS.forEach(function (c) {
        var locked = c.unlockLevel > s.level, cost = SS.seedCost(c), can = !locked && s.coins >= cost;
        var secs = Math.round(c.growTime * SS.growMult(c.id));
        html += '<button class="option' + (locked ? " locked" : "") + '" data-action="plant-choose" data-plot="' + i + '" data-crop="' + c.id + '" ' + (can ? "" : "disabled") + '>' +
          '<span class="opt-icon">' + (locked ? "🔒" : c.emoji) + '</span><span class="opt-body"><b>' + esc(c.name) + (locked ? " · Lv " + c.unlockLevel : "") + (SS.inSeason(c.id) && !locked ? ' <i class="season-tag">' + SS.currentSeason().emoji + ' in season</i>' : "") + '</b>' +
          '<small>' + (locked ? "Unlocks at level " + c.unlockLevel : cost + " 🪙 · ready in " + fmtSecs(secs) + " · yields " + c.yield) + '</small></span>' +
          (SS.activeEvent() && SS.activeEvent().id === "market" && !locked ? '<span class="sale">½ price</span>' : "") + '</button>';
      });
      SS.openModal("🌱 Plant a seed", html, { kind: "plant" });
    },
    station: function (i) {
      var s = S(), st = s.stations[i];
      if (!st) {
        var html = "";
        SS.RECIPES.forEach(function (r) {
          var locked = r.unlockLevel > s.level, can = !locked && SS.canCook(r), ings = "";
          for (var k in r.ingredients) { var have = s.pantry[k] || 0, need = r.ingredients[k]; ings += '<span class="ing' + (have < need ? " short" : "") + '">' + SS.cropDef(k).emoji + '<b>' + have + '/' + need + '</b></span>'; }
          var wanted = s.tables.filter(function (t) { return t && !t.exiting && t.recipeId === r.id; }).length;
          html += '<button class="option' + (locked ? " locked" : "") + (wanted ? " wanted" : "") + '" data-action="cook-choose" data-station="' + i + '" data-recipe="' + r.id + '" ' + (can ? "" : "disabled") + '>' +
            '<span class="opt-icon">' + (locked ? "🔒" : r.emoji) + '</span><span class="opt-body"><b>' + esc(r.name) + (locked ? " · Lv " + r.unlockLevel : "") + '</b>' +
            '<small>' + (locked ? "Unlocks at level " + r.unlockLevel : ings + ' · ' + fmtSecs(Math.round(r.cookTime * SS.cookMult())) + ' · ' + r.value + ' 🪙') + '</small></span>' +
            (wanted ? '<span class="sale">' + wanted + ' waiting</span>' : "") + '</button>';
        });
        SS.openModal("🍳 Station " + (i + 1) + " — pick a recipe", html, { kind: "cook" });
        return;
      }
      var build = function () {
        var st2 = S().stations[i];
        if (!st2) { SS.closeModal(); return ""; }
        var recipe = SS.recipeDef(st2.recipeId), ready = SS.stationReady(st2), prog = SS.stationProgress(st2);
        var cost = SS.rushCost(st2);
        return '<div class="zoom"><div class="zoom-ring' + (ready ? " ready" : "") + '" style="--pct:' + (prog * 100) + '%"><div class="zoom-inner">' + recipe.emoji + '</div></div>' +
          '<div class="zoom-title">' + esc(recipe.name) + '</div><div class="zoom-sub">' + (ready ? "Ready — collect within " + Math.round(SS.C.PERFECT_WINDOW_MS / 1000) + "s for a Perfect plate ✨" : fmtSecs(SS.stationSecsLeft(st2)) + " left · " + Math.round(prog * 100) + "%") + '</div>' +
          '<div class="zoom-actions">' + (ready ? '<button class="btn" data-action="collect" data-station="' + i + '">Collect</button>' : '<button class="btn rush" data-action="rush-cook" data-station="' + i + '" ' + (S().coins < cost ? "disabled" : "") + '>⚡ Rush for ' + cost + ' 🪙</button>') + '</div>' +
          (ready ? "" : '<small class="hint">Rushing has an ' + Math.round(SS.C.MISHAP_CHANCE * 100) + '% chance of burning the dish.</small>') + '</div>';
      };
      SS.openModal("🍳 Station " + (i + 1), build(), { kind: "zoom", refresh: function () { var h = build(); if (h) $("modal-body").innerHTML = h; } });
    },
    recipes: function () {
      var s = S(), html = "";
      SS.RECIPES.forEach(function (r) {
        var locked = r.unlockLevel > s.level, ings = [];
        for (var k in r.ingredients) ings.push(SS.cropDef(k).emoji + "×" + r.ingredients[k]);
        html += '<div class="option static' + (locked ? " locked" : "") + '"><span class="opt-icon">' + (locked ? "🔒" : r.emoji) + '</span><span class="opt-body"><b>' + esc(r.name) + (locked ? " · Lv " + r.unlockLevel : "") + '</b><small>' + ings.join(" ") + ' · ' + r.cookTime + 's · ' + r.value + ' 🪙 · ' + r.xp + ' xp · ' + r.method + '</small></span>' + (!locked && SS.canCook(r) ? '<span class="sale">can cook</span>' : "") + '</div>';
      });
      SS.openModal("📖 Recipe Book", html, { kind: "book" });
    },
    guests: function () {
      var html = "";
      SS.GUEST_TYPES.forEach(function (g) {
        html += '<div class="option static"><span class="opt-icon">' + g.emoji + '</span><span class="opt-body"><b>' + esc(g.name) + '</b><small>' + esc(g.desc) + ' · patience ×' + g.patience + ' · tips ×' + g.tip + ' · +' + g.rep + ' rep</small></span></div>';
      });
      SS.openModal("🧑‍🤝‍🧑 Who's dining", html, { kind: "book" });
    },
    settings: function () {
      var s = S();
      var html = '<div class="settings">' +
        '<button class="option" data-action="toggle-sound"><span class="opt-icon">' + (s.soundOn ? "🔊" : "🔇") + '</span><span class="opt-body"><b>Sound effects</b><small>' + (s.soundOn ? "On" : "Off") + '</small></span></button>' +
        '<button class="option" data-action="toggle-motion"><span class="opt-icon">' + (s.reduceMotion ? "🐢" : "🎞️") + '</span><span class="opt-body"><b>Animations</b><small>' + (s.reduceMotion ? "Reduced" : "Full") + '</small></span></button>' +
        '<button class="option" data-action="export-save"><span class="opt-icon">📋</span><span class="opt-body"><b>Copy save code</b><small>Back up your restaurant to the clipboard</small></span></button>' +
        '<button class="option" data-action="import-save"><span class="opt-icon">📥</span><span class="opt-body"><b>Load save code</b><small>Paste a save code you copied earlier</small></span></button>' +
        '<button class="option danger" data-action="restart-game"><span class="opt-icon">🗑️</span><span class="opt-body"><b>Restart from scratch</b><small>Deletes this restaurant. Prestige stars are lost too.</small></span></button>' +
        '<p class="hint">Sprout &amp; Skillet v2 · saves automatically in this browser.</p></div>';
      SS.openModal("⚙️ Settings", html, { kind: "settings" });
    },
    levelUp: function (data) {
      var html = '<div class="levelup"><div class="levelup-num">' + data.level + '</div><p>Your restaurant is growing!</p>' +
        (data.unlocks.length ? '<div class="unlock-grid">' + data.unlocks.map(function (u) { return '<div class="unlock"><span>' + u.emoji + '</span><b>' + esc(u.name) + '</b><small>' + u.kind + '</small></div>'; }).join("") + '</div>' : '<p class="hint">Keep serving to unlock more crops and recipes.</p>') +
        '</div>';
      SS.openModal("🎉 Level up!", html, { kind: "levelup", closeText: "Let's go!" });
    },
    welcomeBack: function (sum) {
      var mins = Math.max(1, Math.round(sum.away / 60000));
      var html = '<div class="welcome"><p>You were away for about <b>' + (mins >= 60 ? Math.round(mins / 60) + " hour" + (mins >= 120 ? "s" : "") : mins + " minute" + (mins > 1 ? "s" : "")) + '</b>.</p><ul>' +
        '<li>🌱 ' + sum.cropsReady + ' crop' + (sum.cropsReady === 1 ? "" : "s") + ' ready to harvest</li>' +
        '<li>🍳 ' + sum.dishesReady + ' dish' + (sum.dishesReady === 1 ? "" : "es") + ' finished cooking</li>' +
        (sum.guestsSent ? '<li>🚶 ' + sum.guestsSent + ' guest' + (sum.guestsSent === 1 ? "" : "s") + ' went home while you were closed (no penalty)</li>' : "") +
        '</ul><p class="hint">Staff don\'t charge for a closed shift, and pests took the day off.</p></div>';
      SS.openModal("👋 Welcome back!", html, { kind: "welcome", closeText: "Open up" });
    },
    welcome: function () {
      var html = '<div class="welcome intro"><p>Grow crops in the <b>Garden</b>, cook them in the <b>Kitchen</b>, and serve hungry guests in the <b>Dining Room</b>.</p>' +
        '<ul><li>💧 Water crops to speed them up, and shoo pests that wander in.</li><li>✨ Collect dishes the moment they finish for a Perfect plate.</li><li>🎩 Keep your reputation up and critics will visit — impress them for a windfall.</li><li>🌦️ Weather, seasons and surprise events change the pace.</li></ul></div>';
      SS.openModal("🍳 Welcome to Sprout & Skillet", html, { kind: "welcome", closeText: "Start farming" });
    },
    confirm: function (title, text, actionAttr, confirmText) {
      SS.openModal(title, '<p class="confirm-text">' + text + '</p><div class="confirm-actions"><button class="btn danger" ' + actionAttr + '>' + confirmText + '</button></div>', { kind: "confirm", closeText: "Cancel" });
    }
  };
})(window.SS = window.SS || {});
