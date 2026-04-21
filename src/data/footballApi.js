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

// Get squads for both teams in a match
// Free plan doesn't include lineups, so we fetch full team squads instead
export async function getMatchLineups(matchId, homeTeamId, awayTeamId) {
  try {
    // Fetch both team squads in parallel
    const [homeData, awayData] = await Promise.all([
      homeTeamId ? apiFetch(`teams/${homeTeamId}`) : null,
      awayTeamId ? apiFetch(`teams/${awayTeamId}`) : null,
    ]);

    if (!homeData && !awayData) return null;

    const formatSquad = (teamData) => {
      if (!teamData || !teamData.squad) return null;
      
      // Sort: GK first, then DEF, MIL, ATT
      const posOrder = { 'GK': 0, 'DEF': 1, 'MIL': 2, 'ATT': 3 };
      const players = teamData.squad
        .filter(p => p.name) // Filter out empty entries
        .map(p => ({
          id: `p_${p.id}`,
          playerId: p.id,
          name: p.name,
          number: p.shirtNumber || null,
          pos: mapPosition(p.position),
        }))
        .sort((a, b) => (posOrder[a.pos] || 9) - (posOrder[b.pos] || 9));

      return {
        teamName: teamData.shortName || teamData.name,
        teamId: teamData.id,
        teamLogo: teamData.crest,
        formation: null,
        starters: players,
      };
    };

    return {
      home: formatSquad(homeData),
      away: formatSquad(awayData),
    };
  } catch (error) {
    console.error(`Failed to fetch squads for match ${matchId}:`, error);
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
    utcDate: match.utcDate,
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
