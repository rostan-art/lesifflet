'use client';
import { useState, useEffect } from 'react';
import { themes } from '../data/themes';
import { REACTION_EMOJIS, BADGES_INFO } from '../data/mockData';
import { getClubById, POPULAR_CLUBS } from '../data/clubs';
import { BADGES, LEVELS, getLevelFromPoints, computeUnlockedBadges, WEEKLY_QUESTS } from '../data/badges';
import { LEAGUES, getMatchesByLeague, getMatchLineups } from '../data/footballApi';
import { StarRating, PulsingDot, ThemeToggle, BottomNavBar } from '../components/UI';
import { InstallBanner } from '../components/InstallBanner';
import { LegalPage } from '../components/Legal';
import { AuthModal, UserBadge } from '../components/Auth';
import { auth } from '../data/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  savePlayerRating, saveMatchRating, getUserRatings,
  getPlayerAverages, getMatchAverage, getUserProfile,
  addUserPoints, calculatePoints, getLeaderboard,
  toggleFavorite, getUserFavorites,
  sendGlobalMessage, getGlobalMessages, reactToGlobalMessage,
  sendMatchComment, getMatchComments, reactToMatchComment,
  getTopPlayers, getTopMatches, getPublicProfile,
  updateFavoriteClub, awardBadge, updateDailyStreak,
  incrementLynxCount, incrementChatCount,
} from '../data/firebaseRatings';

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const t = isDark ? themes.dark : themes.light;

  const [screen, setScreen] = useState('home');
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedTeamTab, setSelectedTeamTab] = useState('home');
  const [playerRatings, setPlayerRatings] = useState({});
  const [matchRating, setMatchRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState('players');
  const [bottomNav, setBottomNav] = useState('home');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
  const [userReactions, setUserReactions] = useState({});
  const [commentSort, setCommentSort] = useState('hot');

  // ── AUTH STATE ──
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Firestore user doc (includes favoriteClub)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [legalPage, setLegalPage] = useState(null); // 'mentions' or 'privacy'

  // ── FAVORITES STATE ──
  const [favorites, setFavorites] = useState([]); // list of favorite match objects
  const [favMatchIds, setFavMatchIds] = useState(new Set()); // quick lookup set

  // ── PROFILE STATE ──
  const [showProfile, setShowProfile] = useState(false);
  const [showClubPicker, setShowClubPicker] = useState(false);
  const [viewedProfile, setViewedProfile] = useState(null); // public profile of another user
  const [viewedProfileData, setViewedProfileData] = useState(null);

  // ── GLOBAL CHAT STATE ──
  const [globalMessages, setGlobalMessages] = useState([]);
  const [globalNewMsg, setGlobalNewMsg] = useState('');
  const [globalReplyTo, setGlobalReplyTo] = useState(null);

  // ── TOP PERFORMANCES ──
  const [topPlayers, setTopPlayers] = useState([]);
  const [topMatches, setTopMatches] = useState([]);

  // ── COMMENT REPLIES ──
  const [replyTo, setReplyTo] = useState(null); // { id, user, text } of comment being replied to

  // ── LEAGUE FILTER ──
  const [leagueFilter, setLeagueFilter] = useState(null); // 'live' | 'upcoming' | 'finished'

  // ── BADGE TOAST ──
  const [badgeToast, setBadgeToast] = useState(null); // { icon, name, bonus }
  const [dailyStreakToast, setDailyStreakToast] = useState(null); // { streak, bonus }

  // ── FIREBASE RATING STATE ──
  const [communityPlayerAvgs, setCommunityPlayerAvgs] = useState({});
  const [communityMatchAvg, setCommunityMatchAvg] = useState({ average: 0, count: 0 });
  const [pointsEarned, setPointsEarned] = useState(0);
  const [realLeaderboard, setRealLeaderboard] = useState([]);

  // Listen for auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Daily streak bonus
        const streakResult = await updateDailyStreak(u.uid);
        if (streakResult.newDay && streakResult.bonus > 0) {
          setDailyStreakToast({ streak: streakResult.streak, bonus: streakResult.bonus });
          setTimeout(() => setDailyStreakToast(null), 4000);
        }

        const profile = await getUserProfile(u.uid);
        setUserPoints(profile.points || 0);
        setUserProfile(profile);

        // Load favorites
        const favs = await getUserFavorites(u.uid);
        setFavorites(favs);
        setFavMatchIds(new Set(favs.map(f => f.matchId)));

        // Check badge unlocks
        try {
          const publicData = await getPublicProfile(u.uid);
          const unlockedNow = computeUnlockedBadges(profile, {
            totalRatings: publicData.totalRatings,
            totalComments: publicData.totalComments,
            favoritesCount: publicData.favoritesCount,
          });
          const alreadyEarned = profile.earnedBadges || [];
          const newlyEarned = unlockedNow.filter(id => !alreadyEarned.includes(id));
          // Award new badges one by one
          for (const badgeId of newlyEarned) {
            const badge = BADGES.find(b => b.id === badgeId);
            if (badge) {
              await awardBadge(u.uid, badgeId, badge.bonus);
              // Show toast for the first new badge
              if (badgeId === newlyEarned[0]) {
                setBadgeToast(badge);
                setTimeout(() => setBadgeToast(null), 4500);
              }
            }
          }
          // Refresh profile after awards
          if (newlyEarned.length > 0) {
            const refreshed = await getUserProfile(u.uid);
            setUserProfile(refreshed);
            setUserPoints(refreshed.points || 0);
          }
        } catch (err) {
          console.warn('Badge check failed:', err);
        }
      } else {
        setUserPoints(0);
        setUserProfile(null);
        setFavorites([]);
        setFavMatchIds(new Set());
      }
    });
    return () => unsub();
  }, []);

  // Load leaderboard when entering leaderboard screen
  useEffect(() => {
    if (screen !== 'leaderboard') return;
    getLeaderboard(20).then(setRealLeaderboard).catch(() => {});
  }, [screen]);

  // Load top performances on home screen
  useEffect(() => {
    if (screen !== 'home') return;
    getTopPlayers(5).then(setTopPlayers).catch(() => {});
    getTopMatches(5).then(setTopMatches).catch(() => {});
  }, [screen]);

  // Load global chat messages
  useEffect(() => {
    if (screen !== 'globalchat') return;
    getGlobalMessages(50).then(setGlobalMessages).catch(() => {});
  }, [screen]);

  // Load match comments when entering a match
  useEffect(() => {
    if (!selectedMatch) return;
    getMatchComments(selectedMatch.id).then(setComments).catch(() => {});
  }, [selectedMatch]);

  // View another user's profile
  const openUserProfile = async (userId, displayName) => {
    if (!userId) return;
    setViewedProfile({ id: userId, displayName });
    setScreen('userprofile');
    try {
      const data = await getPublicProfile(userId);
      setViewedProfileData(data);
    } catch (e) {
      setViewedProfileData(null);
    }
  };

  // Re-check badges after any action
  const checkBadges = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      const publicData = await getPublicProfile(user.uid);
      const unlockedNow = computeUnlockedBadges(profile, {
        totalRatings: publicData.totalRatings,
        totalComments: publicData.totalComments,
        favoritesCount: publicData.favoritesCount,
      });
      const alreadyEarned = profile.earnedBadges || [];
      const newlyEarned = unlockedNow.filter(id => !alreadyEarned.includes(id));
      for (const badgeId of newlyEarned) {
        const badge = BADGES.find(b => b.id === badgeId);
        if (badge) {
          await awardBadge(user.uid, badgeId, badge.bonus);
          if (badgeId === newlyEarned[0]) {
            setBadgeToast(badge);
            setTimeout(() => setBadgeToast(null), 4500);
          }
        }
      }
      if (newlyEarned.length > 0) {
        const refreshed = await getUserProfile(user.uid);
        setUserProfile(refreshed);
        setUserPoints(refreshed.points || 0);
      }
    } catch (err) {
      console.warn('Badge recheck failed:', err);
    }
  };
  const [realMatches, setRealMatches] = useState({});
  const [fetchedLeagues, setFetchedLeagues] = useState(new Set());
  const [realLineups, setRealLineups] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [useRealData, setUseRealData] = useState(true);

  // Fetch matches only when a league is selected (saves API quota)
  useEffect(() => {
    if (!selectedLeague || !useRealData) return;
    if (fetchedLeagues.has(selectedLeague.id)) return;
    let cancelled = false;
    setLoadingMatches(true);
    async function fetchLeagueMatches() {
      try {
        const matches = await getMatchesByLeague(selectedLeague.code);
        if (!cancelled) {
          setRealMatches(prev => ({ ...prev, [selectedLeague.id]: matches }));
        }
      } catch (e) {
        console.warn(`Failed to fetch ${selectedLeague.name}:`, e);
      } finally {
        if (!cancelled) {
          setLoadingMatches(false);
          setFetchedLeagues(prev => new Set([...prev, selectedLeague.id]));
        }
      }
    }
    fetchLeagueMatches();
    return () => { cancelled = true; };
  }, [selectedLeague, useRealData]);

  // Fetch team squads when a match is selected
  useEffect(() => {
    if (!selectedMatch || !useRealData || !selectedMatch.fixtureId) return;
    let cancelled = false;
    setLoadingLineups(true);
    async function fetchSquads() {
      try {
        const lineups = await getMatchLineups(
          selectedMatch.fixtureId,
          selectedMatch.homeId,
          selectedMatch.awayId
        );
        if (!cancelled) {
          setRealLineups(lineups);
        }
      } catch (e) {
        console.warn('Failed to fetch squads:', e);
        if (!cancelled) {
          setRealLineups(null);
        }
      } finally {
        if (!cancelled) setLoadingLineups(false);
      }
    }
    fetchSquads();
    return () => { cancelled = true; };
  }, [selectedMatch, useRealData]);

  // Load user's existing ratings and community averages when entering a match
  useEffect(() => {
    if (!selectedMatch) return;
    // Load community averages
    getPlayerAverages(selectedMatch.id).then(setCommunityPlayerAvgs).catch(() => {});
    getMatchAverage(selectedMatch.id).then(setCommunityMatchAvg).catch(() => {});
    // Load user's existing ratings
    if (user) {
      getUserRatings(user.uid, selectedMatch.id).then(ratings => {
        if (Object.keys(ratings).length > 0) setPlayerRatings(ratings);
      }).catch(() => {});
    }
  }, [selectedMatch, user]);

  // Get players for the current match — ONLY real lineups, no fake data
  function getPlayers() {
    if (realLineups) {
      return {
        home: realLineups.home?.starters || [],
        away: realLineups.away?.starters || [],
      };
    }
    return { home: [], away: [] };
  }

  // Can the user rate? Only after halftime (45') or if match is finished
  function canRate() {
    if (!selectedMatch) return false;
    if (selectedMatch.status === 'finished') return true;
    if (selectedMatch.status === 'live') {
      const min = parseInt(selectedMatch.minute);
      return !isNaN(min) && min >= 45;
    }
    return false;
  }

  // Is the match fully finished? (ratings can only be saved permanently when finished)
  function isMatchFinished() {
    return selectedMatch?.status === 'finished';
  }

  // Are we in draft mode? (live match, after halftime but not finished)
  function isDraftMode() {
    return canRate() && !isMatchFinished();
  }

  const handleToggleFavorite = async (match) => {
    if (!user) { setShowAuthModal(true); return; }
    const added = await toggleFavorite(user.uid, match);
    if (added) {
      setFavMatchIds(prev => new Set([...prev, match.id]));
      setFavorites(prev => [...prev, match]);
    } else {
      setFavMatchIds(prev => { const s = new Set(prev); s.delete(match.id); return s; });
      setFavorites(prev => prev.filter(f => f.matchId !== match.id));
    }
  };

  const ratePlayer = (pid, r) => {
    if (!user) { setShowAuthModal(true); return; }
    setPlayerRatings(prev => ({ ...prev, [pid]: r }));
  };

  const submitComment = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!newComment.trim()) return;
    const replyData = replyTo ? { id: replyTo.id, user: replyTo.displayName || replyTo.user, text: replyTo.text } : null;
    await sendMatchComment(user.uid, user.displayName, selectedMatch.id, newComment.trim(), replyData, userProfile?.favoriteClub || null);
    setNewComment('');
    setReplyTo(null);
    // Refresh comments
    const updated = await getMatchComments(selectedMatch.id);
    setComments(updated);
    // Check badges
    checkBadges();
  };

  const toggleReaction = async (commentId, emoji) => {
    const key = `${commentId}_${emoji}`;
    const alreadyReacted = userReactions[key];
    setUserReactions(prev => ({ ...prev, [key]: !alreadyReacted }));
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const reactions = { ...c.reactions };
      if (alreadyReacted) {
        reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
        if (reactions[emoji] === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = (reactions[emoji] || 0) + 1;
      }
      return { ...c, reactions };
    }));
    setEmojiPickerOpen(null);
    await reactToMatchComment(commentId, emoji, alreadyReacted ? -1 : 1);
  };

  const getTotalReactions = (c) => Object.values(c.reactions || {}).reduce((a, b) => a + b, 0);

  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === 'hot') return getTotalReactions(b) - getTotalReactions(a);
    return 0;
  });

  const [draftSaved, setDraftSaved] = useState(false);

  const submitAllRatings = async () => {
    if (!user) { setShowAuthModal(true); return; }
    if (!selectedMatch) return;

    // DRAFT MODE: match is live — save locally only, don't push to Firebase
    if (isDraftMode()) {
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
      return;
    }

    // FINAL MODE: match is finished — save to Firebase permanently
    try {
      let totalPoints = 0;

      // Save player ratings to Firebase
      for (const [playerId, rating] of Object.entries(playerRatings)) {
        await savePlayerRating(user.uid, selectedMatch.id, playerId, rating);
      }

      // Save match rating
      if (matchRating > 0) {
        await saveMatchRating(user.uid, selectedMatch.id, matchRating);
      }

      // Reload averages to calculate points
      const newPlayerAvgs = await getPlayerAverages(selectedMatch.id);
      const newMatchAvg = await getMatchAverage(selectedMatch.id);
      setCommunityPlayerAvgs(newPlayerAvgs);
      setCommunityMatchAvg(newMatchAvg);

      // Calculate points based on proximity to average
      let lynxHits = 0;
      for (const [playerId, rating] of Object.entries(playerRatings)) {
        const avg = newPlayerAvgs[playerId]?.average || 0;
        const pts = calculatePoints(rating, avg);
        totalPoints += pts;
        if (pts === 50) lynxHits++; // Œil de Lynx = ±0.5
      }
      if (matchRating > 0) {
        totalPoints += calculatePoints(matchRating, newMatchAvg.average);
      }

      // Save points
      await addUserPoints(user.uid, totalPoints, selectedMatch.id, user.displayName);
      // Track lynx hits
      for (let j = 0; j < lynxHits; j++) {
        await incrementLynxCount(user.uid);
      }
      setPointsEarned(totalPoints);
      setUserPoints(prev => prev + totalPoints);

      // Refresh user profile
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      setUserPoints(profile.points || 0);

      // Check badges after rating
      checkBadges();
    } catch (e) {
      console.error('Error saving ratings:', e);
    }

    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const goBack = () => {
    if (screen === 'match') { setScreen('league'); setSelectedMatch(null); setActiveTab('players'); setPlayerRatings({}); setMatchRating(0); setRealLineups(null); setCommunityPlayerAvgs({}); setCommunityMatchAvg({ average: 0, count: 0 }); setPointsEarned(0); setDraftSaved(false); setComments([]); }
    else if (screen === 'league') { setScreen('home'); setSelectedLeague(null); setLeagueFilter(null); }
    else if (screen === 'leaderboard') { setScreen('home'); }
    else if (screen === 'favorites') { setScreen('home'); }
    else if (screen === 'globalchat') { setScreen('home'); }
    else if (screen === 'userprofile') { setScreen('home'); setViewedProfile(null); setViewedProfileData(null); }
  };

  const navigateTo = (dest) => {
    setBottomNav(dest);
    if (dest === 'home') { setScreen('home'); setSelectedLeague(null); setSelectedMatch(null); }
    else if (dest === 'favorites') { setScreen('favorites'); }
    else if (dest === 'globalchat') { setScreen('globalchat'); }
    else if (dest === 'leaderboard') setScreen('leaderboard');
  };

  const baseStyle = {
    fontFamily: "'Outfit', 'DM Sans', sans-serif",
    background: t.gradient, color: t.text,
    minHeight: '100vh', maxWidth: 480, margin: '0 auto',
    position: 'relative', overflow: 'hidden',
    transition: 'background 0.4s ease, color 0.3s ease',
  };

  // ══════════════════════════════════════
  // REWARD TOASTS (badge unlock + daily streak)
  // ══════════════════════════════════════
  const rewardToasts = (
    <>
      {badgeToast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, maxWidth: 360, width: '90%',
          background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
          borderRadius: 16, padding: '14px 18px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'slideDown 0.4s ease',
          color: '#0a0e17',
        }}>
          <div style={{ fontSize: 36 }}>{badgeToast.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7 }}>Badge débloqué !</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{badgeToast.name}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{badgeToast.desc} · +{badgeToast.bonus} pts</div>
          </div>
        </div>
      )}
      {dailyStreakToast && !badgeToast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9998, maxWidth: 340, width: '90%',
          background: t.card, border: `1px solid ${t.accent}44`,
          borderRadius: 16, padding: '12px 16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'slideDown 0.4s ease',
        }}>
          <div style={{ fontSize: 28 }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>Série de {dailyStreakToast.streak} jour{dailyStreakToast.streak > 1 ? 's' : ''} !</div>
            <div style={{ fontSize: 11, color: t.textDim }}>Bonus quotidien · +{dailyStreakToast.bonus} pts</div>
          </div>
        </div>
      )}
    </>
  );

  // ══════════════════════════════════════
  // LEGAL PAGES
  // ══════════════════════════════════════
  if (legalPage) {
    return <LegalPage type={legalPage} onClose={() => setLegalPage(null)} t={t} />;
  }

  // ══════════════════════════════════════
  // HOME SCREEN
  // ══════════════════════════════════════
  if (screen === 'home') {
    return (
      <>
        {rewardToasts}
        <div style={baseStyle}>
        <div style={{ padding: '40px 24px 16px', animation: 'fadeIn 0.6s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Profile avatar */}
              <div onClick={() => user ? setShowProfile(true) : setShowAuthModal(true)} style={{
                width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
                background: user ? `linear-gradient(135deg, ${t.accent}, #00b0ff)` : t.toggleBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: user ? '#fff' : t.textDim,
                border: `2px solid ${user ? t.accent + '44' : t.border}`,
                transition: 'all 0.2s',
              }}>
                {user ? (user.displayName || 'S')[0].toUpperCase() : '👤'}
              </div>
              <div>
                <h1 style={{
                  fontSize: 32, fontWeight: 900, letterSpacing: -1.5,
                  background: `linear-gradient(135deg, ${t.text} 0%, ${t.accent} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>LeSifflet</h1>
                <p style={{ color: t.textDim, fontSize: 11, fontWeight: 400, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
                  Le verdict des supporters
                </p>
              </div>
            </div>
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
          </div>
        </div>
        {/* Hero card — next favorite match or CTA */}
        {(() => {
          const nextFav = favorites.find(f => f.status === 'upcoming' || f.status === 'live');
          if (nextFav) {
            return (
              <div style={{
                margin: '0 24px 20px', padding: '18px 20px', borderRadius: 18,
                background: `linear-gradient(135deg, ${t.accent}18, ${t.accent}08)`,
                border: `1px solid ${t.accent}33`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: t.accent, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                  {nextFav.status === 'live' ? '🔴 En direct' : '⭐ Prochain match favori'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    {nextFav.homeLogo && <img src={nextFav.homeLogo} alt="" style={{ width: 28, height: 28, objectFit: 'contain', marginBottom: 4 }} />}
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{nextFav.home}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: t.accent }}>{nextFav.time || 'vs'}</div>
                    {nextFav.date && <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{nextFav.date}</div>}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    {nextFav.awayLogo && <img src={nextFav.awayLogo} alt="" style={{ width: 28, height: 28, objectFit: 'contain', marginBottom: 4 }} />}
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{nextFav.away}</div>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div style={{
              margin: '0 24px 20px', padding: '16px 20px', borderRadius: 16,
              background: t.card, border: `1px solid ${t.border}`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>🏟️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>Note les joueurs, donne ton verdict</div>
                <div style={{ fontSize: 11, color: t.textDim }}>Ajoute tes matchs en favoris pour les retrouver ici</div>
              </div>
            </div>
          );
        })()}
        {/* User badge or login prompt */}
        <div style={{ margin: '0 24px 20px' }}>
          <UserBadge
            user={user}
            onLogin={() => setShowAuthModal(true)}
            onLogout={() => signOut(auth)}
            t={t}
            userPoints={userPoints}
          />
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} t={t} />
        <InstallBanner t={t} />

        {/* Profile modal */}
        {showProfile && user && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, backdropFilter: 'blur(8px)',
          }} onClick={() => setShowProfile(false)}>
            <div style={{
              background: t.gradient, borderRadius: 24, padding: 28, width: '100%', maxWidth: 360,
              border: `1px solid ${t.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
                  background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 900, color: '#fff',
                }}>{(user.displayName || 'S')[0].toUpperCase()}</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{user.displayName || 'Siffleur'}</div>
                <div style={{ fontSize: 12, color: t.textDim, marginTop: 4 }}>{user.email}</div>
                {userProfile?.favoriteClub && getClubById(userProfile.favoriteClub) && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
                    padding: '4px 12px', borderRadius: 20,
                    background: t.accentDim, border: `1px solid ${t.accent}33`,
                  }}>
                    {getClubById(userProfile.favoriteClub).crest && (
                      <img src={getClubById(userProfile.favoriteClub).crest} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.accent }}>{getClubById(userProfile.favoriteClub).name}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Points', value: userPoints },
                  { label: 'Matchs notés', value: userProfile?.matchesRated || 0 },
                  { label: 'Favoris', value: favorites.length },
                ].map((s, i) => (
                  <div key={i} style={{
                    flex: 1, textAlign: 'center', padding: '14px 8px',
                    background: t.card, borderRadius: 14, border: `1px solid ${t.border}`,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: t.accent }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: t.textDim, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Level progress */}
              {(() => {
                const lvl = getLevelFromPoints(userPoints);
                return (
                  <div style={{
                    padding: '12px 14px', borderRadius: 14, marginBottom: 14,
                    background: t.accentDim, border: `1px solid ${t.accent}33`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 18 }}>{lvl.current.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: lvl.current.color }}>{lvl.current.name}</span>
                      </div>
                      {lvl.next && <span style={{ fontSize: 10, color: t.textDim }}>{lvl.pointsToNext} pts pour {lvl.next.name}</span>}
                    </div>
                    {lvl.next && (
                      <div style={{ background: 'rgba(128,128,128,0.12)', borderRadius: 10, height: 6, overflow: 'hidden' }}>
                        <div style={{
                          width: `${lvl.progress}%`, height: '100%',
                          background: `linear-gradient(90deg, ${t.accent}, #00b0ff)`,
                          transition: 'width 0.4s',
                        }} />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Badges */}
              {userProfile?.earnedBadges?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: t.textDim, marginBottom: 8 }}>
                    Badges ({userProfile.earnedBadges.length}/{BADGES.length})
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {userProfile.earnedBadges.slice(0, 8).map(bid => {
                      const b = BADGES.find(x => x.id === bid);
                      if (!b) return null;
                      return (
                        <div key={bid} title={`${b.name} — ${b.desc}`} style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: t.card, border: `1px solid ${t.accent}33`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>{b.icon}</div>
                      );
                    })}
                    {userProfile.earnedBadges.length > 8 && (
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: t.toggleBg, border: `1px dashed ${t.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: t.textDim,
                      }}>+{userProfile.earnedBadges.length - 8}</div>
                    )}
                  </div>
                </div>
              )}

              <button onClick={() => { setShowProfile(false); setShowClubPicker(true); }} style={{
                width: '100%', padding: '12px 0', borderRadius: 12, border: `1px solid ${t.border}`,
                background: t.card, color: t.text, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                ⚽ {userProfile?.favoriteClub ? 'Changer de club favori' : 'Choisir un club favori'}
              </button>
              <button onClick={() => { signOut(auth); setShowProfile(false); }} style={{
                width: '100%', padding: '12px 0', borderRadius: 12, border: `1px solid ${t.border}`,
                background: t.card, color: '#e74c3c', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Se déconnecter</button>
            </div>
          </div>
        )}

        {/* Club picker modal */}
        {showClubPicker && user && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, backdropFilter: 'blur(8px)',
          }} onClick={() => setShowClubPicker(false)}>
            <div style={{
              background: t.gradient, borderRadius: 24, padding: 24, width: '100%', maxWidth: 400,
              maxHeight: '85vh', overflowY: 'auto',
              border: `1px solid ${t.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>⚽</div>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>Ton club favori</h2>
                <p style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>
                  Il sera affiché sur ton profil et à côté de ton nom
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {POPULAR_CLUBS.filter(c => c.id !== 'none').map(club => {
                  const selected = userProfile?.favoriteClub === club.id;
                  return (
                    <button key={club.id} onClick={async () => {
                      await updateFavoriteClub(user.uid, club.id);
                      setUserProfile(prev => ({ ...(prev || {}), favoriteClub: club.id }));
                      setShowClubPicker(false);
                      checkBadges();
                    }} style={{
                      padding: '10px 8px', borderRadius: 12,
                      background: selected ? t.accentDim : t.card,
                      border: selected ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}>
                      {club.crest ? (
                        <img src={club.crest} alt={club.name} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                      ) : (
                        <div style={{ fontSize: 20 }}>⚽</div>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.text, textAlign: 'center' }}>{club.name}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={async () => {
                await updateFavoriteClub(user.uid, null);
                setUserProfile(prev => ({ ...(prev || {}), favoriteClub: null }));
                setShowClubPicker(false);
              }} style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: 'transparent', border: `1px dashed ${t.border}`,
                color: t.textDim, fontSize: 12, cursor: 'pointer', marginBottom: 8,
              }}>Retirer mon club favori</button>
              <button onClick={() => setShowClubPicker(false)} style={{
                width: '100%', padding: '10px 0', borderRadius: 10,
                background: 'transparent', border: 'none',
                color: t.textDim, fontSize: 12, cursor: 'pointer',
              }}>Annuler</button>
            </div>
          </div>
        )}

        <div style={{ padding: '0 24px 100px' }}>
          {/* WEEKLY QUESTS (only for logged in users) */}
          {user && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.textDim, marginBottom: 10 }}>🎯 Quêtes de la semaine</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {WEEKLY_QUESTS.map((q, i) => (
                  <div key={q.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 14,
                    background: t.card, border: `1px solid ${t.border}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: t.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}>{q.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{q.title}</div>
                      <div style={{ fontSize: 11, color: t.accent, fontWeight: 600, marginTop: 2 }}>+{q.reward} pts à débloquer</div>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: 10, background: t.toggleBg,
                      fontSize: 10, fontWeight: 800, color: t.textDim,
                    }}>0/{q.target}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOP PERFORMANCES */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.textDim, marginBottom: 10 }}>🏆 Top joueurs</h2>
            {topPlayers.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
                {topPlayers.map((p, i) => (
                  <div key={i} style={{
                    minWidth: 110, padding: '14px 12px', borderRadius: 16, textAlign: 'center',
                    background: i === 0 ? t.accentDim : t.card, border: `1px solid ${i === 0 ? t.accent + '33' : t.border}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: i === 0 ? '#f1c40f' : t.textDim, marginBottom: 4 }}>#{i + 1}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: t.accent }}>{p.average}</div>
                    <div style={{ fontSize: 9, color: t.textDim, marginTop: 2 }}>{p.count} votes</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '20px 16px', marginBottom: 16, borderRadius: 14,
                background: t.card, border: `1px dashed ${t.border}`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>⚽</div>
                <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.5 }}>
                  Les meilleurs joueurs apparaîtront ici après le prochain match. Sois le premier à noter !
                </div>
              </div>
            )}

            <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.textDim, marginBottom: 10 }}>🔥 Top matchs</h2>
            {topMatches.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
                {topMatches.map((m, i) => (
                  <div key={i} style={{
                    minWidth: 120, padding: '14px 12px', borderRadius: 16, textAlign: 'center',
                    background: i === 0 ? t.accentDim : t.card, border: `1px solid ${i === 0 ? t.accent + '33' : t.border}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: i === 0 ? '#f1c40f' : t.textDim, marginBottom: 4 }}>#{i + 1}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: t.accent }}>{m.average}</div>
                    <div style={{ fontSize: 9, color: t.textDim, marginTop: 2 }}>{m.count} votes</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '20px 16px', marginBottom: 16, borderRadius: 14,
                background: t.card, border: `1px dashed ${t.border}`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🏟️</div>
                <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.5 }}>
                  Les matchs les mieux notés par la communauté s'afficheront ici.
                </div>
              </div>
            )}
          </div>

          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.textDim, marginBottom: 14 }}>Compétitions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LEAGUES.map((league, i) => {
              const cachedMatches = realMatches[league.id];
              const matchCount = cachedMatches ? cachedMatches.length : null;
              const liveCount = cachedMatches ? cachedMatches.filter(m => m.status === 'live').length : 0;
              return (
                <div key={league.id}
                  onClick={() => { setSelectedLeague(league); setScreen('league'); setBottomNav('home'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', background: t.card, borderRadius: 14,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    border: `1px solid ${t.border}`, animation: `slideUp 0.4s ease ${i * 0.05}s both`,
                    boxShadow: `0 2px 8px ${t.shadowColor}`,
                  }}
                >
                  <span style={{ fontSize: 26 }}>{league.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{league.name}</div>
                    <div style={{ fontSize: 11, color: t.textDim, marginTop: 2 }}>{matchCount !== null ? `${matchCount} match${matchCount > 1 ? 's' : ''}` : 'Voir les matchs'}</div>
                  </div>
                  {liveCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(231,76,60,0.15)', padding: '4px 10px', borderRadius: 20 }}>
                      <PulsingDot /><span style={{ fontSize: 11, fontWeight: 700, color: t.live }}>{liveCount}</span>
                    </div>
                  )}
                  <span style={{ color: t.textDim, fontSize: 18 }}>›</span>
                </div>
              );
            })}
          </div>
          {/* Legal links */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 16, padding: '24px 0 8px',
          }}>
            <button onClick={() => setLegalPage('mentions')} style={{
              background: 'none', border: 'none', color: t.textDim,
              fontSize: 11, cursor: 'pointer', textDecoration: 'underline',
            }}>Mentions légales</button>
            <button onClick={() => setLegalPage('privacy')} style={{
              background: 'none', border: 'none', color: t.textDim,
              fontSize: 11, cursor: 'pointer', textDecoration: 'underline',
            }}>Confidentialité</button>
          </div>
        </div>
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
      </>
    );
  }

  // ══════════════════════════════════════
  // LEADERBOARD SCREEN
  // ══════════════════════════════════════
  if (screen === 'leaderboard') {
    const lb = realLeaderboard;
    const top3 = lb.length >= 3 ? [lb[1], lb[0], lb[2]] : [];
    return (
      <>
        {rewardToasts}
        <div style={baseStyle}>
        <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>🏅 Classement</h2>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
        </div>

        {lb.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏟️</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Pas encore de classement</div>
            <div style={{ fontSize: 13, color: t.textDim, lineHeight: 1.6 }}>
              Sois le premier à noter un match pour apparaître ici ! Les points sont calculés selon la proximité de tes notes avec la moyenne.
            </div>
          </div>
        )}

        {/* Podium top 3 */}
        {top3.length === 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, padding: '8px 24px 24px' }}>
            {top3.map((u, i) => {
              const heights = [100, 130, 80];
              const medals = [t.silver, t.gold, t.bronze];
              const ranks = ['2', '1', '3'];
              const isMe = user && u.id === user.uid;
              return (
                <div key={u.id} style={{ flex: 1, textAlign: 'center', animation: `slideUp 0.5s ease ${i * 0.12}s both` }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{i === 1 ? '🏆' : i === 0 ? '🥈' : '🥉'}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4, color: isMe ? t.accent : t.text }}>{u.displayName || 'Siffleur'}</div>
                  <div style={{ fontSize: 11, color: t.textDim, marginBottom: 8 }}>{(u.points || 0).toLocaleString()} pts</div>
                  <div style={{
                    height: heights[i], borderRadius: '12px 12px 0 0',
                    background: `linear-gradient(180deg, ${medals[i]}44, ${medals[i]}22)`,
                    border: `1px solid ${medals[i]}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 900, color: medals[i],
                  }}>{ranks[i]}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        {lb.length > 0 && (
          <div style={{ padding: '0 24px 20px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.textDim, marginBottom: 12 }}>Classement complet</h3>
            {lb.map((u, i) => {
              const rank = i + 1;
              const isMe = user && u.id === user.uid;
              return (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', marginBottom: 6, borderRadius: 14,
                  background: isMe ? t.accentDim : t.card,
                  border: isMe ? `1px solid ${t.accent}44` : `1px solid ${t.border}`,
                  animation: `slideUp 0.3s ease ${i * 0.05}s both`,
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 900,
                    background: rank <= 3 ? [t.gold, t.silver, t.bronze][rank - 1] + '22' : 'rgba(128,128,128,0.1)',
                    color: rank <= 3 ? [t.gold, t.silver, t.bronze][rank - 1] : t.textDim,
                  }}>{rank}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isMe ? t.accent : t.text }}>
                      {u.displayName || 'Siffleur'} {isMe && <span style={{ fontSize: 11, fontWeight: 500, color: t.textDim }}>(toi)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: t.textDim }}>{u.matchesRated || 0} matchs notés</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: t.accent }}>{(u.points || 0).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Badges */}
        <div style={{ padding: '0 24px 100px' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.textDim, marginBottom: 12 }}>Badges à débloquer</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {BADGES_INFO.map((b, i) => (
              <div key={i} style={{ background: t.card, borderRadius: 14, padding: 14, border: `1px solid ${t.border}`, animation: `slideUp 0.3s ease ${i * 0.05}s both` }}>
                <span style={{ fontSize: 24 }}>{b.icon}</span>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{b.name}</div>
                <div style={{ fontSize: 10, color: t.textDim, marginTop: 2, lineHeight: 1.4 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
      </>
    );
  }

  // ══════════════════════════════════════
  // FAVORITES SCREEN
  // ══════════════════════════════════════
  if (screen === 'favorites') {
    return (
      <>
        {rewardToasts}
        <div style={baseStyle}>
        <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>⭐ Favoris</h2>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
        </div>

        {!user && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Connecte-toi pour sauvegarder tes favoris</div>
            <button onClick={() => setShowAuthModal(true)} style={{
              padding: '12px 28px', borderRadius: 12, border: 'none', marginTop: 8,
              background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
              color: '#0a0e17', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            }}>Se connecter</button>
          </div>
        )}

        {user && favorites.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Pas encore de favoris</div>
            <div style={{ fontSize: 13, color: t.textDim, lineHeight: 1.6 }}>
              Va dans un match et appuie sur l'étoile pour le retrouver ici. Prépare tes soirées foot à l'avance !
            </div>
          </div>
        )}

        {user && favorites.length > 0 && (
          <div style={{ padding: '0 24px 100px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: t.textDim, textTransform: 'uppercase', marginBottom: 12 }}>
              {favorites.length} match{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
            </div>
            {favorites.map((fav, i) => (
              <div key={fav.matchId || i} style={{
                background: t.card, borderRadius: 18, padding: '16px 20px',
                marginBottom: 10, border: `1px solid ${t.border}`,
                boxShadow: `0 2px 8px ${t.shadowColor}`,
                animation: `slideUp 0.3s ease ${i * 0.05}s both`,
                position: 'relative',
              }}>
                {/* Remove favorite button */}
                <button onClick={() => handleToggleFavorite({ id: fav.matchId, ...fav })} style={{
                  position: 'absolute', top: 10, right: 12,
                  background: 'none', border: 'none', fontSize: 18, cursor: 'pointer',
                  color: '#f1c40f', padding: 4,
                }}>⭐</button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                    color: fav.status === 'live' ? t.live : fav.status === 'finished' ? t.accent : t.textDim,
                    textTransform: 'uppercase',
                  }}>
                    {fav.status === 'live' ? 'En direct' : fav.status === 'finished' ? 'Terminé' : 'À venir'}
                  </span>
                  {fav.leagueName && <span style={{ fontSize: 10, color: t.textDim }}>{fav.leagueName}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 30 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    {fav.homeLogo && <img src={fav.homeLogo} alt="" style={{ width: 28, height: 28, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />}
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{fav.home}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: t.text }}>{fav.score || '- - -'}</div>
                    {fav.time && <div style={{ fontSize: 11, color: t.accent, fontWeight: 600, marginTop: 2 }}>{fav.time}</div>}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    {fav.awayLogo && <img src={fav.awayLogo} alt="" style={{ width: 28, height: 28, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />}
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{fav.away}</div>
                  </div>
                </div>
                {fav.date && <div style={{ textAlign: 'center', fontSize: 10, color: t.textDim, marginTop: 8 }}>{fav.date}</div>}
              </div>
            ))}
          </div>
        )}

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} t={t} />
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
      </>
    );
  }

  // ══════════════════════════════════════
  // GLOBAL CHAT SCREEN
  // ══════════════════════════════════════
  if (screen === 'globalchat') {
    const submitGlobalMsg = async () => {
      if (!user) { setShowAuthModal(true); return; }
      if (!globalNewMsg.trim()) return;
      const replyData = globalReplyTo ? { id: globalReplyTo.id, user: globalReplyTo.displayName, text: globalReplyTo.text } : null;
      await sendGlobalMessage(user.uid, user.displayName, globalNewMsg.trim(), replyData, userProfile?.favoriteClub || null);
      await incrementChatCount(user.uid);
      setGlobalNewMsg('');
      setGlobalReplyTo(null);
      const updated = await getGlobalMessages(50);
      setGlobalMessages(updated);
      checkBadges();
    };

    const toggleGlobalReaction = async (msgId, emoji) => {
      const key = `g_${msgId}_${emoji}`;
      const already = userReactions[key];
      setUserReactions(prev => ({ ...prev, [key]: !already }));
      setGlobalMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        const reactions = { ...m.reactions };
        if (already) { reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1); if (reactions[emoji] === 0) delete reactions[emoji]; }
        else { reactions[emoji] = (reactions[emoji] || 0) + 1; }
        return { ...m, reactions };
      }));
      await reactToGlobalMessage(msgId, emoji, already ? -1 : 1);
    };

    const timeAgo = (ts) => {
      const diff = (Date.now() - new Date(ts).getTime()) / 1000;
      if (diff < 60) return "à l'instant";
      if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
      if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
      return `il y a ${Math.floor(diff / 86400)}j`;
    };

    return (
      <>
        {rewardToasts}
        <div style={baseStyle}>
        <div style={{ padding: '24px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>💬 Chat global</h2>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
        </div>
        <div style={{ padding: '0 24px', fontSize: 12, color: t.textDim, marginBottom: 14 }}>
          Discute foot avec toute la communauté LeSifflet
        </div>

        {/* Message input */}
        <div style={{ padding: '0 24px 10px' }}>
          {globalReplyTo && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', marginBottom: 6, borderRadius: 10,
              background: t.accentDim, border: `1px solid ${t.accent}33`, fontSize: 11,
            }}>
              <span style={{ color: t.textDim }}>Réponse à <span style={{ color: t.accent, fontWeight: 700 }}>{globalReplyTo.displayName}</span></span>
              <button onClick={() => setGlobalReplyTo(null)} style={{ background: 'none', border: 'none', color: t.textDim, fontSize: 14, cursor: 'pointer' }}>✕</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, background: t.card, borderRadius: 14, padding: 8, border: `1px solid ${t.border}` }}>
            <input value={globalNewMsg} onChange={e => setGlobalNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitGlobalMsg()}
              placeholder="Ton message..."
              style={{ flex: 1, background: t.inputBg, border: 'none', outline: 'none', color: t.text, fontSize: 13, padding: '8px 10px', fontFamily: 'inherit', borderRadius: 8 }}
            />
            <button onClick={submitGlobalMsg} style={{
              background: t.accent, border: 'none', borderRadius: 10,
              color: t.btnText, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>Envoyer</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ padding: '0 24px 100px', overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
          {globalMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Pas encore de messages</div>
              <div style={{ fontSize: 12, color: t.textDim }}>Sois le premier à lancer la discussion !</div>
            </div>
          )}
          {globalMessages.map((msg, i) => (
            <div key={msg.id} style={{
              background: t.card, borderRadius: 16, padding: '12px 14px', marginBottom: 8,
              border: `1px solid ${t.border}`, animation: `slideUp 0.2s ease ${i * 0.03}s both`,
            }}>
              {/* Reply reference */}
              {msg.replyTo && (
                <div style={{
                  padding: '6px 10px', marginBottom: 8, borderRadius: 8,
                  borderLeft: `3px solid ${t.accent}`, background: t.accentDim, fontSize: 11,
                }}>
                  <span style={{ fontWeight: 700, color: t.accent }}>{msg.replyTo.user}</span>
                  <span style={{ color: t.textDim, marginLeft: 6 }}>{msg.replyTo.text?.slice(0, 80)}{msg.replyTo.text?.length > 80 ? '...' : ''}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                <div onClick={() => openUserProfile(msg.userId, msg.displayName)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  {msg.favoriteClub && getClubById(msg.favoriteClub)?.crest && (
                    <img src={getClubById(msg.favoriteClub).crest} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>{msg.displayName}</span>
                </div>
                <span style={{ fontSize: 10, color: t.textDim }}>{timeAgo(msg.timestamp)}</span>
              </div>
              <p style={{ fontSize: 14, color: t.text, lineHeight: 1.5, marginBottom: 8 }}>{msg.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {/* Reactions */}
                {Object.entries(msg.reactions || {}).filter(([, c]) => c > 0).map(([emoji, count]) => (
                  <button key={emoji} onClick={() => toggleGlobalReaction(msg.id, emoji)} style={{
                    display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 16,
                    background: userReactions[`g_${msg.id}_${emoji}`] ? t.accentDim : t.toggleBg,
                    border: userReactions[`g_${msg.id}_${emoji}`] ? `1px solid ${t.accent}33` : `1px solid ${t.border}`,
                    fontSize: 12, cursor: 'pointer', color: t.text,
                  }}><span>{emoji}</span><span style={{ fontWeight: 700 }}>{count}</span></button>
                ))}
                {/* Add reaction */}
                {REACTION_EMOJIS.slice(0, 4).map(emoji => (
                  !msg.reactions?.[emoji] && <button key={emoji} onClick={() => toggleGlobalReaction(msg.id, emoji)} style={{
                    padding: '3px 6px', borderRadius: 16, background: t.toggleBg, border: `1px solid ${t.border}`,
                    fontSize: 12, cursor: 'pointer', opacity: 0.4,
                  }}>{emoji}</button>
                ))}
                {/* Reply button */}
                <button onClick={() => setGlobalReplyTo(msg)} style={{
                  padding: '3px 8px', borderRadius: 16, background: t.toggleBg, border: `1px solid ${t.border}`,
                  fontSize: 11, cursor: 'pointer', color: t.textDim, fontWeight: 600, marginLeft: 'auto',
                }}>↩ Répondre</button>
              </div>
            </div>
          ))}
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} t={t} />
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
      </>
    );
  }

  // ══════════════════════════════════════
  // USER PROFILE SCREEN
  // ══════════════════════════════════════
  if (screen === 'userprofile' && viewedProfile) {
    const p = viewedProfileData;
    return (
      <>
        {rewardToasts}
        <div style={baseStyle}>
        <div style={{ padding: '20px 24px 12px' }}>
          <button onClick={goBack} style={{
            background: t.toggleBg, border: `1px solid ${t.border}`, color: t.text,
            width: 34, height: 34, borderRadius: 10, fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
        </div>
        <div style={{ textAlign: 'center', padding: '10px 24px 24px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px',
            background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 900, color: '#fff',
          }}>{(viewedProfile.displayName || '?')[0].toUpperCase()}</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{viewedProfile.displayName || 'Siffleur'}</div>
          {p?.favoriteClub && getClubById(p.favoriteClub) && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
              padding: '4px 12px', borderRadius: 20,
              background: t.accentDim, border: `1px solid ${t.accent}33`,
            }}>
              {getClubById(p.favoriteClub).crest && (
                <img src={getClubById(p.favoriteClub).crest} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
              )}
              <span style={{ fontSize: 11, fontWeight: 700, color: t.accent }}>{getClubById(p.favoriteClub).name}</span>
            </div>
          )}
          {p && <div style={{ fontSize: 12, color: t.textDim, marginTop: 8 }}>Membre depuis {new Date(p.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>}
        </div>

        {p ? (
          <div style={{ padding: '0 24px 100px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { icon: '🏅', label: 'Points', value: p.points || 0 },
                { icon: '⚽', label: 'Notes', value: p.totalRatings || 0 },
                { icon: '💬', label: 'Messages', value: p.totalComments || 0 },
                { icon: '🏟️', label: 'Matchs', value: p.matchesRated || 0 },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, textAlign: 'center', padding: '16px 6px',
                  background: t.card, borderRadius: 14, border: `1px solid ${t.border}`,
                }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: t.accent }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: t.textDim, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Rank info */}
            {/* Level */}
            {(() => {
              const lvl = getLevelFromPoints(p.points || 0);
              return (
                <div style={{
                  padding: '14px 18px', borderRadius: 16, marginBottom: 12,
                  background: t.accentDim, border: `1px solid ${t.accent}33`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: lvl.next ? 10 : 0 }}>
                    <span style={{ fontSize: 28 }}>{lvl.current.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: lvl.current.color }}>{lvl.current.name}</div>
                      <div style={{ fontSize: 11, color: t.textDim }}>{p.points || 0} points au total</div>
                    </div>
                  </div>
                  {lvl.next && (
                    <div style={{ background: 'rgba(128,128,128,0.12)', borderRadius: 10, height: 6, overflow: 'hidden' }}>
                      <div style={{
                        width: `${lvl.progress}%`, height: '100%',
                        background: `linear-gradient(90deg, ${t.accent}, #00b0ff)`,
                      }} />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Badges */}
            {p.earnedBadges?.length > 0 && (
              <div style={{
                padding: '14px 18px', borderRadius: 16, marginBottom: 12,
                background: t.card, border: `1px solid ${t.border}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: t.textDim, marginBottom: 10 }}>
                  Badges ({p.earnedBadges.length}/{BADGES.length})
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.earnedBadges.map(bid => {
                    const b = BADGES.find(x => x.id === bid);
                    if (!b) return null;
                    return (
                      <div key={bid} title={`${b.name} — ${b.desc}`} style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: t.toggleBg, border: `1px solid ${t.accent}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      }}>{b.icon}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Last active */}
            {p.lastActive && (
              <div style={{ fontSize: 12, color: t.textDim, textAlign: 'center' }}>
                Dernière activité : {new Date(p.lastActive).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: t.textDim }}>Chargement...</div>
        )}
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
      </>
    );
  }

  // ══════════════════════════════════════
  // LEAGUE SCREEN
  // ══════════════════════════════════════
  if (screen === 'league') {
    const allMatches = realMatches[selectedLeague.id] || [];
    const isLoading = loadingMatches && allMatches.length === 0;
    const liveMatches = allMatches.filter(m => m.status === 'live');
    const upcomingMatches = allMatches.filter(m => m.status === 'upcoming');
    const finishedMatches = allMatches.filter(m => m.status === 'finished');

    // Default filter: live > upcoming > finished
    const defaultFilter = liveMatches.length > 0 ? 'live' : upcomingMatches.length > 0 ? 'upcoming' : 'finished';
    const activeFilter = leagueFilter || defaultFilter;
    const filteredMatches = activeFilter === 'live' ? liveMatches : activeFilter === 'upcoming' ? upcomingMatches : finishedMatches;

    return (
      <>
        {rewardToasts}
        <div style={baseStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={goBack} style={{
              background: t.toggleBg, border: `1px solid ${t.border}`, color: t.text,
              width: 38, height: 38, borderRadius: 12, fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>←</button>
            <span style={{ fontSize: 26 }}>{selectedLeague.flag}</span>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selectedLeague.name}</h2>
          </div>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
        </div>

        {/* Filter tabs */}
        {!isLoading && allMatches.length > 0 && (
          <div style={{ display: 'flex', gap: 6, padding: '0 24px 14px' }}>
            {[
              { id: 'live', label: 'En direct', count: liveMatches.length, emoji: '🔴' },
              { id: 'upcoming', label: 'À venir', count: upcomingMatches.length, emoji: '📅' },
              { id: 'finished', label: 'Terminés', count: finishedMatches.length, emoji: '🏁' },
            ].map(f => (
              <button key={f.id} onClick={() => setLeagueFilter(f.id)} disabled={f.count === 0} style={{
                flex: 1, padding: '10px 8px', borderRadius: 12,
                border: activeFilter === f.id ? `1px solid ${t.accent}44` : `1px solid ${t.border}`,
                background: activeFilter === f.id ? t.accentDim : f.count === 0 ? 'transparent' : t.toggleBg,
                color: f.count === 0 ? t.textDim : activeFilter === f.id ? t.accent : t.text,
                fontSize: 11, fontWeight: 700, cursor: f.count === 0 ? 'not-allowed' : 'pointer',
                opacity: f.count === 0 ? 0.4 : 1, transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{f.emoji}</div>
                <div>{f.label}</div>
                <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{f.count}</div>
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: '0 24px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚽</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.textDim }}>Chargement des matchs...</div>
            </div>
          )}
          {!isLoading && allMatches.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: t.card, borderRadius: 20, border: `1px solid ${t.border}`,
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Pas de match cette semaine</div>
              <div style={{ fontSize: 13, color: t.textDim, lineHeight: 1.5 }}>
                Trêve internationale ou intersaison. Les matchs réapparaîtront automatiquement à la reprise du championnat.
              </div>
            </div>
          )}
          {!isLoading && allMatches.length > 0 && filteredMatches.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              background: t.card, borderRadius: 20, border: `1px solid ${t.border}`,
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{activeFilter === 'live' ? '⏸️' : activeFilter === 'upcoming' ? '📅' : '🏁'}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.textDim }}>
                {activeFilter === 'live' ? 'Pas de match en direct' : activeFilter === 'upcoming' ? 'Pas de prochains matchs' : 'Pas de matchs récents'}
              </div>
            </div>
          )}
          {filteredMatches.map((match, i) => (
            <div key={match.id}
              onClick={() => { setSelectedMatch(match); setScreen('match'); setSelectedTeamTab('home'); setBottomNav('home'); }}
              style={{
                background: t.card, borderRadius: 18, padding: '18px 22px',
                cursor: 'pointer', transition: 'all 0.2s ease',
                border: match.status === 'live' ? '1px solid rgba(231,76,60,0.3)' : `1px solid ${t.border}`,
                animation: `slideUp 0.4s ease ${i * 0.06}s both`,
                boxShadow: `0 2px 10px ${t.shadowColor}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {match.status === 'live' && <PulsingDot />}
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
                    color: match.status === 'live' ? t.live : match.status === 'finished' ? t.accent : t.textDim,
                  }}>
                    {match.status === 'live' ? `En direct · ${match.minute}` : match.status === 'finished' ? 'Terminé' : 'À venir'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: t.textDim }}>{match.date}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite({ ...match, leagueName: selectedLeague?.name || '' }); }} style={{
                    background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', padding: '2px 4px',
                    color: favMatchIds.has(match.id) ? '#f1c40f' : t.textDim,
                    transition: 'transform 0.2s',
                    transform: favMatchIds.has(match.id) ? 'scale(1.2)' : 'scale(1)',
                  }}>{favMatchIds.has(match.id) ? '⭐' : '☆'}</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  {match.homeLogo && <img src={match.homeLogo} alt="" style={{ width: 28, height: 28, objectFit: 'contain', marginBottom: 4 }} />}
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{match.home}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 26, fontWeight: 900, padding: '5px 18px', borderRadius: 12,
                    background: match.status === 'live' ? 'rgba(231,76,60,0.1)' : t.toggleBg,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{match.score}</div>
                  {match.status === 'upcoming' && match.time && (
                    <div style={{ fontSize: 11, color: t.accent, marginTop: 4, fontWeight: 600 }}>{match.time}</div>
                  )}
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  {match.awayLogo && <img src={match.awayLogo} alt="" style={{ width: 28, height: 28, objectFit: 'contain', marginBottom: 4 }} />}
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{match.away}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
      </>
    );
  }

  // ══════════════════════════════════════
  // MATCH SCREEN
  // ══════════════════════════════════════
  if (screen === 'match') {
    const players = getPlayers();
    const hasRealLineups = useRealData && realLineups;
    const currentPlayers = selectedTeamTab === 'home' ? players.home : players.away;
    const ratedCount = Object.keys(playerRatings).length;
    const totalPlayers = [...players.home, ...players.away].length;

    return (
      <>
        {rewardToasts}
        <div style={baseStyle}>
        {/* Draft saved overlay (during live match) */}
        {draftSaved && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center', animation: 'slideUp 0.3s ease', padding: 32 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Brouillon sauvegardé !</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, maxWidth: 300 }}>
                Tes notes sont enregistrées en brouillon. Tu peux encore les modifier jusqu'à la fin du match.
              </div>
              <div style={{ color: '#f1c40f', fontSize: 13, fontWeight: 700, marginTop: 16 }}>
                🏁 Ton verdict sera validé au coup de sifflet final
              </div>
            </div>
          </div>
        )}
        {/* Final confirmation overlay (match finished) */}
        {showConfirmation && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Coup de sifflet final !</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>Ton verdict a été enregistré définitivement</div>
              <div style={{ color: '#00e676', fontSize: 16, fontWeight: 800, marginTop: 12 }}>+{pointsEarned} pts gagnés 🎉</div>
              {pointsEarned >= 40 && <div style={{ color: '#f1c40f', fontSize: 12, marginTop: 4 }}>👁️ Œil de Lynx ! Tes notes sont proches de la moyenne</div>}
            </div>
          </div>
        )}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} t={t} />
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={goBack} style={{
                background: t.toggleBg, border: `1px solid ${t.border}`, color: t.text,
                width: 34, height: 34, borderRadius: 10, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>←</button>
              {selectedMatch.status === 'live' && <PulsingDot />}
              <span style={{ fontSize: 11, fontWeight: 600, color: selectedMatch.status === 'live' ? t.live : t.textDim, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {selectedMatch.status === 'live' ? `Direct · ${selectedMatch.minute}` : selectedMatch.status === 'finished' ? 'Terminé' : 'À venir'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => handleToggleFavorite({ ...selectedMatch, leagueName: selectedLeague?.name || '' })} style={{
                background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px 6px',
                color: favMatchIds.has(selectedMatch.id) ? '#f1c40f' : t.textDim,
              }}>{favMatchIds.has(selectedMatch.id) ? '⭐' : '☆'}</button>
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{selectedMatch.home}</span>
            <span style={{ fontSize: 28, fontWeight: 900, padding: '3px 14px', borderRadius: 10, background: t.toggleBg }}>{selectedMatch.score}</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{selectedMatch.away}</span>
          </div>
        </div>
        {/* Draft mode banner */}
        {isDraftMode() && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            margin: '0 24px', padding: '8px 14px', borderRadius: 10,
            background: 'rgba(241,196,15,0.08)', border: '1px solid rgba(241,196,15,0.2)',
          }}>
            <span style={{ fontSize: 14 }}>📝</span>
            <span style={{ fontSize: 11, color: '#f1c40f', fontWeight: 600 }}>Mode brouillon — tes notes seront validées à la fin du match</span>
          </div>
        )}
        <div style={{ display: 'flex', padding: '10px 24px', gap: 6 }}>
          {['players', 'match', 'comments'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '9px 0', borderRadius: 12, border: 'none',
              background: activeTab === tab ? t.accent : t.toggleBg,
              color: activeTab === tab ? t.btnText : t.textDim,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {tab === 'players' ? '⚽ Joueurs' : tab === 'match' ? '📊 Match' : `💬 ${comments.length}`}
            </button>
          ))}
        </div>
        <div style={{ padding: '0 24px 140px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
          {/* PLAYERS TAB */}
          {activeTab === 'players' && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {['home', 'away'].map(tab => (
                  <button key={tab} onClick={() => setSelectedTeamTab(tab)} style={{
                    flex: 1, padding: 10, borderRadius: 12, border: 'none',
                    background: selectedTeamTab === tab ? t.cardHover : 'transparent',
                    color: selectedTeamTab === tab ? t.text : t.textDim,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    borderBottom: selectedTeamTab === tab ? `2px solid ${t.accent}` : '2px solid transparent',
                  }}>
                    {tab === 'home' ? selectedMatch.home : selectedMatch.away}
                  </button>
                ))}
              </div>
              {loadingLineups && (
                <div style={{ textAlign: 'center', padding: '40px 0', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
                  <div style={{ fontSize: 14, color: t.textDim, fontWeight: 600 }}>Chargement des compositions...</div>
                </div>
              )}
              {!loadingLineups && currentPlayers.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  background: t.card, borderRadius: 16, border: `1px solid ${t.border}`,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>
                    {selectedMatch.status === 'upcoming' ? '📋' : '⏳'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                    {selectedMatch.status === 'upcoming'
                      ? 'Compositions pas encore disponibles'
                      : 'Compositions en cours de chargement'}
                  </div>
                  <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.5 }}>
                    {selectedMatch.status === 'upcoming'
                      ? 'Les compositions officielles sont publiées environ 1h avant le coup d\'envoi. Reviens un peu avant le match !'
                      : 'Les données arrivent, réessaie dans quelques instants.'}
                  </div>
                </div>
              )}
              {/* Rating lock banner */}
              {!loadingLineups && currentPlayers.length > 0 && !canRate() && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', marginBottom: 14, borderRadius: 12,
                  background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.25)',
                }}>
                  <span style={{ fontSize: 20 }}>🔒</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1c40f' }}>Notation verrouillée</div>
                    <div style={{ fontSize: 11, color: t.textDim, marginTop: 2 }}>
                      {selectedMatch.status === 'upcoming'
                        ? 'Tu pourras noter les joueurs à partir de la mi-temps.'
                        : 'Les notes ouvrent à la mi-temps (45\') pour garantir des verdicts crédibles.'}
                    </div>
                  </div>
                </div>
              )}
              {!loadingLineups && currentPlayers.map((player, i) => (
                <div key={player.id} style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  padding: '12px 14px', marginBottom: 6, borderRadius: 14,
                  background: playerRatings[player.id] ? t.accentDim : t.card,
                  border: `1px solid ${playerRatings[player.id] ? t.accent + '33' : t.border}`,
                  animation: `slideUp 0.3s ease ${i * 0.03}s both`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: 'rgba(128,128,128,0.12)', color: t.textDim, letterSpacing: 1 }}>{player.pos}</span>
                      {player.number && <span style={{ fontSize: 10, fontWeight: 700, color: t.textDim }}>#{player.number}</span>}
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{player.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {playerRatings[player.id] && <span style={{ fontSize: 18, fontWeight: 900, color: t.accent }}>{playerRatings[player.id]}</span>}
                      {communityPlayerAvgs[player.id] && (
                        <span style={{ fontSize: 11, color: t.textDim }}>
                          moy. {communityPlayerAvgs[player.id].average} ({communityPlayerAvgs[player.id].count})
                        </span>
                      )}
                    </div>
                  </div>
                  {canRate() ? (
                    <StarRating value={playerRatings[player.id] || 0} onChange={r => ratePlayer(player.id, r)} size={22} />
                  ) : (
                    <div style={{ fontSize: 11, color: t.textDim, fontStyle: 'italic' }}>🔒 Notation à partir de la mi-temps</div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* MATCH TAB */}
          {activeTab === 'match' && (
            <div style={{ animation: 'slideUp 0.3s ease' }}>
              <div style={{ background: t.card, borderRadius: 18, padding: 22, border: `1px solid ${t.border}`, textAlign: 'center', boxShadow: `0 2px 10px ${t.shadowColor}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>Note ce match</div>
                {canRate() ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                      <StarRating value={matchRating} onChange={setMatchRating} size={30} />
                    </div>
                    {matchRating > 0 && <div style={{ fontSize: 44, fontWeight: 900, color: t.accent }}>{matchRating}<span style={{ fontSize: 18, color: t.textDim }}>/10</span></div>}
                  </>
                ) : (
                  <div style={{ padding: '16px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
                    <div style={{ fontSize: 13, color: '#f1c40f', fontWeight: 700, marginBottom: 4 }}>Notation verrouillée</div>
                    <div style={{ fontSize: 12, color: t.textDim }}>
                      {selectedMatch.status === 'upcoming'
                        ? 'Tu pourras noter après la mi-temps du match.'
                        : 'La notation ouvre à la 45e minute.'}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ background: t.card, borderRadius: 18, padding: 22, marginTop: 10, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Moyenne communauté</div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: t.accent }}>{communityMatchAvg.average > 0 ? communityMatchAvg.average : '—'}</div>
                    <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Note</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 900 }}>{communityMatchAvg.count || 0}</div>
                    <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Votes</div>
                  </div>
                </div>
              </div>
              <div style={{ background: t.card, borderRadius: 18, padding: 22, marginTop: 10, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 12, color: t.textDim, marginBottom: 8 }}>{ratedCount} / {totalPlayers} joueurs notés</div>
                <div style={{ background: 'rgba(128,128,128,0.12)', borderRadius: 10, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${(ratedCount / totalPlayers) * 100}%`, height: '100%', borderRadius: 10, background: `linear-gradient(90deg, ${t.accent}, #00b0ff)`, transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: 11, color: t.accent, marginTop: 6 }}>
                  {ratedCount > 0 ? 'Plus tes notes sont proches de la moyenne, plus tu gagnes de points !' : 'Note des joueurs pour gagner des points'}
                </div>
              </div>
            </div>
          )}

          {/* COMMENTS TAB */}
          {activeTab === 'comments' && (
            <div style={{ animation: 'slideUp 0.3s ease' }}>
              {/* Reply banner */}
              {replyTo && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', marginBottom: 6, borderRadius: 10,
                  background: t.accentDim, border: `1px solid ${t.accent}33`, fontSize: 11,
                }}>
                  <span style={{ color: t.textDim }}>Réponse à <span style={{ color: t.accent, fontWeight: 700 }}>{replyTo.displayName || replyTo.user}</span></span>
                  <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: t.textDim, fontSize: 14, cursor: 'pointer' }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, background: t.card, borderRadius: 14, padding: 8, border: `1px solid ${t.border}` }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitComment()}
                  placeholder={replyTo ? `Répondre à ${replyTo.displayName || replyTo.user}...` : "Ton commentaire..."}
                  style={{ flex: 1, background: t.inputBg, border: 'none', outline: 'none', color: t.text, fontSize: 13, padding: '8px 10px', fontFamily: 'inherit', borderRadius: 8 }}
                />
                <button onClick={submitComment} style={{
                  background: t.accent, border: 'none', borderRadius: 10,
                  color: t.btnText, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}>Envoyer</button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[{ id: 'hot', label: '🔥 Top réactions' }, { id: 'recent', label: '🕐 Récents' }].map(s => (
                  <button key={s.id} onClick={() => setCommentSort(s.id)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 10, border: commentSort === s.id ? `1px solid ${t.accent}33` : `1px solid ${t.border}`,
                    background: commentSort === s.id ? t.accentDim : t.toggleBg,
                    color: commentSort === s.id ? t.accent : t.textDim,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  }}>{s.label}</button>
                ))}
              </div>
              {commentSort === 'hot' && sortedComments.length > 0 && getTotalReactions(sortedComments[0]) > 0 && (
                <div style={{
                  background: `linear-gradient(135deg, ${t.accent}15, ${t.accent}08)`,
                  borderRadius: 16, padding: '14px 16px', marginBottom: 14, border: `1px solid ${t.accent}33`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>👑</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: t.accent, textTransform: 'uppercase', letterSpacing: 1.5 }}>Commentaire du match</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: sortedComments[0].user === 'Toi' ? t.accent : t.text }}>{sortedComments[0].user}</span>
                    <span style={{ fontSize: 10, color: t.textDim }}>{getTotalReactions(sortedComments[0])} réactions</span>
                  </div>
                  <p style={{ fontSize: 14, color: t.text, lineHeight: 1.5, fontWeight: 500 }}>{sortedComments[0].text}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {Object.entries(sortedComments[0].reactions).sort((a, b) => b[1] - a[1]).map(([emoji, count]) => (
                      <span key={emoji} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 20, background: t.toggleBg, fontSize: 12, border: `1px solid ${t.border}`,
                      }}>
                        <span>{emoji}</span><span style={{ fontWeight: 700, color: t.text }}>{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sortedComments.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  background: t.card, borderRadius: 16, border: `1px solid ${t.border}`,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Pas encore de commentaires</div>
                  <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.5 }}>
                    Sois le premier à donner ton avis sur ce match !
                  </div>
                </div>
              )}
              {sortedComments.map((c, i) => {
                const isPickerOpen = emojiPickerOpen === c.id;
                const timeAgo = (ts) => {
                  if (!ts) return '';
                  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
                  if (diff < 60) return "à l'instant";
                  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
                  return `${Math.floor(diff / 86400)}j`;
                };
                return (
                  <div key={c.id} style={{
                    background: t.card, borderRadius: 14, padding: '12px 14px', marginBottom: 8,
                    border: `1px solid ${t.border}`, animation: `slideUp 0.3s ease ${i * 0.03}s both`, position: 'relative',
                  }}>
                    {/* Reply reference */}
                    {c.replyTo && (
                      <div style={{
                        padding: '6px 10px', marginBottom: 8, borderRadius: 8,
                        borderLeft: `3px solid ${t.accent}`, background: t.accentDim, fontSize: 11,
                      }}>
                        <span style={{ fontWeight: 700, color: t.accent }}>{c.replyTo.user}</span>
                        <span style={{ color: t.textDim, marginLeft: 6 }}>{c.replyTo.text?.slice(0, 60)}{c.replyTo.text?.length > 60 ? '...' : ''}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                      <div onClick={() => c.userId && openUserProfile(c.userId, c.displayName)} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        cursor: c.userId ? 'pointer' : 'default',
                      }}>
                        {c.favoriteClub && getClubById(c.favoriteClub)?.crest && (
                          <img src={getClubById(c.favoriteClub).crest} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        )}
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: (user && c.userId === user.uid) ? t.accent : t.text,
                        }}>{c.displayName || c.user || 'Siffleur'}</span>
                      </div>
                      <span style={{ fontSize: 10, color: t.textDim }}>{timeAgo(c.timestamp) || c.time}</span>
                    </div>
                    <p style={{ fontSize: 13, color: isDark ? 'rgba(237,242,247,0.85)' : 'rgba(26,26,46,0.8)', lineHeight: 1.5, marginBottom: 8 }}>{c.text}</p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      {Object.entries(c.reactions || {}).sort((a, b) => b[1] - a[1]).map(([emoji, count]) => {
                        const reacted = userReactions[`${c.id}_${emoji}`];
                        return (
                          <button key={emoji} onClick={() => toggleReaction(c.id, emoji)} style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '3px 8px', borderRadius: 16,
                            background: reacted ? t.accentDim : t.toggleBg,
                            border: reacted ? `1px solid ${t.accent}55` : `1px solid ${t.border}`,
                            cursor: 'pointer', fontSize: 12, transition: 'all 0.15s ease',
                            transform: reacted ? 'scale(1.05)' : 'scale(1)',
                          }}>
                            <span>{emoji}</span><span style={{ fontWeight: 700, fontSize: 11, color: reacted ? t.accent : t.textDim }}>{count}</span>
                          </button>
                        );
                      })}
                      <button onClick={() => setEmojiPickerOpen(isPickerOpen ? null : c.id)} style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isPickerOpen ? t.accentDim : t.toggleBg,
                        border: isPickerOpen ? `1px solid ${t.accent}44` : `1px solid ${t.border}`,
                        cursor: 'pointer', fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease',
                      }}>{isPickerOpen ? '✕' : '+'}</button>
                      {/* Reply button */}
                      <button onClick={() => setReplyTo(c)} style={{
                        padding: '3px 8px', borderRadius: 16, background: t.toggleBg, border: `1px solid ${t.border}`,
                        fontSize: 11, cursor: 'pointer', color: t.textDim, fontWeight: 600, marginLeft: 'auto',
                      }}>↩ Répondre</button>
                    </div>
                    {isPickerOpen && (
                      <div style={{
                        display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8, padding: '10px 8px',
                        background: isDark ? 'rgba(20,28,50,0.95)' : 'rgba(255,255,255,0.97)',
                        borderRadius: 14, border: `1px solid ${t.border}`,
                        boxShadow: `0 8px 24px ${t.shadowColor}`, animation: 'slideUp 0.2s ease',
                      }}>
                        {REACTION_EMOJIS.map(emoji => {
                          const already = userReactions[`${c.id}_${emoji}`];
                          return (
                            <button key={emoji} onClick={() => toggleReaction(c.id, emoji)} style={{
                              width: 40, height: 40, borderRadius: 10,
                              background: already ? t.accentDim : 'transparent',
                              border: already ? `1px solid ${t.accent}44` : '1px solid transparent',
                              cursor: 'pointer', fontSize: 22,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease',
                            }}>{emoji}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {(ratedCount > 0 || matchRating > 0) && (
          <div style={{ position: 'fixed', bottom: 68, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 48px)', maxWidth: 432, zIndex: 50 }}>
            <button onClick={submitAllRatings} style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
              background: isDraftMode()
                ? 'linear-gradient(135deg, #f39c12, #f1c40f)'
                : `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
              color: '#0a0e17', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              boxShadow: isDraftMode() ? '0 8px 32px rgba(241,196,15,0.3)' : `0 8px 32px ${t.accent}44`,
              letterSpacing: 0.5,
            }}>
              {isDraftMode()
                ? `📝 Sauvegarder brouillon (${ratedCount} joueur${ratedCount > 1 ? 's' : ''}${matchRating > 0 ? ' + match' : ''})`
                : `🏁 Valider mon verdict (${ratedCount} joueur${ratedCount > 1 ? 's' : ''}${matchRating > 0 ? ' + match' : ''})`
              }
            </button>
            {isDraftMode() && (
              <div style={{ textAlign: 'center', marginTop: 6, fontSize: 10, color: t.textDim }}>
                Verdict validé définitivement au coup de sifflet final
              </div>
            )}
          </div>
        )}
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
      </>
    );
  }

  return null;
}
