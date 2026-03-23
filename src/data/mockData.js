export const LEAGUES = [
  { id: "ligue1", name: "Ligue 1", flag: "🇫🇷" },
  { id: "premierleague", name: "Premier League", flag: "🇬🇧" },
  { id: "laliga", name: "La Liga", flag: "🇪🇸" },
  { id: "seriea", name: "Serie A", flag: "🇮🇹" },
  { id: "bundesliga", name: "Bundesliga", flag: "🇩🇪" },
  { id: "ucl", name: "Champions League", flag: "🏆" },
  { id: "uel", name: "Europa League", flag: "🥈" },
];

export const MOCK_MATCHES = {
  ligue1: [
    { id: "l1m1", home: "PSG", away: "OM", score: "2 - 1", date: "23 Mars", status: "live", minute: "67'" },
    { id: "l1m2", home: "OL", away: "LOSC", score: "1 - 1", date: "23 Mars", status: "live", minute: "45'" },
    { id: "l1m3", home: "Monaco", away: "Lens", score: "0 - 0", date: "24 Mars", status: "upcoming" },
  ],
  premierleague: [
    { id: "plm1", home: "Arsenal", away: "Liverpool", score: "3 - 2", date: "22 Mars", status: "finished" },
    { id: "plm2", home: "Man City", away: "Chelsea", score: "1 - 0", date: "23 Mars", status: "live", minute: "78'" },
  ],
  laliga: [
    { id: "llm1", home: "Real Madrid", away: "Barcelona", score: "2 - 2", date: "22 Mars", status: "finished" },
    { id: "llm2", home: "Atletico", away: "Sevilla", score: "1 - 0", date: "23 Mars", status: "live", minute: "55'" },
  ],
  seriea: [
    { id: "sam1", home: "Inter", away: "AC Milan", score: "1 - 1", date: "23 Mars", status: "live", minute: "32'" },
    { id: "sam2", home: "Juventus", away: "Napoli", score: "0 - 2", date: "22 Mars", status: "finished" },
  ],
  bundesliga: [
    { id: "bm1", home: "Bayern", away: "Dortmund", score: "3 - 1", date: "22 Mars", status: "finished" },
    { id: "bm2", home: "Leverkusen", away: "Leipzig", score: "0 - 0", date: "24 Mars", status: "upcoming" },
  ],
  ucl: [
    { id: "uclm1", home: "PSG", away: "Man City", score: "1 - 1", date: "22 Mars", status: "finished" },
    { id: "uclm2", home: "Real Madrid", away: "Bayern", score: "2 - 0", date: "22 Mars", status: "finished" },
  ],
  uel: [
    { id: "uelm1", home: "OL", away: "Roma", score: "2 - 1", date: "21 Mars", status: "finished" },
  ],
};

export const MOCK_PLAYERS = {
  l1m1: {
    home: [
      { id: "p1", name: "Donnarumma", pos: "GK" },
      { id: "p2", name: "Hakimi", pos: "DEF" },
      { id: "p3", name: "Marquinhos", pos: "DEF" },
      { id: "p4", name: "Skriniar", pos: "DEF" },
      { id: "p5", name: "N. Mendes", pos: "DEF" },
      { id: "p6", name: "Vitinha", pos: "MIL" },
      { id: "p7", name: "Zaïre-Emery", pos: "MIL" },
      { id: "p8", name: "J. Neves", pos: "MIL" },
      { id: "p9", name: "Dembélé", pos: "ATT" },
      { id: "p10", name: "Asensio", pos: "ATT" },
      { id: "p11", name: "Barcola", pos: "ATT" },
    ],
    away: [
      { id: "p12", name: "Pau López", pos: "GK" },
      { id: "p13", name: "Murillo", pos: "DEF" },
      { id: "p14", name: "Balerdi", pos: "DEF" },
      { id: "p15", name: "Meïté", pos: "DEF" },
      { id: "p16", name: "Merlin", pos: "DEF" },
      { id: "p17", name: "Kondogbia", pos: "MIL" },
      { id: "p18", name: "Rongier", pos: "MIL" },
      { id: "p19", name: "Harit", pos: "MIL" },
      { id: "p20", name: "Greenwood", pos: "ATT" },
      { id: "p21", name: "Aubameyang", pos: "ATT" },
      { id: "p22", name: "Moumbagna", pos: "ATT" },
    ],
  },
};

export const REACTION_EMOJIS = ["😂", "👏", "🔥", "😡", "💀", "🤡", "❤️", "😮"];

export const MOCK_COMMENTS = [
  { id: "c1", user: "LeFan_75", text: "Dembélé en feu ce soir 🔥", time: "2 min", reactions: { "🔥": 87, "👏": 42, "❤️": 15 } },
  { id: "c2", user: "OM4ever", text: "L'arbitre est scandaleux...", time: "5 min", reactions: { "😡": 134, "🤡": 98, "👏": 23 } },
  { id: "c3", user: "FootAnalyst", text: "Tactiquement PSG domine le milieu, Vitinha c'est un patron, il récupère chaque ballon et relance en une touche. Zaïre-Emery impressionnant aussi pour son âge.", time: "8 min", reactions: { "👏": 203, "🔥": 67, "😮": 31 } },
  { id: "c4", user: "Kop_Nord", text: "Greenwood trop seul devant", time: "12 min", reactions: { "👏": 18, "😡": 12 } },
  { id: "c5", user: "TacticienFou", text: "Skriniar en mode touriste, il regarde les avions passer 😭✈️", time: "15 min", reactions: { "😂": 312, "💀": 187, "🤡": 56, "🔥": 12 } },
  { id: "c6", user: "ZizouVision", text: "Barcola côté gauche c'est un cheat code, personne peut le suivre", time: "18 min", reactions: { "🔥": 94, "👏": 76, "❤️": 28 } },
  { id: "c7", user: "Madridista_9", text: "Honnêtement PSG-OM sans Mbappé c'est plus pareil, y'a plus cette tension", time: "22 min", reactions: { "😡": 45, "👏": 32, "😂": 11 } },
];

export const LEADERBOARD = [
  { rank: 1, name: "ZizouVision", pts: 12840, badges: ["🏆", "👁️", "⚡"], matchesRated: 342 },
  { rank: 2, name: "LeFan_75", pts: 11230, badges: ["🥈", "🎯"], matchesRated: 298 },
  { rank: 3, name: "TacticienFou", pts: 10780, badges: ["🥉", "👁️"], matchesRated: 276 },
  { rank: 4, name: "KopNord_Ultra", pts: 9450, badges: ["⚡"], matchesRated: 251 },
  { rank: 5, name: "OM4ever", pts: 8920, badges: ["🎯"], matchesRated: 234 },
  { rank: 6, name: "FootAnalyst", pts: 8340, badges: ["👁️"], matchesRated: 212 },
  { rank: 7, name: "Madridista_9", pts: 7650, badges: [], matchesRated: 189 },
  { rank: 8, name: "Toi", pts: 2450, badges: ["🌱"], matchesRated: 47, isUser: true },
];

export const BADGES_INFO = [
  { icon: "🏆", name: "Siffleur d'Or", desc: "Top 1 du classement mensuel" },
  { icon: "👁️", name: "Œil de Lynx", desc: "Notes à ±0.5 de la moyenne 50 fois" },
  { icon: "🎯", name: "Sniper", desc: "10 pronostics exacts d'affilée" },
  { icon: "⚡", name: "Assidu", desc: "Présent 30 journées consécutives" },
  { icon: "🌱", name: "Rookie", desc: "Bienvenue sur LeSifflet !" },
  { icon: "🥈", name: "Podium Argent", desc: "Top 3 mensuel" },
  { icon: "🥉", name: "Podium Bronze", desc: "Top 3 mensuel" },
];

export const BEST_XI = {
  league: "Ligue 1 — Journée 28",
  formation: "4-3-3",
  players: [
    { name: "Donnarumma", pos: "GK", club: "PSG", avg: 8.2, votes: 1843 },
    { name: "Hakimi", pos: "DD", club: "PSG", avg: 7.9, votes: 1756 },
    { name: "Saliba", pos: "DC", club: "Arsenal", avg: 8.4, votes: 2103 },
    { name: "Badiashile", pos: "DC", club: "Monaco", avg: 7.6, votes: 1289 },
    { name: "T. Hernandez", pos: "DG", club: "AC Milan", avg: 7.8, votes: 1534 },
    { name: "Vitinha", pos: "MIL", club: "PSG", avg: 8.7, votes: 2341 },
    { name: "Tchouaméni", pos: "MIL", club: "R. Madrid", avg: 8.1, votes: 1987 },
    { name: "Pedri", pos: "MIL", club: "Barcelona", avg: 8.3, votes: 2156 },
    { name: "Dembélé", pos: "ATT", club: "PSG", avg: 9.1, votes: 2876 },
    { name: "Haaland", pos: "ATT", club: "Man City", avg: 8.8, votes: 2654 },
    { name: "Barcola", pos: "ATT", club: "PSG", avg: 8.5, votes: 2234 },
  ],
};

export function generatePlayers(matchId) {
  if (MOCK_PLAYERS[matchId]) return MOCK_PLAYERS[matchId];
  const positions = ["GK", "DEF", "DEF", "DEF", "DEF", "MIL", "MIL", "MIL", "ATT", "ATT", "ATT"];
  const homeNames = ["Garcia", "Martin", "Dubois", "Petit", "Lefèvre", "Moreau", "Simon", "Laurent", "Michel", "Leroy", "Roux"];
  const awayNames = ["Schmidt", "Müller", "Santos", "Rossi", "Andersson", "Kovac", "Nielsen", "Oliveira", "Dumont", "Berg", "Torres"];
  const make = (prefix, names) => positions.map((pos, i) => ({ id: `${matchId}_${prefix}_${i}`, name: names[i], pos }));
  return { home: make("h", homeNames), away: make("a", awayNames) };
}
