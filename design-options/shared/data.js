/*
 * Shared content for every design option.
 * One place for the facts, so all ten pages say the same thing.
 * Numbers are a snapshot (see `snapshot`); the final site refreshes them automatically.
 */
window.SITE = {
  snapshot: "2026-11-17",

  me: {
    name: "Iman Khoshabi",
    handle: "imaNNeo",
    aka: "imaN Neo",
    role: "Senior mobile engineer",
    city: "Amsterdam",
    years: "10+",
    email: "iman.neofight@gmail.com"
  },

  links: {
    games: "https://games.imanneo.dev/",
    github: "https://github.com/imaNNeo",
    youtube: "https://www.youtube.com/@imaNNeO",
    linkedin: "https://www.linkedin.com/in/iman-khoshabi-7782a9114",
    x: "https://twitter.com/iman__neo",
    blog: "https://flutter4fun.com",
    newsletter: "https://iman-khoshabi.kit.com/profile",
    sponsor: "https://github.com/sponsors/imaNNeo",
    mail: "mailto:iman.neofight@gmail.com"
  },

  /* The social links the current site already has, in the same order, plus mail. */
  socials: [
    { id: "youtube", label: "YouTube", handle: "@imaNNeO", note: "Flutter and game dev videos", url: "https://www.youtube.com/@imaNNeO" },
    { id: "github", label: "GitHub", handle: "imaNNeo", note: "fl_chart and the rest of my code", url: "https://github.com/imaNNeo" },
    { id: "linkedin", label: "LinkedIn", handle: "Iman Khoshabi", note: "The work side of things", url: "https://www.linkedin.com/in/iman-khoshabi-7782a9114" },
    { id: "x", label: "X", handle: "@iman__neo", note: "Short updates", url: "https://twitter.com/iman__neo" },
    { id: "blog", label: "Flutter 4 Fun", handle: "flutter4fun.com", note: "UI challenges, solved in Flutter", url: "https://flutter4fun.com" },
    { id: "mail", label: "Email", handle: "iman.neofight@gmail.com", note: "My inbox is open", url: "mailto:iman.neofight@gmail.com" }
  ],

  fl: {
    name: "fl_chart",
    tagline: "A highly customizable chart library for Flutter.",
    repo: "https://github.com/imaNNeo/fl_chart",
    pub: "https://pub.dev/packages/fl_chart",
    docs: "https://flchart.dev",
    demo: "https://app.flchart.dev",
    stars: 7600, starsLabel: "7.6k",
    forks: 2000, forksLabel: "2.0k",
    commits: 1982,
    likes: 7209, likesLabel: "7.2k",
    points: 150, maxPoints: 160,
    downloads30: 2349795, downloadsLabel: "2.3M",
    version: "1.3.1", versionDate: "2026-11-09",
    first: "2019-06-03", since: 2019,
    releases: 107,
    perYear: [[2019, 32], [2020, 22], [2021, 15], [2022, 14], [2023, 7], [2024, 8], [2025, 6], [2026, 3]],
    types: ["Line", "Bar", "Pie", "Scatter", "Radar", "Candlestick"],
    platforms: ["Android", "iOS", "Web", "macOS", "Windows", "Linux"],
    license: "MIT"
  },

  /* First four are the main games; the rest are small browser games. */
  games: [
    { id: "flappy-dash", title: "Flappy Dash", genre: "Arcade", featured: true, tag: "Multiplayer", tech: "Flutter", blurb: "Flap through the pipes with players from all over the world, live." },
    { id: "ttg", title: "Through The Galaxies", genre: "Arcade", featured: true, tag: "iOS and Android", tech: "Flutter", blurb: "Launch your little rocket from planet to planet." },
    { id: "save-the-potato", title: "Save The Potato", genre: "Arcade", featured: true, tag: "Flame Jam 3 winner", tech: "Flutter + Flame", blurb: "Spin the shield and block the fire and ice orbs." },
    { id: "trickle", title: "Trickle", genre: "Puzzle", featured: true, tag: "3D puzzle", tech: "Babylon.js", blurb: "Dig trenches so the water reaches the thirsty trees." },
    { id: "dart-pop", title: "Dart Pop", genre: "Puzzle", blurb: "One dart, a whole bunch of balloons." },
    { id: "big-baby", title: "Big Baby", genre: "Casual", blurb: "Feed a hungry baby until it can eat the Sun." },
    { id: "chess-hop", title: "Chess Hop", genre: "Puzzle", blurb: "84 bite-size puzzles with real chess moves." },
    { id: "crackle", title: "Crackle", genre: "Puzzle", blurb: "Slide a penguin chick across thin ice to his mum." },
    { id: "feed-me", title: "Feed Me", genre: "Kids", blurb: "Give each hungry animal the food it really eats." },
    { id: "frog-lick", title: "Frog Lick", genre: "Arcade", blurb: "One tap shoots the tongue. Catch bugs, not bees." },
    { id: "gladi-dash", title: "Gladi Dash", genre: "Action", blurb: "Draw a line and your gladiator dashes along it." },
    { id: "goo-drop", title: "Goo Drop", genre: "Puzzle", blurb: "Flick jellies at a honey ceiling and merge them." },
    { id: "jelly-out", title: "Jelly Out", genre: "Puzzle", blurb: "Slide wobbly jelly blocks off the tray." },
    { id: "lint-roll", title: "Lint Roll", genre: "Relaxing", blurb: "Roll up pet hair and peel off fuzzy sheets." },
    { id: "pancake-lasso", title: "Pancake Lasso", genre: "Cooking", blurb: "Lasso the toppings each customer wants." },
    { id: "pond-picnic", title: "Pond Picnic", genre: "Kids", blurb: "Feed the animals and the grey pond blooms." },
    { id: "rope-lift", title: "Rope Lift", genre: "Puzzle", blurb: "Untangle the pile, one rope at a time." },
    { id: "shear", title: "Shear", genre: "Relaxing", blurb: "Shear the wool off in one long fuzzy rope." },
    { id: "shine", title: "Shine", genre: "Relaxing", blurb: "Polish a mirror until a face appears." },
    { id: "slurp", title: "Slurp", genre: "Casual", blurb: "Steer a vacuum hose and slurp up everything." },
    { id: "snack-belt", title: "Snack Belt", genre: "Puzzle", blurb: "Sort snacks on a sushi-style belt." },
    { id: "snip", title: "Snip", genre: "Relaxing", blurb: "Trim a hedge to find the animal inside." },
    { id: "territory-capture", title: "Territory Capture", genre: "Strategy", blurb: "Draw a loop, capture the land, trap rivals." },
    { id: "volcano-escape", title: "Volcano Escape", genre: "Action", blurb: "Slingshot a water drop up before the lava rises." }
  ],

  gameUrl: function (id) { return "https://games.imanneo.dev/play/" + id + "/"; },
  gameImg: function (id, base) { return (base || "../shared/img/games/") + id + ".webp"; },
  fmt: function (n) { return Number(n).toLocaleString("en-US"); }
};
