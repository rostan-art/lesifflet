'use client';
import { useState, useEffect } from 'react';
import { themes } from '../data/themes';
import { LEAGUES as MOCK_LEAGUES, MOCK_MATCHES, MOCK_COMMENTS, REACTION_EMOJIS, LEADERBOARD, BADGES_INFO, BEST_XI, generatePlayers } from '../data/mockData';
import { LEAGUES, getMatchesByLeague, getMatchLineups } from '../data/footballApi';
import { StarRating, PulsingDot, ThemeToggle, BottomNavBar, PitchView } from '../components/UI';

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const t = isDark ? themes.dark : themes.light;

  const [screen, setScreen] = useState('home');
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedTeamTab, setSelectedTeamTab] = useState('home');
  const [playerRatings, setPlayerRatings] = useState({});
  const [matchRating, setMatchRating] = useState(0);
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState('players');
  const [bottomNav, setBottomNav] = useState('home');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
  const [userReactions, setUserReactions] = useState({});
  const [commentSort, setCommentSort] = useState('hot');
  const [realMatches, setRealMatches] = useState({});
  const [fetchedLeagues, setFetchedLeagues] = useState(new Set());
  const [realLineups, setRealLineups] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [useRealData, setUseRealData] = useState(true);
  const [apiDebug, setApiDebug] = useState(null);

  // Fetch matches only when a league is selected (saves API quota)
  useEffect(() => {
    if (!selectedLeague || !useRealData) return;
    if (fetchedLeagues.has(selectedLeague.id)) return;
    let cancelled = false;
    setLoadingMatches(true);
    setApiDebug(null);
    async function fetchLeagueMatches() {
      try {
        const matches = await getMatchesByLeague(selectedLeague.code);
        if (!cancelled) {
          setRealMatches(prev => ({ ...prev, [selectedLeague.id]: matches }));
          setApiDebug({ success: true, count: matches.length, league: selectedLeague.name });
        }
      } catch (e) {
        console.warn(`Failed to fetch ${selectedLeague.name}:`, e);
        if (!cancelled) {
          setApiDebug({ success: false, error: e.message, league: selectedLeague.name });
        }
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

  // Fetch lineups when a match is selected
  useEffect(() => {
    if (!selectedMatch || !useRealData || !selectedMatch.fixtureId) return;
    let cancelled = false;
    setLoadingLineups(true);
    async function fetchLineups() {
      try {
        const lineups = await getMatchLineups(selectedMatch.fixtureId);
        if (!cancelled) setRealLineups(lineups);
      } catch (e) {
        console.warn('Failed to fetch lineups:', e);
        if (!cancelled) setRealLineups(null);
      } finally {
        if (!cancelled) setLoadingLineups(false);
      }
    }
    fetchLineups();
    return () => { cancelled = true; };
  }, [selectedMatch, useRealData]);

  // Get players for the current match (real or mock)
  function getPlayers() {
    if (useRealData && realLineups) {
      return {
        home: realLineups.home?.starters || [],
        away: realLineups.away?.starters || [],
      };
    }
    return generatePlayers(selectedMatch?.id);
  }

  const [communityRatings] = useState(() => {
    const cr = {};
    Object.values(MOCK_MATCHES).flat().forEach((m) => {
      cr[m.id] = { matchAvg: (Math.random() * 3 + 5).toFixed(1), votes: Math.floor(Math.random() * 2000 + 200) };
    });
    return cr;
  });

  const ratePlayer = (pid, r) => setPlayerRatings(prev => ({ ...prev, [pid]: r }));

  const submitComment = () => {
    if (!newComment.trim()) return;
    const newId = 'c_' + Date.now();
    setComments(prev => [{ id: newId, user: 'Toi', text: newComment, time: "à l'instant", reactions: {} }, ...prev]);
    setNewComment('');
  };

  const toggleReaction = (commentId, emoji) => {
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
  };

  const getTotalReactions = (c) => Object.values(c.reactions || {}).reduce((a, b) => a + b, 0);

  const sortedComments = [...comments].sort((a, b) => {
    if (commentSort === 'hot') return getTotalReactions(b) - getTotalReactions(a);
    return 0;
  });

  const submitAllRatings = () => {
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 2500);
  };

  const goBack = () => {
    if (screen === 'match') { setScreen('league'); setSelectedMatch(null); setActiveTab('players'); setPlayerRatings({}); setMatchRating(0); setRealLineups(null); }
    else if (screen === 'league') { setScreen('home'); setSelectedLeague(null); }
    else if (screen === 'leaderboard' || screen === 'bestxi') { setScreen('home'); }
  };

  const navigateTo = (dest) => {
    setBottomNav(dest);
    if (dest === 'home') { setScreen('home'); setSelectedLeague(null); setSelectedMatch(null); }
    else if (dest === 'leaderboard') setScreen('leaderboard');
    else if (dest === 'bestxi') setScreen('bestxi');
  };

  const baseStyle = {
    fontFamily: "'Outfit', 'DM Sans', sans-serif",
    background: t.gradient, color: t.text,
    minHeight: '100vh', maxWidth: 480, margin: '0 auto',
    position: 'relative', overflow: 'hidden',
    transition: 'background 0.4s ease, color 0.3s ease',
  };

  // ══════════════════════════════════════
  // HOME SCREEN
  // ══════════════════════════════════════
  if (screen === 'home') {
    return (
      <div style={baseStyle}>
        <div style={{ padding: '40px 24px 16px', animation: 'fadeIn 0.6s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{
                fontSize: 38, fontWeight: 900, letterSpacing: -1.5,
                background: `linear-gradient(135deg, ${t.text} 0%, ${t.accent} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>🏟️ LeSifflet</h1>
              <p style={{ color: t.textDim, fontSize: 13, fontWeight: 400, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
                Le verdict des supporters
              </p>
            </div>
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 0', margin: '0 24px 20px',
          background: 'rgba(231,76,60,0.08)', borderRadius: 12, border: '1px solid rgba(231,76,60,0.2)',
        }}>
          <PulsingDot /><span style={{ fontSize: 13, fontWeight: 600, color: t.live }}>
            Note les joueurs, donne ton verdict
          </span>
        </div>
        <div style={{
          margin: '0 24px 20px', padding: '16px 20px',
          background: t.accentDim, borderRadius: 16, border: `1px solid ${t.accent}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, color: t.textDim, marginBottom: 4 }}>Ton classement</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: t.accent }}>#8</span>
              <span style={{ fontSize: 13, color: t.textDim }}>2 450 pts</span>
            </div>
          </div>
          <span style={{ fontSize: 22 }}>🌱</span>
        </div>
        <div style={{ padding: '0 24px 100px' }}>
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
        </div>
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
    );
  }

  // ══════════════════════════════════════
  // LEADERBOARD SCREEN
  // ══════════════════════════════════════
  if (screen === 'leaderboard') {
    return (
      <div style={baseStyle}>
        <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>🏅 Classement</h2>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, padding: '8px 24px 24px' }}>
          {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((u, i) => {
            const heights = [100, 130, 80];
            const medals = [t.silver, t.gold, t.bronze];
            const ranks = ['2', '1', '3'];
            return (
              <div key={u.name} style={{ flex: 1, textAlign: 'center', animation: `slideUp 0.5s ease ${i * 0.12}s both` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{u.badges[0] || '🏅'}</div>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4, color: u.isUser ? t.accent : t.text }}>{u.name}</div>
                <div style={{ fontSize: 11, color: t.textDim, marginBottom: 8 }}>{u.pts.toLocaleString()} pts</div>
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
        <div style={{ padding: '0 24px 20px' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.textDim, marginBottom: 12 }}>Classement complet</h3>
          {LEADERBOARD.map((u, i) => (
            <div key={u.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', marginBottom: 6, borderRadius: 14,
              background: u.isUser ? t.accentDim : t.card,
              border: u.isUser ? `1px solid ${t.accent}44` : `1px solid ${t.border}`,
              animation: `slideUp 0.3s ease ${i * 0.05}s both`,
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900,
                background: u.rank <= 3 ? [t.gold, t.silver, t.bronze][u.rank - 1] + '22' : 'rgba(128,128,128,0.1)',
                color: u.rank <= 3 ? [t.gold, t.silver, t.bronze][u.rank - 1] : t.textDim,
              }}>{u.rank}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: u.isUser ? t.accent : t.text }}>
                  {u.name} {u.isUser && <span style={{ fontSize: 11, fontWeight: 500, color: t.textDim }}>(toi)</span>}
                </div>
                <div style={{ fontSize: 11, color: t.textDim }}>{u.matchesRated} matchs notés</div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>{u.badges.map((b, j) => <span key={j} style={{ fontSize: 16 }}>{b}</span>)}</div>
              <span style={{ fontSize: 14, fontWeight: 800, color: t.accent }}>{u.pts.toLocaleString()}</span>
            </div>
          ))}
        </div>
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
    );
  }

  // ══════════════════════════════════════
  // BEST XI SCREEN
  // ══════════════════════════════════════
  if (screen === 'bestxi') {
    return (
      <div style={baseStyle}>
        <div style={{ padding: '24px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>⭐ Équipe Type</h2>
            <p style={{ fontSize: 12, color: t.textDim, marginTop: 4 }}>{BEST_XI.league} · {BEST_XI.formation}</p>
          </div>
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <PitchView players={BEST_XI.players} t={t} />
        </div>
        <div style={{ padding: '0 24px 100px' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.textDim, marginBottom: 12 }}>Détail des notes</h3>
          {[...BEST_XI.players].sort((a, b) => b.avg - a.avg).map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', marginBottom: 6, borderRadius: 14,
              background: i === 0 ? t.accentDim : t.card,
              border: i === 0 ? `1px solid ${t.accent}33` : `1px solid ${t.border}`,
              animation: `slideUp 0.3s ease ${i * 0.04}s both`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(128,128,128,0.12)', color: t.textDim, letterSpacing: 1, minWidth: 30, textAlign: 'center' }}>{p.pos}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: t.textDim }}>{p.club} · {p.votes.toLocaleString()} votes</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: p.avg >= 8.5 ? t.accent : p.avg >= 7 ? '#f1c40f' : t.text }}>{p.avg}</div>
            </div>
          ))}
        </div>
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
    );
  }

  // ══════════════════════════════════════
  // LEAGUE SCREEN
  // ══════════════════════════════════════
  if (screen === 'league') {
    const matches = realMatches[selectedLeague.id] || [];
    const isLoading = loadingMatches && matches.length === 0;
    return (
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
        <div style={{ padding: '0 24px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚽</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.textDim }}>Chargement des matchs...</div>
            </div>
          )}
          {!isLoading && matches.length === 0 && (
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
          {/* Debug info — à retirer plus tard */}
          {apiDebug && (
            <div style={{
              padding: '12px 16px', marginTop: 10, borderRadius: 12,
              background: apiDebug.success ? 'rgba(0,230,118,0.1)' : 'rgba(231,76,60,0.1)',
              border: `1px solid ${apiDebug.success ? 'rgba(0,230,118,0.3)' : 'rgba(231,76,60,0.3)'}`,
              fontSize: 11, color: t.textDim, fontFamily: 'monospace',
            }}>
              <div>🔍 Debug: {apiDebug.league} (Code: {selectedLeague?.code})</div>
              <div>{apiDebug.success ? `✅ ${apiDebug.count} matchs trouvés` : `❌ ${apiDebug.error}`}</div>
              <div>📡 Source: football-data.org | Fenêtre: ±14 jours</div>
            </div>
          )}
          {matches.map((match, i) => (
            <div key={match.id}
              onClick={() => { setSelectedMatch(match); setScreen('match'); setSelectedTeamTab('home'); setBottomNav('home'); }}
              style={{
                background: t.card, borderRadius: 18, padding: '18px 22px',
                cursor: 'pointer', transition: 'all 0.2s ease',
                border: match.status === 'live' ? '1px solid rgba(231,76,60,0.3)' : `1px solid ${t.border}`,
                animation: `slideUp 0.4s ease ${i * 0.08}s both`,
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
                <span style={{ fontSize: 11, color: t.textDim }}>{match.date}</span>
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
              {communityRatings[match.id] && (
                <div style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                  marginTop: 14, paddingTop: 10, borderTop: `1px solid ${t.border}`,
                }}>
                  <span style={{ fontSize: 11, color: t.textDim }}>Note communauté</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: t.accent }}>{communityRatings[match.id].matchAvg}</span>
                  <span style={{ fontSize: 10, color: t.textDim }}>/ 10 · {communityRatings[match.id].votes} votes</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
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
      <div style={baseStyle}>
        {showConfirmation && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Coup de sifflet final !</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>Ton verdict a été enregistré</div>
              <div style={{ color: '#00e676', fontSize: 13, marginTop: 8 }}>+{ratedCount * 10 + (matchRating > 0 ? 25 : 0)} pts gagnés 🎉</div>
            </div>
          </div>
        )}
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
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} t={t} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{selectedMatch.home}</span>
            <span style={{ fontSize: 28, fontWeight: 900, padding: '3px 14px', borderRadius: 10, background: t.toggleBg }}>{selectedMatch.score}</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{selectedMatch.away}</span>
          </div>
        </div>
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
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Compositions pas encore disponibles</div>
                  <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.5 }}>
                    {selectedMatch.status === 'upcoming'
                      ? 'Les compositions seront disponibles environ 1h avant le coup d\'envoi.'
                      : 'Les données de ce match ne sont pas disponibles pour le moment.'}
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
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{player.name}</span>
                    </div>
                    {playerRatings[player.id] && <span style={{ fontSize: 18, fontWeight: 900, color: t.accent }}>{playerRatings[player.id]}</span>}
                  </div>
                  <StarRating value={playerRatings[player.id] || 0} onChange={r => ratePlayer(player.id, r)} size={22} />
                </div>
              ))}
            </>
          )}

          {/* MATCH TAB */}
          {activeTab === 'match' && (
            <div style={{ animation: 'slideUp 0.3s ease' }}>
              <div style={{ background: t.card, borderRadius: 18, padding: 22, border: `1px solid ${t.border}`, textAlign: 'center', boxShadow: `0 2px 10px ${t.shadowColor}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>Note ce match</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <StarRating value={matchRating} onChange={setMatchRating} size={30} />
                </div>
                {matchRating > 0 && <div style={{ fontSize: 44, fontWeight: 900, color: t.accent }}>{matchRating}<span style={{ fontSize: 18, color: t.textDim }}>/10</span></div>}
              </div>
              <div style={{ background: t.card, borderRadius: 18, padding: 22, marginTop: 10, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Moyenne communauté</div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: t.accent }}>{communityRatings[selectedMatch.id]?.matchAvg || '—'}</div>
                    <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Note</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 900 }}>{communityRatings[selectedMatch.id]?.votes || 0}</div>
                    <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>Votes</div>
                  </div>
                </div>
              </div>
              <div style={{ background: t.card, borderRadius: 18, padding: 22, marginTop: 10, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 12, color: t.textDim, marginBottom: 8 }}>{ratedCount} / {totalPlayers} joueurs notés</div>
                <div style={{ background: 'rgba(128,128,128,0.12)', borderRadius: 10, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${(ratedCount / totalPlayers) * 100}%`, height: '100%', borderRadius: 10, background: `linear-gradient(90deg, ${t.accent}, #00b0ff)`, transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: 11, color: t.accent, marginTop: 6 }}>+{ratedCount * 10 + (matchRating > 0 ? 25 : 0)} pts à valider</div>
              </div>
            </div>
          )}

          {/* COMMENTS TAB */}
          {activeTab === 'comments' && (
            <div style={{ animation: 'slideUp 0.3s ease' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, background: t.card, borderRadius: 14, padding: 8, border: `1px solid ${t.border}` }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitComment()}
                  placeholder="Ton commentaire..."
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
              {sortedComments.map((c, i) => {
                const isPickerOpen = emojiPickerOpen === c.id;
                return (
                  <div key={c.id} style={{
                    background: t.card, borderRadius: 14, padding: '12px 14px', marginBottom: 8,
                    border: `1px solid ${t.border}`, animation: `slideUp 0.3s ease ${i * 0.03}s both`, position: 'relative',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.user === 'Toi' ? t.accent : t.text }}>{c.user}</span>
                      <span style={{ fontSize: 10, color: t.textDim }}>{c.time}</span>
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
              background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
              color: '#0a0e17', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              boxShadow: `0 8px 32px ${t.accent}44`, letterSpacing: 0.5,
            }}>
              🏁 Valider ({ratedCount} joueur{ratedCount > 1 ? 's' : ''}{matchRating > 0 ? ' + match' : ''}) · +{ratedCount * 10 + (matchRating > 0 ? 25 : 0)} pts
            </button>
          </div>
        )}
        <BottomNavBar isDark={isDark} t={t} bottomNav={bottomNav} onNavigate={navigateTo} />
      </div>
    );
  }

  return null;
}
