/* Sprout & Skillet — static game data
   Everything the game knows about crops, recipes, guests, weather and rewards lives here. */
(function (SS) {
  "use strict";

  SS.SAVE_KEY = "sprout-and-skillet-save-v2";
  SS.SAVE_VERSION = 2;

  /* Day cycle: one in-game day lasts this many real ms. */
  SS.DAY_MS = 6 * 60 * 1000;
  SS.DAYS_PER_SEASON = 3;
  SS.SEASONS = [
    { id: "spring", name: "Spring", emoji: "🌸", boost: ["lettuce", "strawberry", "basil", "onion"] },
    { id: "summer", name: "Summer", emoji: "☀️", boost: ["tomato", "pepper", "corn", "eggplant"] },
    { id: "autumn", name: "Autumn", emoji: "🍂", boost: ["pumpkin", "mushroom", "potato", "wheat"] },
    { id: "winter", name: "Winter", emoji: "❄️", boost: ["garlic", "carrot", "rice"] }
  ];
  SS.SEASON_BOOST = 0.8; // grow-time multiplier for in-season crops

  /* Crops. `stages` are the 4 visual growth stages (seed → sprout → young → ready). */
  SS.CROPS = [
    { id: "tomato",     name: "Tomato",     emoji: "🍅", growTime: 20, cost: 5,  unlockLevel: 1, yield: 3, color: "#E84A3C", tall: false },
    { id: "wheat",      name: "Wheat",      emoji: "🌾", growTime: 25, cost: 5,  unlockLevel: 1, yield: 3, color: "#E3B84B", tall: true },
    { id: "lettuce",    name: "Lettuce",    emoji: "🥬", growTime: 18, cost: 4,  unlockLevel: 1, yield: 3, color: "#7CC65B", tall: false },
    { id: "onion",      name: "Onion",      emoji: "🧅", growTime: 30, cost: 8,  unlockLevel: 2, yield: 3, color: "#D9B382", tall: false },
    { id: "carrot",     name: "Carrot",     emoji: "🥕", growTime: 35, cost: 8,  unlockLevel: 2, yield: 3, color: "#F28C28", tall: false },
    { id: "basil",      name: "Basil",      emoji: "🌿", growTime: 40, cost: 10, unlockLevel: 3, yield: 3, color: "#3F9C4A", tall: false },
    { id: "potato",     name: "Potato",     emoji: "🥔", growTime: 45, cost: 10, unlockLevel: 3, yield: 4, color: "#C9A46A", tall: false },
    { id: "strawberry", name: "Strawberry", emoji: "🍓", growTime: 50, cost: 14, unlockLevel: 4, yield: 3, color: "#E6394F", tall: false },
    { id: "pepper",     name: "Pepper",     emoji: "🫑", growTime: 55, cost: 15, unlockLevel: 4, yield: 3, color: "#4CAF50", tall: true },
    { id: "mushroom",   name: "Mushroom",   emoji: "🍄", growTime: 60, cost: 15, unlockLevel: 5, yield: 3, color: "#C25B4A", tall: false },
    { id: "rice",       name: "Rice",       emoji: "🍚", growTime: 50, cost: 12, unlockLevel: 6, yield: 4, color: "#F1EBDD", tall: true },
    { id: "garlic",     name: "Garlic",     emoji: "🧄", growTime: 40, cost: 10, unlockLevel: 6, yield: 3, color: "#F3EEE3", tall: false },
    { id: "corn",       name: "Corn",       emoji: "🌽", growTime: 55, cost: 14, unlockLevel: 7, yield: 3, color: "#F5C842", tall: true },
    { id: "eggplant",   name: "Eggplant",   emoji: "🍆", growTime: 60, cost: 16, unlockLevel: 8, yield: 3, color: "#6E3FA0", tall: true },
    { id: "pumpkin",    name: "Pumpkin",    emoji: "🎃", growTime: 75, cost: 20, unlockLevel: 9, yield: 4, color: "#F2801E", tall: false }
  ];

  /* Recipes. `method` picks the station animation: stove (flames), oven (glow), prep (knife). */
  SS.RECIPES = [
    { id: "salad",        name: "Garden Salad",           emoji: "🥗", method: "prep",  ingredients: { lettuce: 2, tomato: 1 },              cookTime: 15, value: 16,  xp: 9,  unlockLevel: 1 },
    { id: "bread",        name: "Fresh Bread",            emoji: "🍞", method: "oven",  ingredients: { wheat: 3 },                           cookTime: 20, value: 18,  xp: 10, unlockLevel: 1 },
    { id: "tomatosoup",   name: "Tomato Soup",            emoji: "🍲", method: "stove", ingredients: { tomato: 3 },                          cookTime: 20, value: 20,  xp: 12, unlockLevel: 1 },
    { id: "veggiestew",   name: "Veggie Stew",            emoji: "🍛", method: "stove", ingredients: { tomato: 2, onion: 2, carrot: 1 },     cookTime: 30, value: 45,  xp: 22, unlockLevel: 2 },
    { id: "carrotcake",   name: "Carrot Cake",            emoji: "🍰", method: "oven",  ingredients: { carrot: 3, wheat: 2 },                cookTime: 35, value: 50,  xp: 24, unlockLevel: 2 },
    { id: "herbpotatoes", name: "Herb Potatoes",          emoji: "🥘", method: "oven",  ingredients: { potato: 3, basil: 2 },                cookTime: 35, value: 55,  xp: 28, unlockLevel: 3 },
    { id: "flatbread",    name: "Margherita Flatbread",   emoji: "🍕", method: "oven",  ingredients: { wheat: 2, tomato: 2, basil: 1 },      cookTime: 30, value: 60,  xp: 30, unlockLevel: 3 },
    { id: "berrytart",    name: "Strawberry Tart",        emoji: "🥧", method: "oven",  ingredients: { strawberry: 3, wheat: 2 },            cookTime: 40, value: 75,  xp: 34, unlockLevel: 4 },
    { id: "stuffedpep",   name: "Stuffed Peppers",        emoji: "🫑", method: "oven",  ingredients: { pepper: 3, onion: 2, wheat: 1 },      cookTime: 40, value: 80,  xp: 38, unlockLevel: 4 },
    { id: "risotto",      name: "Mushroom Risotto",       emoji: "🍚", method: "stove", ingredients: { mushroom: 3, wheat: 2, onion: 1 },    cookTime: 45, value: 100, xp: 46, unlockLevel: 5 },
    { id: "veggieroast",  name: "Rustic Vegetable Roast", emoji: "🍽️", method: "oven", ingredients: { carrot: 2, pepper: 2, potato: 2 },     cookTime: 50, value: 110, xp: 50, unlockLevel: 5 },
    { id: "friedrice",    name: "Garlic Fried Rice",      emoji: "🍙", method: "stove", ingredients: { rice: 3, garlic: 2, onion: 1 },       cookTime: 35, value: 85,  xp: 40, unlockLevel: 6 },
    { id: "bruschetta",   name: "Garlic Bruschetta",      emoji: "🥖", method: "prep",  ingredients: { wheat: 2, tomato: 2, garlic: 1 },     cookTime: 25, value: 70,  xp: 32, unlockLevel: 6 },
    { id: "cornchowder",  name: "Corn Chowder",           emoji: "🥣", method: "stove", ingredients: { corn: 3, potato: 2, onion: 1 },       cookTime: 40, value: 95,  xp: 44, unlockLevel: 7 },
    { id: "noodles",      name: "Garlic Veggie Noodles",  emoji: "🍜", method: "stove", ingredients: { wheat: 2, garlic: 2, carrot: 2 },     cookTime: 45, value: 120, xp: 55, unlockLevel: 7 },
    { id: "ratatouille",  name: "Ratatouille",            emoji: "🍆", method: "oven",  ingredients: { eggplant: 2, tomato: 2, pepper: 1, basil: 1 }, cookTime: 55, value: 140, xp: 62, unlockLevel: 8 },
    { id: "pumpkinsoup",  name: "Pumpkin Soup",           emoji: "🎃", method: "stove", ingredients: { pumpkin: 2, onion: 1, garlic: 1 },    cookTime: 50, value: 150, xp: 66, unlockLevel: 9 },
    { id: "harvestpie",   name: "Harvest Pie",            emoji: "🥧", method: "oven",  ingredients: { pumpkin: 2, wheat: 3, strawberry: 1 }, cookTime: 65, value: 190, xp: 80, unlockLevel: 10 }
  ];

  SS.UPGRADES = [
    { id: "lighting",   name: "Cozy Lighting",     emoji: "💡", cost: 200,  unlockLevel: 1, desc: "+10% coins from every dish served" },
    { id: "fountain",   name: "Garden Fountain",   emoji: "⛲", cost: 250,  unlockLevel: 2, desc: "+15% guest patience" },
    { id: "herbboxes",  name: "Fresh Herb Boxes",  emoji: "🌱", cost: 300,  unlockLevel: 2, desc: "-10% crop growing time" },
    { id: "scarecrow",  name: "Scarecrow",         emoji: "🎃", cost: 260,  unlockLevel: 3, desc: "Pests never bother your crops" },
    { id: "cookware",   name: "Copper Cookware",   emoji: "🍳", cost: 350,  unlockLevel: 3, desc: "-15% cooking time" },
    { id: "sprinklers", name: "Sprinklers",        emoji: "💦", cost: 420,  unlockLevel: 4, desc: "Every crop is watered automatically" },
    { id: "music",      name: "Live Music Corner", emoji: "🎵", cost: 400,  unlockLevel: 4, desc: "Guests arrive ~20% more often" },
    { id: "tipjar",     name: "Tip Jar",           emoji: "🫙", cost: 480,  unlockLevel: 5, desc: "Happy guests leave a bonus tip" },
    { id: "greenhouse", name: "Greenhouse",        emoji: "🏡", cost: 650,  unlockLevel: 6, desc: "Every crop counts as in-season" },
    { id: "warmer",     name: "Plate Warmer",      emoji: "♨️", cost: 700,  unlockLevel: 7, desc: "Plated dishes never go cold" }
  ];

  SS.ACHIEVEMENTS = [
    { id: "first_harvest",  name: "First Harvest",   emoji: "🌱", desc: "Harvest your first crop",           reward: { coins: 10,  xp: 5 },  target: 1,   stat: "harvested" },
    { id: "green_thumb",    name: "Green Thumb",     emoji: "🌾", desc: "Harvest 50 crops",                  reward: { coins: 100, xp: 30 }, target: 50,  stat: "harvested" },
    { id: "farmhand",       name: "Farmhand",        emoji: "🚜", desc: "Harvest 250 crops",                 reward: { coins: 300, xp: 80 }, target: 250, stat: "harvested" },
    { id: "rain_maker",     name: "Rain Maker",      emoji: "💧", desc: "Water 30 crops by hand",            reward: { coins: 60,  xp: 20 }, target: 30,  stat: "watered" },
    { id: "pest_control",   name: "Pest Control",    emoji: "🐛", desc: "Shoo 10 pests away",                reward: { coins: 60,  xp: 20 }, target: 10,  stat: "pests" },
    { id: "first_dish",     name: "First Dish",      emoji: "🍳", desc: "Cook your first dish",              reward: { coins: 10,  xp: 5 },  target: 1,   stat: "cooked" },
    { id: "master_chef",    name: "Master Chef",     emoji: "👨‍🍳", desc: "Cook 100 dishes",                  reward: { coins: 150, xp: 50 }, target: 100, stat: "cooked" },
    { id: "perfectionist",  name: "Perfectionist",   emoji: "✨", desc: "Plate 25 dishes at the perfect moment", reward: { coins: 120, xp: 40 }, target: 25, stat: "perfect" },
    { id: "first_guest",    name: "First Customer",  emoji: "🍽️", desc: "Serve your first guest",           reward: { coins: 15,  xp: 5 },  target: 1,   stat: "served" },
    { id: "busy_night",     name: "Busy Night",      emoji: "🔥", desc: "Serve 100 guests",                  reward: { coins: 200, xp: 60 }, target: 100, stat: "served" },
    { id: "regulars",       name: "Regulars",        emoji: "💚", desc: "Serve 400 guests",                  reward: { coins: 500, xp: 120 }, target: 400, stat: "served" },
    { id: "hot_streak",     name: "Hot Streak",      emoji: "🌶️", desc: "Reach a 10-serve combo",           reward: { coins: 80,  xp: 25 }, target: 10,  stat: "bestCombo" },
    { id: "critics_choice", name: "Critic's Choice", emoji: "🎩", desc: "Impress 5 food critics",            reward: { coins: 250, xp: 60 }, target: 5,   stat: "criticsServed" },
    { id: "quest_runner",   name: "Quest Runner",    emoji: "📜", desc: "Complete 10 daily orders",          reward: { coins: 150, xp: 40 }, target: 10,  stat: "quests" },
    { id: "silver_service", name: "Silver Service",  emoji: "🥈", desc: "Reach Silver reputation",           reward: { coins: 50,  xp: 15 }, target: 100, field: "reputation" },
    { id: "golden_standard",name: "Golden Standard", emoji: "🥇", desc: "Reach Gold reputation",             reward: { coins: 150, xp: 40 }, target: 250, field: "reputation" },
    { id: "platinum_plate", name: "Platinum Plate",  emoji: "💎", desc: "Reach Platinum reputation",         reward: { coins: 300, xp: 80 }, target: 500, field: "reputation" },
    { id: "full_house",     name: "Full House",      emoji: "🪑", desc: "Own all 8 dining tables",           reward: { coins: 100, xp: 25 }, target: 8,   field: "maxTables" },
    { id: "land_baron",     name: "Land Baron",      emoji: "🪵", desc: "Till all 12 garden plots",          reward: { coins: 100, xp: 25 }, target: 12,  field: "maxPlots" },
    { id: "fully_staffed",  name: "Fully Staffed",   emoji: "🧑‍🍳", desc: "Hire 3 chefs and 3 servers",      reward: { coins: 200, xp: 50 }, target: 6,   custom: "staff" },
    { id: "fresh_start",    name: "Fresh Start",     emoji: "⭐", desc: "Prestige for the first time",       reward: { coins: 100, xp: 0 },  target: 1,   field: "prestige" }
  ];

  SS.REP_TIERS = [
    { min: 0,   name: "Bronze",   emoji: "🥉", color: "#CB9A63", spawnMult: 1.00, tipBonus: 1.00, criticChance: 0.00 },
    { min: 100, name: "Silver",   emoji: "🥈", color: "#B8C2D1", spawnMult: 0.90, tipBonus: 1.00, criticChance: 0.05 },
    { min: 250, name: "Gold",     emoji: "🥇", color: "#FFC72C", spawnMult: 0.80, tipBonus: 1.05, criticChance: 0.08 },
    { min: 500, name: "Platinum", emoji: "💎", color: "#4BD6C8", spawnMult: 0.70, tipBonus: 1.10, criticChance: 0.12 }
  ];

  /* Guest archetypes. Weight is the relative spawn chance. */
  SS.GUEST_TYPES = [
    { id: "regular", name: "Regular",  emoji: "🙂", weight: 60, patience: 1.0, tip: 1.0, rep: 2,  xp: 1.0, desc: "An everyday diner." },
    { id: "kid",     name: "Kid",      emoji: "🧒", weight: 14, patience: 1.4, tip: 0.7, rep: 2,  xp: 0.8, desc: "Patient, but pays pocket money." },
    { id: "foodie",  name: "Foodie",   emoji: "🤩", weight: 14, patience: 0.75, tip: 1.6, rep: 4,  xp: 1.3, desc: "Impatient, tips generously." },
    { id: "elder",   name: "Elder",    emoji: "👵", weight: 10, patience: 1.25, tip: 1.1, rep: 3,  xp: 1.0, desc: "Takes their time and tips fairly." },
    { id: "critic",  name: "Critic",   emoji: "🎩", weight: 0,  patience: 0.6, tip: 3.0, rep: 40, xp: 2.0, desc: "A rave review is worth a fortune." }
  ];

  SS.GUEST_NAMES = ["Ada", "Bea", "Cal", "Dev", "Eli", "Fay", "Gus", "Hal", "Ivy", "Jo", "Kai", "Lu", "Mo", "Nia", "Odie", "Pip", "Quin", "Rae", "Sol", "Tia", "Uma", "Vic", "Wren", "Xio", "Yas", "Zed"];

  SS.WEATHER = [
    { id: "sunny",  name: "Sunny",       emoji: "☀️", weight: 45, grow: 1.0,  spawn: 1.0,  patience: 1.0 },
    { id: "cloudy", name: "Cloudy",      emoji: "⛅", weight: 25, grow: 1.0,  spawn: 1.0,  patience: 1.05 },
    { id: "rain",   name: "Rain",        emoji: "🌧️", weight: 20, grow: 0.75, spawn: 1.25, patience: 1.1 },
    { id: "wind",   name: "Windy",       emoji: "🍃", weight: 10, grow: 1.1,  spawn: 0.9,  patience: 0.95 }
  ];
  SS.WEATHER_MIN_MS = 90 * 1000;
  SS.WEATHER_MAX_MS = 200 * 1000;

  SS.EVENTS = [
    { id: "rush",   name: "Rush Hour",      emoji: "🏃", duration: 60000, desc: "Guests pour in and tips are up 25%!" },
    { id: "market", name: "Farmers Market", emoji: "🧺", duration: 60000, desc: "Seeds are half price!" },
    { id: "chill",  name: "Lazy Afternoon", emoji: "🍵", duration: 60000, desc: "Guests are extra patient." }
  ];
  SS.EVENT_MIN_GAP = 150 * 1000;
  SS.EVENT_MAX_GAP = 300 * 1000;

  /* Daily-order quest templates. Progress counters are scoped to the quest. */
  SS.QUEST_TEMPLATES = [
    { kind: "harvest", label: "Harvest {n} {name}", counts: [6, 9, 12] },
    { kind: "cook",    label: "Cook {n} {name}",    counts: [2, 3, 4] },
    { kind: "serve",   label: "Serve {n} guests",   counts: [4, 6, 8] },
    { kind: "earn",    label: "Earn {n} coins",     counts: [120, 220, 350] }
  ];

  SS.TUTORIAL_STEPS = [
    { text: "Tap an empty plot in the Garden and plant a seed.", check: function (s) { return s.plots.some(function (p) { return !!p; }); }, tab: "garden" },
    { text: "Tap a growing crop to water it — it grows faster!", check: function (s) { return s.stats.watered >= 1 || s.stats.harvested >= 1; }, tab: "garden" },
    { text: "Harvest it when it's ready.", check: function (s) { return s.stats.harvested >= 1; }, tab: "garden" },
    { text: "Head to the Kitchen and start cooking at a station.", check: function (s) { return s.stats.cooked >= 1 || s.stations.some(function (st) { return !!st; }); }, tab: "kitchen" },
    { text: "Collect the dish when it's done — right on time is a Perfect plate!", check: function (s) { return s.stats.cooked >= 1; }, tab: "kitchen" },
    { text: "Serve a waiting guest in the Dining Room.", check: function (s) { return s.stats.served >= 1; }, tab: "dining" }
  ];

  /* Economy constants */
  SS.C = {
    BASE_PATIENCE: 80,
    CRITIC_VALUE_MULT: 3,
    CHEF_BASE_COST: 150, CHEF_COST_STEP: 120, CHEF_WAGE: 13, CHEF_UNLOCK_LEVEL: 2,
    SERVER_BASE_COST: 120, SERVER_COST_STEP: 90, SERVER_WAGE: 10, SERVER_UNLOCK_LEVEL: 3,
    MAX_STAFF: 3,
    WAGE_INTERVAL: 60000,
    PRESTIGE_BONUS: 0.08,
    PRESTIGE_REQ: { level: 6, plots: 12, stations: 6, tables: 8 },
    MISHAP_CHANCE: 0.08,
    RUSH_RATE: 2, RUSH_MIN_COST: 5,
    EXIT_ANIM_MS: 800,
    WATER_BONUS: 0.25,          // fraction of grow time skipped by watering
    PEST_CHANCE_PER_SEC: 0.004, // per growing plot per second
    PERFECT_WINDOW_MS: 6000,    // collect within this window of done for a Perfect
    COLD_AFTER_MS: 75000,       // plated dish goes cold after this long
    COLD_PENALTY: 0.8,
    PLOT_CAP: 12, STATION_CAP: 6, TABLE_CAP: 8,
    START_COINS: 90
  };

  SS.plotCost = function (owned) { return 40 + (owned - 4) * 30; };
  SS.stationCost = function (owned) { return 150 + (owned - 2) * 100; };
  SS.tableCost = function (owned) { return 120 + (owned - 2) * 80; };
  SS.xpForLevel = function (level) { return level <= 3 ? level * 90 : level * 150; };

  SS.cropDef = function (id) { for (var i = 0; i < SS.CROPS.length; i++) if (SS.CROPS[i].id === id) return SS.CROPS[i]; return null; };
  SS.recipeDef = function (id) { for (var i = 0; i < SS.RECIPES.length; i++) if (SS.RECIPES[i].id === id) return SS.RECIPES[i]; return null; };
  SS.upgradeDef = function (id) { for (var i = 0; i < SS.UPGRADES.length; i++) if (SS.UPGRADES[i].id === id) return SS.UPGRADES[i]; return null; };
  SS.guestType = function (id) { for (var i = 0; i < SS.GUEST_TYPES.length; i++) if (SS.GUEST_TYPES[i].id === id) return SS.GUEST_TYPES[i]; return SS.GUEST_TYPES[0]; };
  SS.weatherDef = function (id) { for (var i = 0; i < SS.WEATHER.length; i++) if (SS.WEATHER[i].id === id) return SS.WEATHER[i]; return SS.WEATHER[0]; };
  SS.eventDef = function (id) { for (var i = 0; i < SS.EVENTS.length; i++) if (SS.EVENTS[i].id === id) return SS.EVENTS[i]; return null; };
})(window.SS = window.SS || {});
