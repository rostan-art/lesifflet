import { db } from './firebase';
import {
  doc, setDoc, getDoc, getDocs, collection,
  query, where, onSnapshot, increment, updateDoc, deleteField
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
