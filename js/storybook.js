/* Storybook intro layer. Keeps game engine untouched. */
(function () {
  "use strict";
  var KEY = "sprout-and-skillet-storybook-intro-v1";

  function closeIntro() {
    var intro = document.getElementById("storybook-intro");
    if (!intro) return;
    intro.classList.remove("open");
    intro.setAttribute("aria-hidden", "true");
    try { localStorage.setItem(KEY, "seen"); } catch (e) {}
  }

  function openIntro() {
    var intro = document.getElementById("storybook-intro");
    if (!intro) return;
    intro.classList.add("open");
    intro.setAttribute("aria-hidden", "false");
  }

  document.addEventListener("click", function (e) {
    var action = e.target.closest("[data-storybook-action]");
    if (!action) return;
    if (action.getAttribute("data-storybook-action") === "close") closeIntro();
  });

  window.addEventListener("DOMContentLoaded", function () {
    var seen = false;
    try { seen = localStorage.getItem(KEY) === "seen"; } catch (e) {}
    if (!seen) openIntro();
  });

  window.SSStorybook = {
    open: openIntro,
    close: closeIntro,
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      openIntro();
    }
  };
})();
