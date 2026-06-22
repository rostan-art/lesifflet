// football-data.org API integration (v4)
// Free + Deep Data tier: 30 req/min, line-ups, scorers, cards

// Competition codes for football-data.org
export const LEAGUES = [
  { id: "worldcup", code: "WC", name: "Coupe du Monde", flag: "🌍" },
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

// Get fresh data for a single match by id (refreshes a favorite's score/status)
export async function getMatchById(matchId) {
  try {
    const data = await apiFetch(`matches/${matchId}`);
    if (!data || !data.id) return null;
    return formatMatch(data);
  } catch (error) {
    console.error(`Failed to fetch match ${matchId}:`, error);
    return null;
  }
}

// Get official competition emblems (logos) from football-data.org in one call.
// Returns a map { leagueCode: emblemUrl } — same legal source as club crests.
export async function getCompetitionEmblems() {
  try {
    const data = await apiFetch('competitions');
    const map = {};
    (data.competitions || []).forEach(c => {
      if (c.code && c.emblem) map[c.code] = c.emblem;
    });
    return map;
  } catch (error) {
    console.error('Failed to fetch competition emblems:', error);
    return {};
  }
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

// Get the real match lineup (Deep Data plan: line-ups, bench & substitutions)
// Returns only players who actually played: starters + subs who came on.
// Falls back to full team squads if lineups aren't published yet.
export async function getMatchLineups(matchId, homeTeamId, awayTeamId) {
  try {
    // First, try the match detail endpoint which includes lineups on Deep Data
    const matchData = await apiFetch(`matches/${matchId}`);

    const hasLineups =
      matchData &&
      ((matchData.homeTeam?.lineup && matchData.homeTeam.lineup.length > 0) ||
        (matchData.awayTeam?.lineup && matchData.awayTeam.lineup.length > 0));

    if (hasLineups) {
      // Build set of player IDs who entered via substitution (playerIn)
      const subsInIds = new Set();
      const subsByTeam = { home: [], away: [] };
      const allSubs = matchData.substitutions || [];
      allSubs.forEach(s => {
        const inId = s.playerIn?.id;
        if (inId) subsInIds.add(inId);
      });

      const posOrder = { 'GK': 0, 'DEF': 1, 'MIL': 2, 'ATT': 3 };

      const formatLineup = (teamObj) => {
        if (!teamObj) return null;
        const starters = teamObj.lineup || [];
        const bench = teamObj.bench || [];

        // Players who played = all starters + bench players who came on
        const playedBench = bench.filter(p => subsInIds.has(p.id));
        const played = [...starters, ...playedBench];

        const players = played
          .filter(p => p.name)
          .map(p => ({
            id: `p_${p.id}`,
            playerId: p.id,
            name: p.name,
            number: p.shirtNumber || null,
            pos: mapPosition(p.position),
            isSub: subsInIds.has(p.id), // entered as substitute
          }))
          .sort((a, b) => (posOrder[a.pos] || 9) - (posOrder[b.pos] || 9));

        return {
          teamName: translateTeam(teamObj.shortName || teamObj.name),
          teamId: teamObj.id,
          teamLogo: teamObj.crest,
          formation: teamObj.formation || null,
          starters: players,
          hasRealLineup: true,
        };
      };

      // Extract goals with scorer name + minute (Deep Data goals array)
      const goals = (matchData.goals || []).map(g => ({
        minute: g.minute != null ? g.minute : null,
        scorer: g.scorer?.name || '?',
        assist: g.assist?.name || null,
        teamId: g.team?.id || null,
        type: g.type || 'REGULAR',
      }));

      return {
        home: formatLineup(matchData.homeTeam),
        away: formatLineup(matchData.awayTeam),
        goals,
        homeTeamId: matchData.homeTeam?.id || null,
        awayTeamId: matchData.awayTeam?.id || null,
      };
    }

    // Fallback: fetch full team squads (lineups not published yet)
    const [homeData, awayData] = await Promise.all([
      homeTeamId ? apiFetch(`teams/${homeTeamId}`) : null,
      awayTeamId ? apiFetch(`teams/${awayTeamId}`) : null,
    ]);

    if (!homeData && !awayData) return null;

    const formatSquad = (teamData) => {
      if (!teamData || !teamData.squad) return null;
      const posOrder = { 'GK': 0, 'DEF': 1, 'MIL': 2, 'ATT': 3 };
      const players = teamData.squad
        .filter(p => p.name)
        .map(p => ({
          id: `p_${p.id}`,
          playerId: p.id,
          name: p.name,
          number: p.shirtNumber || null,
          pos: mapPosition(p.position),
          isSub: false,
        }))
        .sort((a, b) => (posOrder[a.pos] || 9) - (posOrder[b.pos] || 9));

      return {
        teamName: translateTeam(teamData.shortName || teamData.name),
        teamId: teamData.id,
        teamLogo: teamData.crest,
        formation: null,
        starters: players,
        hasRealLineup: false,
      };
    };

    // Goals are available from match detail even without lineups
    const fallbackGoals = (matchData?.goals || []).map(g => ({
      minute: g.minute != null ? g.minute : null,
      scorer: g.scorer?.name || '?',
      assist: g.assist?.name || null,
      teamId: g.team?.id || null,
      type: g.type || 'REGULAR',
    }));

    return {
      home: formatSquad(homeData),
      away: formatSquad(awayData),
      goals: fallbackGoals,
      homeTeamId: matchData?.homeTeam?.id || homeTeamId || null,
      awayTeamId: matchData?.awayTeam?.id || awayTeamId || null,
    };
  } catch (error) {
    console.error(`Failed to fetch lineups for match ${matchId}:`, error);
    return null;
  }
}

// Format a match from football-data.org into our app format
// Translate national team names to French (World Cup uses English names)
const COUNTRY_FR = {
  'Germany': 'Allemagne', 'Spain': 'Espagne', 'England': 'Angleterre',
  'Belgium': 'Belgique', 'Croatia': 'Croatie', 'Denmark': 'Danemark',
  'Netherlands': 'Pays-Bas', 'Switzerland': 'Suisse', 'Wales': 'Pays de Galles',
  'Brazil': 'Brésil', 'Argentina': 'Argentine', 'Mexico': 'Mexique',
  'United States': 'États-Unis', 'USA': 'États-Unis', 'Canada': 'Canada',
  'Morocco': 'Maroc', 'Senegal': 'Sénégal', 'Tunisia': 'Tunisie',
  'Cameroon': 'Cameroun', 'Ghana': 'Ghana', 'Egypt': 'Égypte',
  'Ivory Coast': 'Côte d\'Ivoire', 'Algeria': 'Algérie', 'Nigeria': 'Nigéria',
  'South Korea': 'Corée du Sud', 'Japan': 'Japon', 'Australia': 'Australie',
  'Saudi Arabia': 'Arabie Saoudite', 'Iran': 'Iran', 'Qatar': 'Qatar',
  'Poland': 'Pologne', 'Portugal': 'Portugal', 'Serbia': 'Serbie',
  'Sweden': 'Suède', 'Norway': 'Norvège', 'Austria': 'Autriche',
  'Czech Republic': 'République Tchèque', 'Ukraine': 'Ukraine', 'Turkey': 'Turquie',
  'Scotland': 'Écosse', 'Ireland': 'Irlande', 'Greece': 'Grèce',
  'Italy': 'Italie', 'France': 'France', 'Uruguay': 'Uruguay',
  'Colombia': 'Colombie', 'Chile': 'Chili', 'Peru': 'Pérou',
  'Ecuador': 'Équateur', 'Paraguay': 'Paraguay', 'Costa Rica': 'Costa Rica',
  'Panama': 'Panama', 'Jamaica': 'Jamaïque', 'New Zealand': 'Nouvelle-Zélande',
  'South Africa': 'Afrique du Sud', 'Cape Verde': 'Cap-Vert', 'Russia': 'Russie',
  'Hungary': 'Hongrie', 'Romania': 'Roumanie', 'Slovakia': 'Slovaquie',
  'Slovenia': 'Slovénie', 'Iceland': 'Islande', 'Finland': 'Finlande',
};

function translateTeam(name) {
  if (!name) return name;
  return COUNTRY_FR[name] || name;
}

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
    home: translateTeam(match.homeTeam?.shortName || match.homeTeam?.name) || '?',
    homeId: match.homeTeam?.id,
    homeLogo: match.homeTeam?.crest || null,
    away: translateTeam(match.awayTeam?.shortName || match.awayTeam?.name) || '?',
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

// ── COMPETITION STATS (for empty-state fallbacks) ──

// Top scorers of a competition (e.g. World Cup). Used to fill the Top Players
// carousel with real data even when the community hasn't rated anyone yet.
export async function getTopScorers(leagueCode, limit = 5) {
  try {
    const data = await apiFetch(`competitions/${leagueCode}/scorers?limit=${limit}`);
    const scorers = data.scorers || [];
    return scorers.map(s => ({
      playerName: s.player?.name || '?',
      teamName: translateTeam(s.team?.shortName || s.team?.name) || '',
      teamCrest: s.team?.crest || null,
      goals: s.goals || 0,
      assists: s.assists || 0,
      playedMatches: s.playedMatches || 0,
    }));
  } catch (error) {
    console.error(`Failed to fetch scorers for ${leagueCode}:`, error);
    return [];
  }
}

// Most spectacular finished matches of a competition, ranked by total goals.
// Used to fill the Top Matches carousel with real data before community votes.
export async function getSpectacularMatches(leagueCode, limit = 5) {
  try {
    // Look back over the whole tournament window (last 60 days)
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 60);
    const fromStr = from.toISOString().split('T')[0];
    const toStr = today.toISOString().split('T')[0];

    const data = await apiFetch(
      `competitions/${leagueCode}/matches?dateFrom=${fromStr}&dateTo=${toStr}&status=FINISHED`
    );
    const matches = (data.matches || [])
      .map(m => formatMatch(m))
      .filter(m => m.status === 'finished');

    // Rank by total goals (most goals = most spectacular)
    const withGoals = matches.map(m => {
      const parts = (m.score || '0 - 0').split('-').map(s => parseInt(s.trim()) || 0);
      const total = (parts[0] || 0) + (parts[1] || 0);
      return { ...m, totalGoals: total };
    });
    withGoals.sort((a, b) => b.totalGoals - a.totalGoals);
    return withGoals.slice(0, limit);
  } catch (error) {
    console.error(`Failed to fetch spectacular matches for ${leagueCode}:`, error);
    return [];
  }
}
