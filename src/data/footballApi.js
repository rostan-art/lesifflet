// League IDs in API-Football
export const LEAGUE_IDS = {
  ligue1: 61,
  premierleague: 39,
  laliga: 140,
  seriea: 135,
  bundesliga: 78,
  ucl: 2,
  uel: 3,
};

export const LEAGUES = [
  { id: "ligue1", apiId: 61, name: "Ligue 1", flag: "🇫🇷" },
  { id: "premierleague", apiId: 39, name: "Premier League", flag: "🇬🇧" },
  { id: "laliga", apiId: 140, name: "La Liga", flag: "🇪🇸" },
  { id: "seriea", apiId: 135, name: "Serie A", flag: "🇮🇹" },
  { id: "bundesliga", apiId: 78, name: "Bundesliga", flag: "🇩🇪" },
  { id: "ucl", apiId: 2, name: "Champions League", flag: "🏆" },
  { id: "uel", apiId: 3, name: "Europa League", flag: "🥈" },
];

// Current season for each league
export function getCurrentSeason(leagueId) {
  // UCL/UEL use the starting year of the season
  if (leagueId === 2 || leagueId === 3) return 2025;
  return 2025;
}

// Fetch from our API route (never directly from API-Football)
async function apiFetch(endpoint, params = {}) {
  const searchParams = new URLSearchParams({ endpoint, ...params });
  const res = await fetch(`/api/football?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.response || [];
}

// Get today's matches for a specific league
export async function getMatchesByLeague(leagueApiId) {
  const season = getCurrentSeason(leagueApiId);
  
  // Get matches from today and nearby dates (last 2 days + next 2 days)
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 2);
  const to = new Date(today);
  to.setDate(to.getDate() + 2);
  
  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  const fixtures = await apiFetch('fixtures', {
    league: leagueApiId,
    season: season,
    from: fromStr,
    to: toStr,
    timezone: 'Europe/Paris',
  });

  return fixtures.map(f => formatMatch(f));
}

// Get live matches across all our leagues
export async function getLiveMatches() {
  const leagueIds = Object.values(LEAGUE_IDS).join('-');
  const fixtures = await apiFetch('fixtures', { live: leagueIds });
  return fixtures.map(f => formatMatch(f));
}

// Get lineups for a specific match
export async function getMatchLineups(fixtureId) {
  const lineups = await apiFetch('fixtures/lineups', { fixture: fixtureId });
  
  if (!lineups || lineups.length === 0) return null;

  return {
    home: lineups[0] ? formatLineup(lineups[0]) : null,
    away: lineups[1] ? formatLineup(lineups[1]) : null,
  };
}

// Get match events (goals, cards, subs)
export async function getMatchEvents(fixtureId) {
  const events = await apiFetch('fixtures/events', { fixture: fixtureId });
  return events;
}

// Format a fixture from API-Football into our app format
function formatMatch(fixture) {
  const f = fixture.fixture;
  const teams = fixture.teams;
  const goals = fixture.goals;
  const league = fixture.league;

  let status = 'upcoming';
  let minute = '';
  
  // API-Football status codes
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'];
  const finishedStatuses = ['FT', 'AET', 'PEN'];
  
  if (liveStatuses.includes(f.status?.short)) {
    status = 'live';
    minute = f.status?.elapsed ? `${f.status.elapsed}'` : 'En cours';
  } else if (finishedStatuses.includes(f.status?.short)) {
    status = 'finished';
  }

  const matchDate = new Date(f.date);
  const dateStr = matchDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const timeStr = matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const homeScore = goals.home !== null ? goals.home : '-';
  const awayScore = goals.away !== null ? goals.away : '-';

  return {
    id: f.id.toString(),
    fixtureId: f.id,
    home: teams.home.name,
    homeId: teams.home.id,
    homeLogo: teams.home.logo,
    away: teams.away.name,
    awayId: teams.away.id,
    awayLogo: teams.away.logo,
    score: `${homeScore} - ${awayScore}`,
    date: dateStr,
    time: timeStr,
    status,
    minute,
    leagueId: league.id,
    leagueName: league.name,
    leagueLogo: league.logo,
    round: league.round,
  };
}

// Format lineup data
function formatLineup(teamLineup) {
  const formation = teamLineup.formation;
  const starters = (teamLineup.startXI || []).map((p, i) => ({
    id: `p_${p.player.id}`,
    playerId: p.player.id,
    name: p.player.name,
    number: p.player.number,
    pos: mapPosition(p.player.pos),
    photo: null, // Could add player photos with another API call
  }));

  const subs = (teamLineup.substitutes || []).map((p, i) => ({
    id: `sub_${p.player.id}`,
    playerId: p.player.id,
    name: p.player.name,
    number: p.player.number,
    pos: mapPosition(p.player.pos),
  }));

  return {
    teamName: teamLineup.team.name,
    teamId: teamLineup.team.id,
    teamLogo: teamLineup.team.logo,
    formation,
    starters,
    subs,
  };
}

// Map API-Football positions to our format
function mapPosition(pos) {
  const map = { G: 'GK', D: 'DEF', M: 'MIL', F: 'ATT' };
  return map[pos] || pos || '?';
}
