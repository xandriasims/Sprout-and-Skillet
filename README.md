# 🍳 Sprout & Skillet

A cozy farm-to-table restaurant game that runs entirely in the browser. Grow crops in the garden, cook them in the kitchen, and serve a dining room full of hungry guests before they lose patience.

No build step, no dependencies at runtime: open `index.html` and play. Progress saves automatically in your browser.

## How to play

1. **Garden** — tap an empty plot to plant a seed. Tap a growing crop to water it (+25% growth). Shoo away any 🐛 pests that wander in, then harvest when the plant is ready.
2. **Kitchen** — tap a station, pick a recipe you have ingredients for, and let the chef cook. Collect the dish within a few seconds of it finishing for a ✨ **Perfect** plate (worth more). Dishes on the pass go cold after a while.
3. **Dining Room** — guests sit down with an order and a patience meter. Serve them before it runs out. Happy guests pay, tip, raise your reputation and build your combo streak.
4. **Shop** — till more land, add stations and tables, hire chefs and servers (they draw a wage every minute), and buy upgrades like sprinklers, a scarecrow, a plate warmer or a greenhouse.
5. **Goals** — complete rotating daily orders, chase achievements, and review lifetime stats.

Keyboard: `1`–`5` switch tabs, `Esc` closes any sheet.

## What's in the game

- **15 crops** and **18 recipes** unlocked across 10 levels, each with cook method (stove / oven / prep board) and its own station animation.
- **Living world** — a 6-minute day/night cycle with a moving sun and moon, drifting clouds, stars and fireflies at night, four seasons that boost different crops, and weather (sun, cloud, rain, wind) that changes growth speed and how busy the dining room is.
- **Five guest types** — regulars, kids, foodies, elders and the dreaded food critic — each with their own patience, tips and reputation value. Guests are drawn as SVG characters with idle, anxious, happy and sad states.
- **Random events** — Rush Hour, Farmers Market and Lazy Afternoon change the pace for a minute at a time.
- **Perfect plates, cold dishes, pests and watering** add moment-to-moment decisions on top of the core loop.
- **Reputation tiers** from Bronze to Platinum, combos, daily orders with rewards, 21 achievements, staff wages, and a prestige loop for a permanent tip bonus.
- **Feedback everywhere** — floating rewards, coin fly-to-counter, particle bursts, confetti, screen shake on kitchen mishaps, level-up cards, tab badges, an active-order rail, and a small WebAudio synth for sound cues (toggle in ⚙️ Settings).
- **Offline friendly** — crops and dishes keep finishing while the tab is closed; on return you get a summary, and guests who left while you were closed don't count against you.
- **Save codes** — export or import your restaurant from ⚙️ Settings. Reduced-motion mode is available there too and also follows your OS preference.

## Project layout

```
index.html         page shell
css/styles.css     layout, theme and all animations
js/data.js         crops, recipes, upgrades, guests, weather, events, achievements
js/state.js        default state, save/load, migration, day clock
js/engine.js       game rules: actions, economy, tick loop, spawning, quests
js/render.js       DOM rendering (signature-diffed so animations don't restart) and modals
js/sprites.js      inline SVG builders for crops, guests, chefs and appliances
js/fx.js           particles, floating text, fly-to, toasts
js/audio.js        WebAudio sound cues
js/main.js         input handling, ambient effects and boot
scripts/smoke.mjs  headless Playwright play-through used by CI
```

Scripts are plain browser globals under `window.SS`, loaded in order by `index.html`, so the game works from `file://` as well as any static host.

## Development

```bash
npm start          # serve on http://localhost:8080
npm install        # only needed for the test
npx playwright install chromium
npm test           # plays through the core loop headlessly, screenshots land in .smoke/
```

CI runs the smoke test on every push. The Pages workflow publishes the site from the default branch once **Settings → Pages → Source** is set to *GitHub Actions*.

## License

MIT
