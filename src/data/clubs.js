// Popular clubs across top European leagues, with crests from football-data.org
// Uses the same crest URLs as the app's match fetching
export const POPULAR_CLUBS = [
  // Ligue 1
  { id: 'psg', name: 'PSG', fullName: 'Paris Saint-Germain', league: 'Ligue 1', crest: 'https://crests.football-data.org/524.png' },
  { id: 'om', name: 'OM', fullName: 'Olympique de Marseille', league: 'Ligue 1', crest: 'https://crests.football-data.org/516.png' },
  { id: 'ol', name: 'OL', fullName: 'Olympique Lyonnais', league: 'Ligue 1', crest: 'https://crests.football-data.org/523.png' },
  { id: 'monaco', name: 'Monaco', fullName: 'AS Monaco', league: 'Ligue 1', crest: 'https://crests.football-data.org/548.png' },
  { id: 'lille', name: 'Lille', fullName: 'LOSC Lille', league: 'Ligue 1', crest: 'https://crests.football-data.org/521.png' },
  { id: 'rennes', name: 'Rennes', fullName: 'Stade Rennais', league: 'Ligue 1', crest: 'https://crests.football-data.org/529.png' },
  { id: 'nice', name: 'Nice', fullName: 'OGC Nice', league: 'Ligue 1', crest: 'https://crests.football-data.org/522.png' },
  { id: 'lens', name: 'Lens', fullName: 'RC Lens', league: 'Ligue 1', crest: 'https://crests.football-data.org/546.png' },

  // Premier League
  { id: 'man-city', name: 'Man City', fullName: 'Manchester City', league: 'Premier League', crest: 'https://crests.football-data.org/65.png' },
  { id: 'man-utd', name: 'Man Utd', fullName: 'Manchester United', league: 'Premier League', crest: 'https://crests.football-data.org/66.png' },
  { id: 'liverpool', name: 'Liverpool', fullName: 'Liverpool FC', league: 'Premier League', crest: 'https://crests.football-data.org/64.png' },
  { id: 'arsenal', name: 'Arsenal', fullName: 'Arsenal FC', league: 'Premier League', crest: 'https://crests.football-data.org/57.png' },
  { id: 'chelsea', name: 'Chelsea', fullName: 'Chelsea FC', league: 'Premier League', crest: 'https://crests.football-data.org/61.png' },
  { id: 'tottenham', name: 'Tottenham', fullName: 'Tottenham Hotspur', league: 'Premier League', crest: 'https://crests.football-data.org/73.png' },
  { id: 'newcastle', name: 'Newcastle', fullName: 'Newcastle United', league: 'Premier League', crest: 'https://crests.football-data.org/67.png' },

  // La Liga
  { id: 'real-madrid', name: 'Real Madrid', fullName: 'Real Madrid CF', league: 'La Liga', crest: 'https://crests.football-data.org/86.png' },
  { id: 'barcelona', name: 'Barcelone', fullName: 'FC Barcelona', league: 'La Liga', crest: 'https://crests.football-data.org/81.png' },
  { id: 'atletico', name: 'Atlético', fullName: 'Atlético de Madrid', league: 'La Liga', crest: 'https://crests.football-data.org/78.png' },
  { id: 'sevilla', name: 'Séville', fullName: 'Sevilla FC', league: 'La Liga', crest: 'https://crests.football-data.org/559.png' },
  { id: 'valencia', name: 'Valence', fullName: 'Valencia CF', league: 'La Liga', crest: 'https://crests.football-data.org/95.png' },

  // Serie A
  { id: 'juventus', name: 'Juventus', fullName: 'Juventus FC', league: 'Serie A', crest: 'https://crests.football-data.org/109.png' },
  { id: 'inter', name: 'Inter', fullName: 'Inter Milan', league: 'Serie A', crest: 'https://crests.football-data.org/108.png' },
  { id: 'milan', name: 'AC Milan', fullName: 'AC Milan', league: 'Serie A', crest: 'https://crests.football-data.org/98.png' },
  { id: 'napoli', name: 'Naples', fullName: 'SSC Napoli', league: 'Serie A', crest: 'https://crests.football-data.org/113.png' },
  { id: 'roma', name: 'Roma', fullName: 'AS Roma', league: 'Serie A', crest: 'https://crests.football-data.org/100.png' },

  // Bundesliga
  { id: 'bayern', name: 'Bayern', fullName: 'Bayern Munich', league: 'Bundesliga', crest: 'https://crests.football-data.org/5.png' },
  { id: 'dortmund', name: 'Dortmund', fullName: 'Borussia Dortmund', league: 'Bundesliga', crest: 'https://crests.football-data.org/4.png' },
  { id: 'leverkusen', name: 'Leverkusen', fullName: 'Bayer Leverkusen', league: 'Bundesliga', crest: 'https://crests.football-data.org/3.png' },
  { id: 'leipzig', name: 'RB Leipzig', fullName: 'RB Leipzig', league: 'Bundesliga', crest: 'https://crests.football-data.org/721.png' },

  // Special
  { id: 'none', name: 'Pas de club', fullName: 'Aucun club favori', league: '—', crest: null },
];

export function getClubById(id) {
  return POPULAR_CLUBS.find(c => c.id === id) || null;
}
