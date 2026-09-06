/* Sprout & Skillet — inline SVG sprite builders (crops, guests, chef) */
(function (SS) {
  "use strict";

  /* Crop sprite. stage: 0 seed, 1 sprout, 2 young, 3 ready. */
  SS.cropSvg = function (crop, stage, opts) {
    opts = opts || {};
    var leaf = "#4CAF50", leafDark = "#2E7D32", stem = "#3E8E41";
    var h = crop.tall ? 1.35 : 1;
    var plant = "";
    if (stage === 0) {
      plant = '<path d="M40 60 q0 -10 3 -14" stroke="' + stem + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
              '<ellipse cx="45" cy="46" rx="5" ry="3" fill="' + leaf + '" transform="rotate(-30 45 46)"/>';
    } else if (stage === 1) {
      plant = '<path d="M40 60 q0 -16 0 -22" stroke="' + stem + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
              '<ellipse cx="33" cy="46" rx="7" ry="4" fill="' + leaf + '" transform="rotate(-25 33 46)"/>' +
              '<ellipse cx="47" cy="42" rx="7" ry="4" fill="' + leafDark + '" transform="rotate(25 47 42)"/>';
    } else {
      var top = 60 - 26 * h;
      plant = '<path d="M40 60 q-2 -14 0 -' + (26 * h) + '" stroke="' + stem + '" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
              '<ellipse cx="30" cy="' + (top + 16) + '" rx="10" ry="5" fill="' + leaf + '" transform="rotate(-28 30 ' + (top + 16) + ')"/>' +
              '<ellipse cx="50" cy="' + (top + 10) + '" rx="10" ry="5" fill="' + leafDark + '" transform="rotate(28 50 ' + (top + 10) + ')"/>' +
              '<ellipse cx="32" cy="' + (top + 4) + '" rx="8" ry="4" fill="' + leafDark + '" transform="rotate(-35 32 ' + (top + 4) + ')"/>' +
              '<ellipse cx="48" cy="' + (top + 24) + '" rx="8" ry="4" fill="' + leaf + '" transform="rotate(35 48 ' + (top + 24) + ')"/>';
      if (stage === 3) {
        plant += '<circle cx="40" cy="' + (top + 2) + '" r="11" fill="' + crop.color + '" opacity=".16"/>' +
                 '<text x="40" y="' + (top + 8) + '" text-anchor="middle" font-size="17">' + crop.emoji + '</text>';
      } else {
        plant += '<circle cx="40" cy="' + (top + 2) + '" r="3.5" fill="' + crop.color + '" opacity=".7"/>';
      }
    }
    var wet = opts.watered ? '<ellipse cx="40" cy="62" rx="20" ry="5" fill="#3E7BB6" opacity=".22"/>' : "";
    var pest = opts.pest ? '<text x="56" y="40" font-size="16" class="pest-bug">🐛</text>' : "";
    return '<svg viewBox="0 0 80 72" class="crop-svg" aria-hidden="true">' +
        '<ellipse cx="40" cy="62" rx="26" ry="7" fill="#8B6242"/>' +
        '<ellipse cx="40" cy="60" rx="22" ry="5" fill="#6D4A31"/>' + wet +
        '<g class="plant sway' + (stage % 2 ? " alt" : "") + '">' + plant + '</g>' + pest +
      '</svg>';
  };

  SS.cropStage = function (progress) {
    if (progress >= 1) return 3;
    if (progress >= 0.6) return 2;
    if (progress >= 0.25) return 1;
    return 0;
  };

  /* Guest sprite. type: regular/kid/foodie/elder/critic; mood: wait/anxious/happy/sad */
  SS.guestSvg = function (guest, mood) {
    var outfits = ["#2F4B3C", "#B34B3C", "#D9A441", "#6FA9A3", "#8B5E9E", "#3C6BB3", "#C2185B"];
    var skins = ["#F2C29B", "#C68B59", "#8D5A3B", "#E0AC84", "#6B4226"];
    var hairs = ["#3A2E22", "#6B4226", "#1A1A1A", "#8B5E34", "#D9A441", "#B23A3A"];
    var seed = guest.seed || 0;
    var outfit = outfits[seed % outfits.length];
    var skin = skins[(seed >> 2) % skins.length];
    var hair = guest.type === "elder" ? "#CFCFCF" : hairs[(seed >> 4) % hairs.length];
    var ink = "#3A2E22";
    var scale = guest.type === "kid" ? 0.86 : 1;

    var eyes, mouth, extra = "";
    if (mood === "happy") {
      eyes = '<path d="M20 22 Q23 19 26 22" stroke="' + ink + '" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M34 22 Q37 19 40 22" stroke="' + ink + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
      mouth = '<path d="M22 30 Q30 38 38 30" stroke="' + ink + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
      extra = '<circle cx="19" cy="29" r="2.5" fill="#F48FB1" opacity=".6"/><circle cx="41" cy="29" r="2.5" fill="#F48FB1" opacity=".6"/>';
    } else if (mood === "sad") {
      eyes = '<circle cx="23" cy="23" r="1.7" fill="' + ink + '"/><circle cx="37" cy="23" r="1.7" fill="' + ink + '"/><path d="M19 18 L26 20" stroke="' + ink + '" stroke-width="1.4"/><path d="M41 18 L34 20" stroke="' + ink + '" stroke-width="1.4"/>';
      mouth = '<path d="M23 33 Q30 28 37 33" stroke="' + ink + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    } else if (mood === "anxious") {
      eyes = '<circle cx="23" cy="23" r="2" fill="' + ink + '"/><circle cx="37" cy="23" r="2" fill="' + ink + '"/><path d="M19 19 Q23 17 26 19" stroke="' + ink + '" stroke-width="1.3" fill="none"/><path d="M34 19 Q37 17 41 19" stroke="' + ink + '" stroke-width="1.3" fill="none"/>';
      mouth = '<path d="M25 32 Q30 30 35 32" stroke="' + ink + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
      extra = '<path d="M44 14 q1 3 0 6" stroke="#3E7BB6" stroke-width="2" stroke-linecap="round" fill="none" class="sweat"/>';
    } else {
      eyes = '<circle cx="23" cy="23" r="1.7" fill="' + ink + '"/><circle cx="37" cy="23" r="1.7" fill="' + ink + '"/>';
      mouth = '<path d="M24 31 Q30 34 36 31" stroke="' + ink + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    }

    var arms;
    if (mood === "happy") {
      arms = '<rect x="12" y="34" width="6" height="14" rx="3" fill="' + skin + '" transform="rotate(-30 15 41)"/><rect x="42" y="34" width="6" height="14" rx="3" fill="' + skin + '" transform="rotate(30 45 41)"/>';
    } else if (mood === "sad") {
      arms = '<rect x="12" y="46" width="6" height="14" rx="3" fill="' + skin + '"/><rect x="42" y="46" width="6" height="14" rx="3" fill="' + skin + '"/>';
    } else {
      arms = '<g class="guest-arm"><rect x="40" y="44" width="6" height="16" rx="3" fill="' + skin + '"/></g><rect x="14" y="46" width="6" height="14" rx="3" fill="' + skin + '"/>';
    }

    var hat = "";
    if (guest.type === "critic") {
      hat = '<path d="M18 12 L42 12 L37 0 L23 0 Z" fill="#1D3129"/><rect x="15" y="11" width="30" height="4" rx="1" fill="#D9A441"/><circle cx="37" cy="23" r="4.5" fill="none" stroke="#D9A441" stroke-width="1.3"/><line x1="41" y1="26" x2="44" y2="31" stroke="#D9A441" stroke-width="1.2"/>';
    } else if (guest.type === "elder") {
      hat = '<circle cx="23" cy="23" r="4.5" fill="none" stroke="#555" stroke-width="1.2"/><circle cx="37" cy="23" r="4.5" fill="none" stroke="#555" stroke-width="1.2"/><line x1="27.5" y1="23" x2="32.5" y2="23" stroke="#555" stroke-width="1.2"/>';
    } else if (guest.type === "foodie") {
      hat = '<rect x="41" y="38" width="12" height="9" rx="2" fill="#333"/><circle cx="47" cy="42.5" r="3" fill="#8ab4f8"/><rect x="44" y="36" width="5" height="3" fill="#333"/>';
    } else if (guest.type === "kid") {
      hat = '<path d="M16 16 Q30 4 44 16 L44 12 Q30 0 16 12 Z" fill="#E84A3C"/><rect x="40" y="10" width="10" height="4" rx="2" fill="#E84A3C"/>';
    }
    var hairShape = guest.type === "kid"
      ? '<path d="M17 20 Q30 6 43 20 Q43 14 30 12 Q17 14 17 20 Z" fill="' + hair + '"/>'
      : '<path d="M16 20 Q30 2 44 20 Q44 14 30 10 Q16 14 16 20 Z" fill="' + hair + '"/>';

    return '<svg viewBox="0 0 60 70" class="guest-svg" aria-hidden="true">' +
        '<g transform="translate(' + (30 - 30 * scale) + ' ' + (70 - 70 * scale) + ') scale(' + scale + ')">' +
        '<ellipse cx="30" cy="66" rx="17" ry="3.5" fill="#000" opacity=".12"/>' +
        '<rect x="14" y="40" width="32" height="26" rx="9" fill="' + outfit + '"/>' +
        '<path d="M26 40 L30 48 L34 40 Z" fill="#fff" opacity=".35"/>' +
        arms +
        '<g class="guest-head"><circle cx="30" cy="26" r="14" fill="' + skin + '"/>' + hairShape + eyes + mouth + extra + hat + '</g>' +
        '</g></svg>';
  };

  /* Chef at a station. cooking: animates the arm; method decides the tool. */
  SS.chefSvg = function (cooking, method, variant) {
    var coats = ["#F5EFE0", "#F5EFE0", "#E8F1F5"];
    var skins = ["#E8B88A", "#C68B59", "#8D5A3B"];
    var skin = skins[(variant || 0) % skins.length];
    var tool = method === "prep"
      ? '<rect x="36" y="18" width="3" height="12" rx="1" fill="#B0BEC5" transform="rotate(35 37 24)"/><rect x="34" y="27" width="4" height="5" rx="1" fill="#5D4037" transform="rotate(35 36 29)"/>'
      : '<line x1="35" y1="28" x2="41" y2="20" stroke="#8B5E34" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="41.5" cy="19" rx="2.6" ry="1.6" fill="#8B5E34"/>';
    return '<svg viewBox="0 0 50 46" class="chef-svg" aria-hidden="true">' +
        '<ellipse cx="25" cy="9" rx="11" ry="8" fill="#fff" stroke="#E4D9BE"/>' +
        '<rect x="15" y="12" width="20" height="6" rx="2" fill="#fff" stroke="#E4D9BE"/>' +
        '<circle cx="25" cy="23" r="8.5" fill="' + skin + '"/>' +
        '<circle cx="22" cy="22" r="1.2" fill="#3A2E22"/><circle cx="28" cy="22" r="1.2" fill="#3A2E22"/>' +
        '<path d="M21.5 26 Q25 ' + (cooking ? "28.5" : "27") + ' 28.5 26" stroke="#3A2E22" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
        '<rect x="11" y="31" width="28" height="13" rx="5" fill="' + coats[(variant || 0) % coats.length] + '" stroke="#D9C79E"/>' +
        '<circle cx="21" cy="36" r="1" fill="#D9C79E"/><circle cx="29" cy="36" r="1" fill="#D9C79E"/>' +
        '<g class="chef-arm' + (cooking ? " busy" : "") + '"><rect x="33" y="28" width="4" height="12" rx="2" fill="' + skin + '"/>' + tool + '</g>' +
      '</svg>';
  };

  /* Appliance drawn for a station by recipe method. */
  SS.applianceHtml = function (method, state) {
    if (method === "oven") {
      return '<div class="appliance oven ' + state + '"><div class="oven-window"><span class="oven-glow"></span></div><div class="oven-knobs"><i></i><i></i></div></div>';
    }
    if (method === "prep") {
      return '<div class="appliance board ' + state + '"><div class="board-top"></div><div class="board-chop"></div></div>';
    }
    return '<div class="appliance stove ' + state + '">' +
        '<div class="pot"><div class="pot-lid"></div><div class="pot-body"></div></div>' +
        '<div class="flames"><i></i><i></i><i></i></div>' +
        '<div class="steam"><b></b><b></b><b></b></div>' +
      '</div>';
  };
})(window.SS = window.SS || {});
