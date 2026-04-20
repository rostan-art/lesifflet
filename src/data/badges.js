// ═══════════════════════════════════════════════════════════════
// SYSTÈME DE BADGES & RÉCOMPENSES LESIFFLET
// ═══════════════════════════════════════════════════════════════
// Chaque badge est débloquable via une action concrète et offre des points bonus
// Système de niveaux : chaque niveau demande de plus en plus de points

// ── NIVEAUX SIFFLEUR ──
// Plus l'utilisateur monte en niveau, plus son statut est prestigieux
export const LEVELS = [
  { level: 1, name: "Nouveau Siffleur", minPoints: 0, icon: "🌱", color: "#95a5a6" },
  { level: 2, name: "Siffleur Junior", minPoints: 100, icon: "⚽", color: "#3498db" },
  { level: 3, name: "Siffleur Confirmé", minPoints: 500, icon: "🎯", color: "#2ecc71" },
  { level: 4, name: "Siffleur Expert", minPoints: 1500, icon: "⭐", color: "#f1c40f" },
  { level: 5, name: "Siffleur d'Élite", minPoints: 3500, icon: "🏅", color: "#e67e22" },
  { level: 6, name: "Siffleur Légende", minPoints: 7000, icon: "👑", color: "#e74c3c" },
  { level: 7, name: "Maître Siffleur", minPoints: 15000, icon: "🏆", color: "#9b59b6" },
];

export function getLevelFromPoints(points) {
  const pts = points || 0;
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (pts >= lvl.minPoints) current = lvl;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.minPoints > pts);
  return {
    current,
    next: nextLevel,
    progress: nextLevel ? Math.round(((pts - current.minPoints) / (nextLevel.minPoints - current.minPoints)) * 100) : 100,
    pointsToNext: nextLevel ? nextLevel.minPoints - pts : 0,
  };
}

// ── BADGES ──
// Chaque badge a un "unlock" qui vérifie si le user a les conditions pour le recevoir
export const BADGES = [
  // Rookie & onboarding
  { id: 'welcome', icon: '🌱', name: 'Bienvenue !', desc: 'Premier pas sur LeSifflet', bonus: 50, category: 'debut' },
  { id: 'first_rating', icon: '🎬', name: 'Première note', desc: 'Noter ton premier joueur', bonus: 30, category: 'debut' },
  { id: 'first_match', icon: '🏟️', name: 'Premier match', desc: 'Noter ton premier match complet', bonus: 100, category: 'debut' },
  { id: 'first_comment', icon: '💬', name: 'Premier commentaire', desc: 'Poster ton premier message', bonus: 30, category: 'debut' },
  { id: 'profile_complete', icon: '⚽', name: 'Supporter affiché', desc: 'Choisir ton club favori', bonus: 50, category: 'debut' },

  // Activité
  { id: 'rated_5', icon: '📝', name: 'Apprenti Siffleur', desc: 'Noter 5 matchs', bonus: 100, category: 'activite' },
  { id: 'rated_25', icon: '📊', name: 'Siffleur régulier', desc: 'Noter 25 matchs', bonus: 250, category: 'activite' },
  { id: 'rated_100', icon: '🎖️', name: 'Siffleur aguerri', desc: 'Noter 100 matchs', bonus: 500, category: 'activite' },
  { id: 'rated_500', icon: '💎', name: 'Légende du Sifflet', desc: 'Noter 500 matchs', bonus: 2000, category: 'activite' },

  // Précision (Œil de Lynx)
  { id: 'lynx_10', icon: '👁️', name: 'Œil vigilant', desc: '10 notes à ±0.5 de la moyenne', bonus: 150, category: 'precision' },
  { id: 'lynx_50', icon: '🦅', name: 'Œil de Lynx', desc: '50 notes à ±0.5 de la moyenne', bonus: 500, category: 'precision' },
  { id: 'lynx_200', icon: '🔮', name: 'Oracle du foot', desc: '200 notes pile-poil', bonus: 1500, category: 'precision' },

  // Communauté
  { id: 'commenter_10', icon: '🗣️', name: 'Ça discute !', desc: '10 commentaires postés', bonus: 100, category: 'communaute' },
  { id: 'commenter_50', icon: '📣', name: 'Voix de la tribune', desc: '50 commentaires postés', bonus: 300, category: 'communaute' },
  { id: 'popular_comment', icon: '🔥', name: 'Commentaire viral', desc: 'Commentaire avec 20+ réactions', bonus: 200, category: 'communaute' },
  { id: 'chat_active', icon: '💬', name: 'Animateur du chat', desc: '25 messages dans le chat global', bonus: 150, category: 'communaute' },

  // Fidélité
  { id: 'week_streak', icon: '📅', name: 'Assidu', desc: '7 jours consécutifs connecté', bonus: 200, category: 'fidelite' },
  { id: 'month_streak', icon: '⚡', name: 'Inarrêtable', desc: '30 jours consécutifs connecté', bonus: 800, category: 'fidelite' },
  { id: 'favorites_10', icon: '⭐', name: 'Collectionneur', desc: '10 matchs en favoris', bonus: 100, category: 'fidelite' },

  // Classement
  { id: 'top_10', icon: '🏅', name: 'Top 10', desc: 'Atteindre le top 10 mensuel', bonus: 500, category: 'classement' },
  { id: 'top_3', icon: '🥉', name: 'Podium', desc: 'Atteindre le podium mensuel', bonus: 1500, category: 'classement' },
  { id: 'top_1', icon: '👑', name: 'Siffleur d\'Or', desc: 'Finir #1 du classement mensuel', bonus: 5000, category: 'classement' },
];

// ── Vérifier quels badges un user a débloqué ──
// Prend le profile user et retourne la liste des badges gagnés (IDs)
export function computeUnlockedBadges(profile, stats = {}) {
  if (!profile) return [];
  const unlocked = [];
  const p = profile;

  // Onboarding
  if (p.createdAt) unlocked.push('welcome');
  if ((p.favoriteClub) && p.favoriteClub !== 'none') unlocked.push('profile_complete');
  if ((p.matchesRated || 0) >= 1) unlocked.push('first_match');
  if ((stats.totalRatings || 0) >= 1) unlocked.push('first_rating');
  if ((p.commentsCount || 0) >= 1 || (stats.totalComments || 0) >= 1) unlocked.push('first_comment');

  // Activité
  if ((p.matchesRated || 0) >= 5) unlocked.push('rated_5');
  if ((p.matchesRated || 0) >= 25) unlocked.push('rated_25');
  if ((p.matchesRated || 0) >= 100) unlocked.push('rated_100');
  if ((p.matchesRated || 0) >= 500) unlocked.push('rated_500');

  // Précision
  const lynxCount = p.lynxCount || 0;
  if (lynxCount >= 10) unlocked.push('lynx_10');
  if (lynxCount >= 50) unlocked.push('lynx_50');
  if (lynxCount >= 200) unlocked.push('lynx_200');

  // Communauté
  const totalComments = (p.commentsCount || 0) + (stats.totalComments || 0);
  if (totalComments >= 10) unlocked.push('commenter_10');
  if (totalComments >= 50) unlocked.push('commenter_50');
  if (p.viralComment) unlocked.push('popular_comment');
  if ((p.chatMessages || 0) >= 25) unlocked.push('chat_active');

  // Fidélité
  if ((p.dayStreak || 0) >= 7) unlocked.push('week_streak');
  if ((p.dayStreak || 0) >= 30) unlocked.push('month_streak');
  if ((stats.favoritesCount || 0) >= 10) unlocked.push('favorites_10');

  // Classement
  const bestRank = p.bestMonthlyRank || 999;
  if (bestRank <= 10) unlocked.push('top_10');
  if (bestRank <= 3) unlocked.push('top_3');
  if (bestRank === 1) unlocked.push('top_1');

  return unlocked;
}

// ── Récompenses quotidiennes (daily bonus) ──
// Chaque jour connecté = petit bonus + streak
export const DAILY_BONUS = {
  base: 10, // points par jour
  streakBonus: 5, // +5 par jour de streak
  maxBonus: 100, // cap
};

export function computeDailyReward(dayStreak) {
  return Math.min(DAILY_BONUS.base + (dayStreak - 1) * DAILY_BONUS.streakBonus, DAILY_BONUS.maxBonus);
}

// ── Objectifs actifs (missions hebdomadaires) ──
// Motive l'utilisateur à revenir chaque semaine
export const WEEKLY_QUESTS = [
  { id: 'rate_3_matches', icon: '⚽', title: 'Noter 3 matchs', reward: 150, target: 3 },
  { id: 'comment_5', icon: '💬', title: 'Poster 5 commentaires', reward: 100, target: 5 },
  { id: 'react_10', icon: '🔥', title: 'Réagir à 10 commentaires', reward: 75, target: 10 },
  { id: 'chat_active', icon: '🗣️', title: 'Participer au chat global', reward: 50, target: 1 },
];

// ── Helper pour afficher le meilleur badge d'un user (celui avec le plus gros bonus)
export function getDisplayBadge(unlockedIds) {
  if (!unlockedIds || unlockedIds.length === 0) return null;
  const unlockedBadges = BADGES.filter(b => unlockedIds.includes(b.id));
  if (unlockedBadges.length === 0) return null;
  // Retourne le badge avec le plus gros bonus
  return unlockedBadges.sort((a, b) => b.bonus - a.bonus)[0];
}
