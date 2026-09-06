/* Sprout & Skillet — boot, input handling and ambient effects */
(function (SS) {
  "use strict";
  function S() { return SS.state; }
  function pt(e) { return e && e.clientX != null ? { x: e.clientX, y: e.clientY } : null; }
  function centerOf(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el) return;
    SS.audio.ensure();
    var action = el.getAttribute("data-action");
    var p = (e.detail === 0 || e.clientX === 0) ? centerOf(el) : pt(e);
    var num = function (attr) { return parseInt(el.getAttribute(attr), 10); };
    switch (action) {
      case "switch-tab": SS.switchTab(el.getAttribute("data-tab")); SS.audio.tap(); break;
      case "plant-open": SS.ui.plant(num("data-plot")); break;
      case "plant-choose": if (SS.plantCrop(num("data-plot"), el.getAttribute("data-crop"), null)) SS.closeModal(); break;
      case "water": SS.fx.pop(el); SS.waterPlot(num("data-plot"), p); break;
      case "shoo": SS.fx.pop(el); SS.shooPest(num("data-plot"), p); break;
      case "harvest": SS.fx.pop(el); SS.harvestPlot(num("data-plot"), p); break;
      case "harvest-all": SS.harvestAll(); break;
      case "till-land": SS.buyPlot(); break;
      case "station-open": SS.ui.station(num("data-station")); break;
      case "cook-choose": if (SS.startCooking(num("data-station"), el.getAttribute("data-recipe"), p)) SS.closeModal(); break;
      case "collect": SS.fx.pop(el); SS.collectDish(num("data-station"), p); SS.closeModal(); break;
      case "collect-all": SS.collectAll(); break;
      case "rush-cook": SS.rushCook(num("data-station"), p); SS.closeModal(); break;
      case "discard": SS.discardDish(num("data-dish")); break;
      case "serve": SS.fx.pop(el.closest(".table-card") || el); SS.serveTable(num("data-table"), p); break;
      case "buy-expand": SS.buyExpansion(el.getAttribute("data-type")); break;
      case "buy-upgrade": SS.buyUpgrade(el.getAttribute("data-id")); break;
      case "hire-staff": SS.hireStaff(el.getAttribute("data-role")); break;
      case "reroll-quest": SS.rerollQuest(el.getAttribute("data-quest")); break;
      case "open-recipes": SS.ui.recipes(); break;
      case "open-guests": SS.ui.guests(); break;
      case "open-settings": SS.ui.settings(); break;
      case "toggle-sound": SS.toggleSound(); SS.ui.settings(); break;
      case "toggle-motion": SS.toggleMotion(); SS.ui.settings(); break;
      case "skip-tutorial": S().tutorialDone = true; SS.saveGame(); SS.render(); break;
      case "modal-close": SS.closeModal(); break;
      case "do-prestige": SS.ui.confirm("⭐ Retire & reopen?", "You'll start over with a fresh garden and kitchen but keep every achievement and lifetime stat, plus a permanent +" + Math.round(SS.C.PRESTIGE_BONUS * 100) + "% tip bonus per star.", 'data-action="confirm-prestige"', "Retire"); break;
      case "confirm-prestige": SS.closeModal(); SS.doPrestige(); break;
      case "restart-game": SS.ui.confirm("🗑️ Restart from scratch?", "This wipes your restaurant, achievements and prestige stars. There is no undo.", 'data-action="confirm-restart"', "Delete everything"); break;
      case "confirm-restart": SS.closeModal(); SS.restartGame(); SS.ui.welcome(); break;
      case "export-save": exportSave(); break;
      case "import-save": importSave(); break;
    }
  });

  function exportSave() {
    var code = btoa(unescape(encodeURIComponent(SS.exportSave())));
    var done = function () { SS.fx.toast("📋 Save code copied to the clipboard."); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () { window.prompt("Copy your save code:", code); });
    else window.prompt("Copy your save code:", code);
  }
  function importSave() {
    var code = window.prompt("Paste your save code:");
    if (!code) return;
    try {
      SS.importSave(decodeURIComponent(escape(atob(code.trim()))));
      SS.closeModal(); SS.render();
      SS.fx.toast("📥 Save loaded. Welcome back!");
    } catch (e) { SS.fx.toast("That doesn't look like a valid save code.", "bad"); }
  }

  document.getElementById("modal-overlay").addEventListener("click", function (e) { if (e.target.id === "modal-overlay") SS.closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") SS.closeModal();
    var tabs = ["garden", "kitchen", "dining", "shop", "goals"];
    if (/^[1-5]$/.test(e.key) && !e.metaKey && !e.ctrlKey && document.activeElement.tagName !== "INPUT") SS.switchTab(tabs[parseInt(e.key, 10) - 1]);
  });

  SS.on("levelup", function (data) { setTimeout(function () { SS.ui.levelUp(data); }, 250); });

  /* Ambient particles: drifting leaves in wind, fireflies at night, sun motes on sunny days. */
  function ambient() {
    if (!S() || S().reduceMotion || document.hidden) return;
    var layer = document.getElementById("ambient-layer");
    if (layer.children.length > 14) return;
    var w = S().weather, night = SS.isNight();
    var glyph = null, cls = "";
    if (w === "wind") { glyph = SS.pick(["🍃", "🍂", "🌿"]); cls = "leaf"; }
    else if (night && Math.random() < 0.7) { glyph = "✦"; cls = "firefly"; }
    else if (w === "sunny" && Math.random() < 0.35) { glyph = "✧"; cls = "mote"; }
    else if (w === "cloudy" && Math.random() < 0.15) { glyph = "☁️"; cls = "cloud"; }
    if (!glyph) return;
    var el = document.createElement("span");
    el.className = "ambient " + cls; el.textContent = glyph;
    el.style.top = (Math.random() * 80 + 5) + "%";
    el.style.left = cls === "leaf" || cls === "cloud" ? "-40px" : (Math.random() * 90 + 5) + "%";
    el.style.animationDuration = (cls === "leaf" ? 5 + Math.random() * 4 : cls === "cloud" ? 30 + Math.random() * 20 : 3 + Math.random() * 3) + "s";
    el.style.fontSize = (cls === "cloud" ? 28 : 12 + Math.random() * 10) + "px";
    layer.appendChild(el);
    el.addEventListener("animationend", function () { el.remove(); });
  }

  /* ---------- boot ---------- */
  SS.state = SS.loadGame();
  document.body.classList.toggle("reduce-motion", !!S().reduceMotion);
  var summary = SS.applyOfflineReturn();
  SS.ensureQuests();
  S().lastDay = SS.dayNumber();
  SS.render();
  if (!S().seenWelcome) { S().seenWelcome = true; SS.saveGame(); SS.ui.welcome(); }
  else if (summary && (summary.cropsReady || summary.dishesReady || summary.guestsSent)) SS.ui.welcomeBack(summary);
  setInterval(SS.tick, 1000);
  setInterval(ambient, 900);
  document.addEventListener("visibilitychange", function () { if (document.hidden) SS.saveGame(true); else SS.tick(); });
  window.addEventListener("beforeunload", function () { SS.saveGame(true); });
  document.getElementById("app").classList.add("loaded");
})(window.SS = window.SS || {});
