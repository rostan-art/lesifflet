import { db } from './firebase';
import {
  doc, setDoc, getDoc, getDocs, collection,
  query, where, onSnapshot, increment, updateDoc, deleteField, deleteDoc
} from 'firebase/firestore';

// ── PLAYER RATINGS ──

// Save a user's rating for a player in a match
export async function savePlayerRating(userId, matchId, playerId, rating) {
  const ratingRef = doc(db, 'playerRatings', `${matchId}_${playerId}_${userId}`);
  await setDoc(ratingRef, {
    userId,
    matchId,
    playerId,
    rating,
    timestamp: new Date().toISOString(),
  });

  // Update the aggregate (average + count)
  await updatePlayerAverage(matchId, playerId);
}

// Calculate and store the average for a player in a match
async function updatePlayerAverage(matchId, playerId) {
  const q = query(
    collection(db, 'playerRatings'),
    where('matchId', '==', matchId),
    where('playerId', '==', playerId)
  );
  const snapshot = await getDocs(q);

  let total = 0;
  let count = 0;
  snapshot.forEach(doc => {
    total += doc.data().rating;
    count++;
  });

  const avg = count > 0 ? (total / count) : 0;
  const avgRef = doc(db, 'playerAverages', `${matchId}_${playerId}`);
  await setDoc(avgRef, {
    matchId,
    playerId,
    average: Math.round(avg * 10) / 10,
    count,
    updatedAt: new Date().toISOString(),
  });
}

// Get all player averages for a match
export async function getPlayerAverages(matchId) {
  const q = query(
    collection(db, 'playerAverages'),
    where('matchId', '==', matchId)
  );
  const snapshot = await getDocs(q);
  const averages = {};
  snapshot.forEach(d => {
    const data = d.data();
    averages[data.playerId] = { average: data.average, count: data.count };
  });
  return averages;
}

// Get a user's ratings for a specific match
export async function getUserRatings(userId, matchId) {
  const q = query(
    collection(db, 'playerRatings'),
    where('userId', '==', userId),
    where('matchId', '==', matchId)
  );
  const snapshot = await getDocs(q);
  const ratings = {};
  snapshot.forEach(d => {
    const data = d.data();
    ratings[data.playerId] = data.rating;
  });
  return ratings;
}

// ── MATCH RATINGS ──

export async function saveMatchRating(userId, matchId, rating) {
  const ratingRef = doc(db, 'matchRatings', `${matchId}_${userId}`);
  await setDoc(ratingRef, {
    userId,
    matchId,
    rating,
    timestamp: new Date().toISOString(),
  });
  await updateMatchAverage(matchId);
}

async function updateMatchAverage(matchId) {
  const q = query(
    collection(db, 'matchRatings'),
    where('matchId', '==', matchId)
  );
  const snapshot = await getDocs(q);

  let total = 0;
  let count = 0;
  snapshot.forEach(doc => {
    total += doc.data().rating;
    count++;
  });

  const avg = count > 0 ? (total / count) : 0;
  const avgRef = doc(db, 'matchAverages', matchId);
  await setDoc(avgRef, {
    matchId,
    average: Math.round(avg * 10) / 10,
    count,
    updatedAt: new Date().toISOString(),
  });
}

export async function getMatchAverage(matchId) {
  const avgRef = doc(db, 'matchAverages', matchId);
  const snap = await getDoc(avgRef);
  if (snap.exists()) {
    return snap.data();
  }
  return { average: 0, count: 0 };
}

// ── USER POINTS ──

// Calculate points earned based on proximity to average
// Close to average = more points (rewards thoughtful raters)
export function calculatePoints(userRating, communityAverage) {
  if (!communityAverage || communityAverage === 0) return 10; // Base points if no average yet
  const diff = Math.abs(userRating - communityAverage);
  if (diff <= 0.5) return 50;  // Œil de Lynx!
  if (diff <= 1) return 30;
  if (diff <= 2) return 15;
  return 5; // Participation
}

export async function addUserPoints(userId, points, matchId, displayName) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const current = userSnap.data();
    await updateDoc(userRef, {
      points: (current.points || 0) + points,
      matchesRated: (current.matchesRated || 0) + 1,
      lastActive: new Date().toISOString(),
      ...(displayName ? { displayName } : {}),
    });
  } else {
    await setDoc(userRef, {
      points,
      matchesRated: 1,
      displayName: displayName || 'Siffleur',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
  }
}

// Get user profile with points
export async function getUserProfile(userId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) return snap.data();
  return { points: 0, matchesRated: 0 };
}

// Update user's avatar (base64 data URL, compressed client-side)
export async function updateUserAvatar(userId, photoData) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, { photoURL: photoData });
  } else {
    await setDoc(userRef, {
      photoURL: photoData,
      points: 0,
      matchesRated: 0,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
  }
}

// Update user's favorite club
export async function updateFavoriteClub(userId, clubId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, { favoriteClub: clubId });
  } else {
    await setDoc(userRef, {
      favoriteClub: clubId,
      points: 0,
      matchesRated: 0,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    });
  }
}

// Get leaderboard (top users by points)
export async function getLeaderboard(limit = 20) {
  // For simplicity, fetch all and sort client-side
  // In production, use an ordered query with limit
  const snapshot = await getDocs(collection(db, 'users'));
  const users = [];
  snapshot.forEach(d => {
    users.push({ id: d.id, ...d.data() });
  });
  users.sort((a, b) => (b.points || 0) - (a.points || 0));
  return users.slice(0, limit);
}

// ── FAVORITES ──

export async function toggleFavorite(userId, match) {
  const favRef = doc(db, 'favorites', `${userId}_${match.id}`);
  const snap = await getDoc(favRef);

  if (snap.exists()) {
    await deleteDoc(favRef);
    return false; // removed
  } else {
    await setDoc(favRef, {
      userId,
      matchId: match.id,
      home: match.home,
      away: match.away,
      date: match.date || '',
      time: match.time || '',
      status: match.status || '',
      score: match.score || '',
      homeId: match.homeId || '',
      awayId: match.awayId || '',
      homeLogo: match.homeLogo || '',
      awayLogo: match.awayLogo || '',
      fixtureId: match.fixtureId || '',
      leagueName: match.leagueName || '',
      addedAt: new Date().toISOString(),
    });
    return true; // added
  }
}

export async function getUserFavorites(userId) {
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const favs = [];
  snapshot.forEach(d => {
    favs.push({ id: d.data().matchId, ...d.data() });
  });
  // Sort: upcoming first, then by date
  favs.sort((a, b) => {
    if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
    if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (a.status !== 'live' && b.status === 'live') return 1;
    return 0;
  });
  return favs;
}

export async function isFavorited(userId, matchId) {
  const favRef = doc(db, 'favorites', `${userId}_${matchId}`);
  const snap = await getDoc(favRef);
  return snap.exists();
}

// ── GLOBAL CHAT ──

export async function sendGlobalMessage(userId, displayName, text, replyTo = null, favoriteClub = null) {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const msgRef = doc(db, 'globalChat', msgId);
  await setDoc(msgRef, {
    id: msgId,
    userId,
    displayName: displayName || 'Siffleur',
    favoriteClub: favoriteClub || null,
    text,
    replyTo: replyTo || null, // { id, user, text } of parent message
    reactions: {},
    timestamp: new Date().toISOString(),
  });
  return msgId;
}

export async function getGlobalMessages(limit = 50) {
  const snapshot = await getDocs(collection(db, 'globalChat'));
  const msgs = [];
  snapshot.forEach(d => msgs.push({ id: d.id, ...d.data() }));
  msgs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return msgs.slice(0, limit);
}

export async function reactToGlobalMessage(msgId, emoji, delta) {
  const msgRef = doc(db, 'globalChat', msgId);
  const snap = await getDoc(msgRef);
  if (snap.exists()) {
    const data = snap.data();
    const reactions = { ...data.reactions };
    reactions[emoji] = Math.max(0, (reactions[emoji] || 0) + delta);
    if (reactions[emoji] === 0) delete reactions[emoji];
    await updateDoc(msgRef, { reactions });
  }
}

// ── MATCH COMMENTS (with replies) ──

export async function sendMatchComment(userId, displayName, matchId, text, replyTo = null, favoriteClub = null) {
  const msgId = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const msgRef = doc(db, 'matchComments', msgId);
  await setDoc(msgRef, {
    id: msgId,
    userId,
    displayName: displayName || 'Siffleur',
    favoriteClub: favoriteClub || null,
    matchId,
    text,
    replyTo: replyTo || null,
    reactions: {},
    timestamp: new Date().toISOString(),
  });
  // Increment user comment count
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await updateDoc(userRef, { commentsCount: (userSnap.data().commentsCount || 0) + 1 });
  }
  return msgId;
}

export async function getMatchComments(matchId) {
  const q = query(collection(db, 'matchComments'), where('matchId', '==', matchId));
  const snapshot = await getDocs(q);
  const msgs = [];
  snapshot.forEach(d => msgs.push({ id: d.id, ...d.data() }));
  msgs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return msgs;
}

export async function reactToMatchComment(msgId, emoji, delta) {
  const msgRef = doc(db, 'matchComments', msgId);
  const snap = await getDoc(msgRef);
  if (snap.exists()) {
    const data = snap.data();
    const reactions = { ...data.reactions };
    reactions[emoji] = Math.max(0, (reactions[emoji] || 0) + delta);
    if (reactions[emoji] === 0) delete reactions[emoji];
    await updateDoc(msgRef, { reactions });
  }
}

// ── TOP PERFORMANCES ──

export async function getTopPlayers(limit = 5) {
  const snapshot = await getDocs(collection(db, 'playerAverages'));
  const players = [];
  snapshot.forEach(d => {
    const data = d.data();
    if (data.count >= 3) { // minimum 3 votes to appear
      players.push(data);
    }
  });
  players.sort((a, b) => b.average - a.average);
  return players.slice(0, limit);
}

export async function getTopMatches(limit = 5) {
  const snapshot = await getDocs(collection(db, 'matchAverages'));
  const matches = [];
  snapshot.forEach(d => {
    const data = d.data();
    if (data.count >= 3) {
      matches.push({ id: d.id, ...data });
    }
  });
  matches.sort((a, b) => b.average - a.average);
  return matches.slice(0, limit);
}

// ── USER PUBLIC PROFILE ──

export async function getPublicProfile(userId) {
  const profile = await getUserProfile(userId);
  // Count comments
  const q = query(collection(db, 'matchComments'), where('userId', '==', userId));
  const commentSnap = await getDocs(q);
  const globalQ = query(collection(db, 'globalChat'), where('userId', '==', userId));
  const globalSnap = await getDocs(globalQ);
  // Count ratings
  const ratingsQ = query(collection(db, 'playerRatings'), where('userId', '==', userId));
  const ratingsSnap = await getDocs(ratingsQ);
  // Count favorites
  const favQ = query(collection(db, 'favorites'), where('userId', '==', userId));
  const favSnap = await getDocs(favQ);

  return {
    ...profile,
    id: userId,
    totalComments: commentSnap.size + globalSnap.size,
    totalRatings: ratingsSnap.size,
    favoritesCount: favSnap.size,
  };
}

// ── BADGES & REWARDS ──

// Record a new unlocked badge and grant bonus points
export async function awardBadge(userId, badgeId, bonus) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return false;

  const data = snap.data();
  const earnedBadges = data.earnedBadges || [];
  if (earnedBadges.includes(badgeId)) return false; // already awarded

  await updateDoc(userRef, {
    earnedBadges: [...earnedBadges, badgeId],
    points: (data.points || 0) + bonus,
  });
  return true;
}

// Track daily login for streak
export async function updateDailyStreak(userId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return { streak: 0, bonus: 0, newDay: false };

  const data = snap.data();
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const lastDay = data.lastStreakDay || '';

  if (lastDay === today) {
    return { streak: data.dayStreak || 0, bonus: 0, newDay: false };
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = lastDay === yesterdayStr ? (data.dayStreak || 0) + 1 : 1;
  const bonus = Math.min(10 + (newStreak - 1) * 5, 100);

  await updateDoc(userRef, {
    dayStreak: newStreak,
    lastStreakDay: today,
    points: (data.points || 0) + bonus,
  });

  return { streak: newStreak, bonus, newDay: true };
}

// Increment lynx counter when user hits close-to-average rating
export async function incrementLynxCount(userId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  await updateDoc(userRef, {
    lynxCount: ((snap.data().lynxCount) || 0) + 1,
  });
}

// Increment chat message counter
export async function incrementChatCount(userId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  await updateDoc(userRef, {
    chatMessages: ((snap.data().chatMessages) || 0) + 1,
  });
}
