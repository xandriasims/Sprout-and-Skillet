/* Sprout & Skillet — tiny WebAudio synth for sound effects */
(function (SS) {
  "use strict";
  var ctx = null;

  SS.audio = {
    ensure: function () {
      if (!SS.state || !SS.state.soundOn) return;
      if (!ctx) {
        try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); } catch (e) {}
      }
      if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    },
    tone: function (freq, dur, type, vol, delay) {
      if (!SS.state || !SS.state.soundOn || !ctx) return;
      try {
        var t0 = ctx.currentTime + (delay || 0);
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || "sine";
        o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.03);
      } catch (e) {}
    },
    slide: function (from, to, dur, type, vol) {
      if (!SS.state || !SS.state.soundOn || !ctx) return;
      try {
        var t0 = ctx.currentTime;
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || "sine";
        o.frequency.setValueAtTime(from, t0);
        o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
        g.gain.setValueAtTime(vol || 0.05, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.03);
      } catch (e) {}
    },
    noise: function (dur, vol) {
      if (!SS.state || !SS.state.soundOn || !ctx) return;
      try {
        var len = Math.floor(ctx.sampleRate * dur);
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        var src = ctx.createBufferSource(); src.buffer = buf;
        var g = ctx.createGain(); g.gain.value = vol || 0.04;
        var f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1200;
        src.connect(f); f.connect(g); g.connect(ctx.destination);
        src.start();
      } catch (e) {}
    },
    // named cues
    plant: function () { SS.audio.slide(300, 520, 0.12, "triangle", 0.05); },
    water: function () { SS.audio.noise(0.18, 0.03); SS.audio.tone(900, 0.08, "sine", 0.02, 0.05); },
    harvest: function () { SS.audio.tone(660, 0.08, "triangle"); SS.audio.tone(990, 0.12, "triangle", 0.05, 0.08); },
    pest: function () { SS.audio.tone(220, 0.1, "square", 0.03); SS.audio.tone(180, 0.1, "square", 0.03, 0.12); },
    cook: function () { SS.audio.noise(0.25, 0.03); SS.audio.tone(440, 0.1, "triangle", 0.03, 0.05); },
    collect: function () { SS.audio.tone(784, 0.1, "triangle"); },
    perfect: function () { SS.audio.tone(880, 0.08, "triangle"); SS.audio.tone(1175, 0.08, "triangle", 0.05, 0.08); SS.audio.tone(1568, 0.16, "triangle", 0.05, 0.16); },
    serve: function () { SS.audio.tone(880, 0.12, "triangle"); },
    coin: function () { SS.audio.tone(1320, 0.06, "square", 0.025); SS.audio.tone(1760, 0.1, "square", 0.025, 0.06); },
    critic: function () { SS.audio.tone(660, 0.1, "triangle"); SS.audio.tone(880, 0.1, "triangle", 0.05, 0.11); SS.audio.tone(1100, 0.16, "triangle", 0.05, 0.22); },
    levelUp: function () { SS.audio.tone(523, 0.12, "square", 0.04); SS.audio.tone(659, 0.12, "square", 0.04, 0.12); SS.audio.tone(784, 0.12, "square", 0.04, 0.24); SS.audio.tone(1047, 0.25, "square", 0.04, 0.36); },
    walkout: function () { SS.audio.slide(260, 140, 0.35, "sawtooth", 0.04); },
    mishap: function () { SS.audio.noise(0.3, 0.05); SS.audio.slide(200, 90, 0.4, "sawtooth", 0.04); },
    buy: function () { SS.audio.tone(600, 0.08, "sine"); SS.audio.tone(900, 0.12, "sine", 0.05, 0.08); },
    tap: function () { SS.audio.tone(500, 0.04, "sine", 0.02); },
    event: function () { SS.audio.tone(700, 0.1, "triangle"); SS.audio.tone(933, 0.1, "triangle", 0.05, 0.12); SS.audio.tone(700, 0.1, "triangle", 0.05, 0.24); SS.audio.tone(1245, 0.2, "triangle", 0.05, 0.36); }
  };
})(window.SS = window.SS || {});
