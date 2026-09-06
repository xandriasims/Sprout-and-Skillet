/* Sprout & Skillet — visual effects: floating text, particles, fly-to animations, toasts */
(function (SS) {
  "use strict";
  var layer = null, toastBox = null;
  function fxLayer() { return layer || (layer = document.getElementById("fx-layer")); }
  function motionOff() { return SS.state && SS.state.reduceMotion; }

  SS.fx = {
    toast: function (msg, kind) {
      toastBox = toastBox || document.getElementById("toast-container");
      var el = document.createElement("div");
      el.className = "toast" + (kind ? " " + kind : "");
      el.textContent = msg;
      toastBox.appendChild(el);
      while (toastBox.children.length > 3) toastBox.removeChild(toastBox.firstChild);
      setTimeout(function () { el.classList.add("out"); setTimeout(function () { el.remove(); }, 300); }, 2600);
    },

    floatText: function (x, y, text, cls) {
      if (x == null || y == null) return;
      var el = document.createElement("div");
      el.className = "float-pop" + (cls ? " " + cls : "");
      el.textContent = text;
      el.style.left = x + "px"; el.style.top = y + "px";
      fxLayer().appendChild(el);
      setTimeout(function () { el.remove(); }, 1000);
    },

    burst: function (x, y, glyphs, count, spread) {
      if (x == null || motionOff()) return;
      count = count || 6; spread = spread || 34;
      for (var i = 0; i < count; i++) {
        var el = document.createElement("div");
        el.className = "particle";
        el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
        var ang = Math.random() * Math.PI * 2, dist = spread * (0.5 + Math.random());
        el.style.left = x + "px"; el.style.top = y + "px";
        el.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        el.style.setProperty("--dy", Math.sin(ang) * dist - 10 + "px");
        el.style.setProperty("--rot", (Math.random() * 240 - 120) + "deg");
        el.style.animationDuration = (450 + Math.random() * 300) + "ms";
        fxLayer().appendChild(el);
        (function (n) { setTimeout(function () { n.remove(); }, 800); })(el);
      }
    },

    sparkle: function (x, y) { SS.fx.burst(x, y, ["✨", "⭐"], 6, 28); },
    leaves: function (x, y) { SS.fx.burst(x, y, ["🍃", "🌿", "✨"], 7, 30); },
    droplets: function (x, y) { SS.fx.burst(x, y, ["💧"], 6, 22); },
    smoke: function (x, y) { SS.fx.burst(x, y, ["💨", "🔥"], 7, 34); },
    hearts: function (x, y) { SS.fx.burst(x, y, ["💚", "💛", "✨"], 7, 30); },

    confetti: function (count) {
      if (motionOff()) return;
      var pieces = ["🎉", "✨", "⭐", "🎊", "🌟"], w = window.innerWidth || 400;
      for (var i = 0; i < (count || 18); i++) {
        var el = document.createElement("div");
        el.className = "confetti-piece";
        el.textContent = pieces[Math.floor(Math.random() * pieces.length)];
        el.style.left = Math.round(Math.random() * w) + "px";
        var dur = 1100 + Math.random() * 700;
        el.style.animationDuration = dur + "ms";
        el.style.animationDelay = (Math.random() * 250) + "ms";
        fxLayer().appendChild(el);
        (function (n, d) { setTimeout(function () { n.remove(); }, d + 400); })(el, dur);
      }
    },

    /* Fly a glyph from (x,y) to a target element (e.g. the coin counter). */
    flyTo: function (x, y, targetEl, glyph, count, onArrive) {
      if (x == null || !targetEl) { if (onArrive) onArrive(); return; }
      if (motionOff()) { if (onArrive) onArrive(); return; }
      var r = targetEl.getBoundingClientRect();
      var tx = r.left + r.width / 2, ty = r.top + r.height / 2;
      count = count || 1;
      for (var i = 0; i < count; i++) {
        var el = document.createElement("div");
        el.className = "flyer";
        el.textContent = glyph;
        var sx = x + (Math.random() * 24 - 12), sy = y + (Math.random() * 16 - 8);
        el.style.left = sx + "px"; el.style.top = sy + "px";
        el.style.setProperty("--tx", (tx - sx) + "px");
        el.style.setProperty("--ty", (ty - sy) + "px");
        el.style.animationDelay = (i * 60) + "ms";
        fxLayer().appendChild(el);
        (function (n, last) {
          setTimeout(function () {
            n.remove();
            if (last) { targetEl.classList.remove("bump"); void targetEl.offsetWidth; targetEl.classList.add("bump"); if (onArrive) onArrive(); }
          }, 650 + i * 60);
        })(el, i === count - 1);
      }
    },

    shake: function () {
      if (motionOff()) return;
      var app = document.getElementById("app");
      app.classList.remove("shake"); void app.offsetWidth; app.classList.add("shake");
      setTimeout(function () { app.classList.remove("shake"); }, 500);
    },

    flash: function (cls) {
      var el = document.getElementById("flash");
      el.className = "flash " + (cls || "gold");
      void el.offsetWidth;
      el.classList.add("on");
      setTimeout(function () { el.classList.remove("on"); }, 500);
    },

    /* Bubble-pop the element under a point (feedback on tap). */
    pop: function (el) {
      if (!el || motionOff()) return;
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
      setTimeout(function () { el.classList.remove("pop"); }, 400);
    }
  };
})(window.SS = window.SS || {});
