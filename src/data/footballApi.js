// football-data.org API integration (v4)
// Free tier: 10 req/min, current season, top competitions

// Competition codes for football-data.org
export const LEAGUES = [
  { id: "ligue1", code: "FL1", name: "Ligue 1", flag: "🇫🇷" },
  { id: "premierleague", code: "PL", name: "Premier League", flag: "🇬🇧" },
  { id: "laliga", code: "PD", name: "La Liga", flag: "🇪🇸" },
  { id: "seriea", code: "SA", name: "Serie A", flag: "🇮🇹" },
  { id: "bundesliga", code: "BL1", name: "Bundesliga", flag: "🇩🇪" },
  { id: "ucl", code: "CL", name: "Champions League", flag: "🏆" },
];

// Fetch from our API route (never directly from football-data.org)
async function apiFetch(path) {
  const res = await fetch(`/api/football?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`API HTTP error: ${res.status}`);
  const data = await res.json();

  if (data.errorCode) {
    throw new Error(`API error ${data.errorCode}: ${data.message}`);
  }

  return data;
}

// Get recent and upcoming matches for a specific league
export async function getMatchesByLeague(leagueCode) {
  try {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 14);
    const to = new Date(today);
    to.setDate(to.getDate() + 14);

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    const data = await apiFetch(
      `competitions/${leagueCode}/matches?dateFrom=${fromStr}&dateTo=${toStr}`
    );

    const matches = data.matches || [];
    return matches.map(m => formatMatch(m)).sort((a, b) => {
      const order = { live: 0, upcoming: 1, finished: 2 };
      return (order[a.status] || 2) - (order[b.status] || 2);
    });
  } catch (error) {
    console.error(`Failed to fetch ${leagueCode}:`, error);
    return [];
  }
}

// Get lineups for a specific match
export async function getMatchLineups(matchId) {
  try {
    const data = await apiFetch(`matches/${matchId}`);
    if (!data || !data.homeTeam || !data.awayTeam) return null;

    const homeLineup = data.homeTeam.lineup || [];
    const awayLineup = data.awayTeam.lineup || [];
    if (homeLineup.length === 0 && awayLineup.length === 0) return null;

    return {
      home: {
        teamName: data.homeTeam.name,
        teamId: data.homeTeam.id,
        teamLogo: data.homeTeam.crest,
        formation: data.homeTeam.formation || '?',
        starters: homeLineup.map(p => ({
          id: `p_${p.id}`, playerId: p.id, name: p.name,
          number: p.shirtNumber, pos: mapPosition(p.position),
        })),
      },
      away: {
        teamName: data.awayTeam.name,
        teamId: data.awayTeam.id,
        teamLogo: data.awayTeam.crest,
        formation: data.awayTeam.formation || '?',
        starters: awayLineup.map(p => ({
          id: `p_${p.id}`, playerId: p.id, name: p.name,
          number: p.shirtNumber, pos: mapPosition(p.position),
        })),
      },
    };
  } catch (error) {
    console.error(`Failed to fetch lineups for match ${matchId}:`, error);
    return null;
  }
}

// Format a match from football-data.org into our app format
function formatMatch(match) {
  let status = 'upcoming';
  let minute = '';

  const liveStatuses = ['IN_PLAY', 'PAUSED', 'HALFTIME', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'];
  const finishedStatuses = ['FINISHED', 'AWARDED', 'CANCELLED'];

  if (liveStatuses.includes(match.status)) {
    status = 'live';
    minute = match.minute ? `${match.minute}'` : match.status === 'HALFTIME' ? 'MT' : 'En cours';
  } else if (finishedStatuses.includes(match.status)) {
    status = 'finished';
  }

  const matchDate = new Date(match.utcDate);
  const dateStr = matchDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const timeStr = matchDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;
  const scoreDisplay = homeScore !== null && homeScore !== undefined
    ? `${homeScore} - ${awayScore}` : '- - -';

  return {
    id: match.id.toString(),
    fixtureId: match.id,
    home: match.homeTeam?.shortName || match.homeTeam?.name || '?',
    homeId: match.homeTeam?.id,
    homeLogo: match.homeTeam?.crest || null,
    away: match.awayTeam?.shortName || match.awayTeam?.name || '?',
    awayId: match.awayTeam?.id,
    awayLogo: match.awayTeam?.crest || null,
    score: scoreDisplay,
    date: dateStr,
    time: timeStr,
    status,
    minute,
    matchday: match.matchday,
    round: match.stage || `Journée ${match.matchday}`,
  };
}

function mapPosition(pos) {
  if (!pos) return '?';
  const map = {
    'Goalkeeper': 'GK',
    'Defence': 'DEF', 'Left-Back': 'DEF', 'Right-Back': 'DEF', 'Centre-Back': 'DEF',
    'Midfield': 'MIL', 'Central Midfield': 'MIL', 'Attacking Midfield': 'MIL',
    'Defensive Midfield': 'MIL', 'Left Midfield': 'MIL', 'Right Midfield': 'MIL',
    'Offence': 'ATT', 'Centre-Forward': 'ATT', 'Left Winger': 'ATT', 'Right Winger': 'ATT',
  };
  return map[pos] || pos.substring(0, 3).toUpperCase();
}
