'use client';
import { useState } from 'react';
import { auth, db } from '../data/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { POPULAR_CLUBS } from '../data/clubs';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

export function AuthModal({ isOpen, onClose, t }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [step, setStep] = useState(1); // signup step: 1 = account, 2 = club
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [favoriteClub, setFavoriteClub] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const saveClubToFirestore = async (userId, clubId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, { favoriteClub: clubId });
      } else {
        await setDoc(userRef, {
          favoriteClub: clubId,
          displayName: displayName.trim(),
          points: 0,
          matchesRated: 0,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Failed to save club:', e);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (step === 1) {
          if (!displayName.trim()) { setError('Choisis un pseudo !'); setLoading(false); return; }
          if (password.length < 6) { setError('Mot de passe : 6 caractères min'); setLoading(false); return; }
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(cred.user, { displayName: displayName.trim() });
          // Go to step 2 (club selection)
          setStep(2);
          setLoading(false);
          return;
        }
        if (step === 2) {
          // Save club and close
          if (auth.currentUser && favoriteClub) {
            await saveClubToFirestore(auth.currentUser.uid, favoriteClub);
          }
          onClose();
          // Reset state
          setStep(1);
          setEmail(''); setPassword(''); setDisplayName(''); setFavoriteClub(null);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      }
    } catch (e) {
      const messages = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé',
        'auth/weak-password': 'Mot de passe trop faible (6 caractères min)',
        'auth/invalid-email': 'Email invalide',
        'auth/invalid-credential': 'Email ou mot de passe incorrect',
        'auth/user-not-found': 'Aucun compte avec cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
      };
      setError(messages[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  };

  const skipClub = async () => {
    onClose();
    setStep(1);
    setEmail(''); setPassword(''); setDisplayName(''); setFavoriteClub(null);
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (e) {
      setError('Erreur de connexion Google');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `1px solid ${t.border}`, background: t.card,
    color: t.text, fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(8px)',
    }} onClick={mode === 'signup' && step === 2 ? null : onClose}>
      <div style={{
        background: t.gradient, borderRadius: 24, padding: 28, width: '100%', maxWidth: 400,
        maxHeight: '85vh', overflowY: 'auto',
        border: `1px solid ${t.border}`, boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
      }} onClick={e => e.stopPropagation()}>

        {/* ─── STEP 2: CLUB SELECTION ─── */}
        {mode === 'signup' && step === 2 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚽</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text }}>Ton club favori ?</h2>
              <p style={{ fontSize: 12, color: t.textDim, marginTop: 4 }}>
                Il sera affiché sur ton profil et à côté de ton nom dans le chat
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {POPULAR_CLUBS.filter(c => c.id !== 'none').map(club => (
                <button key={club.id} onClick={() => setFavoriteClub(club.id)} style={{
                  padding: '10px 8px', borderRadius: 12,
                  background: favoriteClub === club.id ? t.accentDim : t.card,
                  border: favoriteClub === club.id ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}>
                  {club.crest ? (
                    <img src={club.crest} alt={club.name} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ fontSize: 20 }}>⚽</div>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.text, textAlign: 'center' }}>{club.name}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setFavoriteClub('none')} style={{
              width: '100%', padding: '10px 0', borderRadius: 10,
              background: favoriteClub === 'none' ? t.accentDim : 'transparent',
              border: `1px dashed ${t.border}`,
              color: t.textDim, fontSize: 12, cursor: 'pointer', marginBottom: 12,
            }}>Pas de club favori</button>

            {error && (
              <div style={{
                marginBottom: 10, padding: '8px 12px', borderRadius: 8,
                background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
                color: '#e74c3c', fontSize: 12,
              }}>{error}</div>
            )}

            <button onClick={handleSubmit} disabled={loading || !favoriteClub} style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: favoriteClub ? `linear-gradient(135deg, ${t.accent}, #00b0ff)` : t.toggleBg,
              color: favoriteClub ? '#0a0e17' : t.textDim,
              fontSize: 15, fontWeight: 800, cursor: favoriteClub ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.6 : 1,
            }}>{loading ? '⏳ Chargement...' : 'Terminer'}</button>

            <button onClick={skipClub} style={{
              width: '100%', padding: '10px 0', borderRadius: 12, border: 'none',
              background: 'transparent', color: t.textDim,
              fontSize: 12, cursor: 'pointer', marginTop: 8,
            }}>Passer cette étape</button>
          </>
        ) : (
          /* ─── STEP 1: LOGIN / SIGNUP FORM ─── */
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏟️</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text }}>
                {mode === 'login' ? 'Connexion' : 'Créer un compte'}
              </h2>
              <p style={{ fontSize: 13, color: t.textDim, marginTop: 4 }}>
                {mode === 'login' ? 'Content de te revoir, Siffleur !' : 'Rejoins la communauté LeSifflet'}
              </p>
            </div>

            <button onClick={handleGoogle} disabled={loading} style={{
              width: '100%', padding: '12px 0', borderRadius: 12, border: `1px solid ${t.border}`,
              background: t.card, color: t.text, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>G</span> Continuer avec Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: t.border }} />
              <span style={{ fontSize: 12, color: t.textDim }}>ou</span>
              <div style={{ flex: 1, height: 1, background: t.border }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mode === 'signup' && (
                <input
                  type="text" placeholder="Ton pseudo (ex: LeFan_75)"
                  value={displayName} onChange={e => setDisplayName(e.target.value)}
                  style={inputStyle}
                />
              )}
              <input
                type="email" placeholder="Email"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password" placeholder="Mot de passe"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 8,
                background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
                color: '#e74c3c', fontSize: 12,
              }}>{error}</div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
              color: '#0a0e17', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              marginTop: 16, opacity: loading ? 0.6 : 1,
            }}>
              {loading ? '⏳ Chargement...' : mode === 'login' ? 'Se connecter' : 'Continuer'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 13, color: t.textDim }}>
                {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
              </span>
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} style={{
                background: 'none', border: 'none', color: t.accent, fontSize: 13,
                fontWeight: 700, cursor: 'pointer', textDecoration: 'underline',
              }}>
                {mode === 'login' ? "S'inscrire" : 'Se connecter'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function UserBadge({ user, onLogout, onLogin, t, userPoints }) {
  if (!user) {
    return (
      <button onClick={onLogin} style={{
        background: t.accentDim, border: `1px solid ${t.accent}33`,
        borderRadius: 14, padding: '10px 16px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>👤</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>Se connecter</span>
      </button>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 14,
      background: t.accentDim, border: `1px solid ${t.accent}33`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color: '#fff',
      }}>
        {(user.displayName || user.email || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{user.displayName || 'Siffleur'}</div>
        <div style={{ fontSize: 10, color: t.textDim }}>{userPoints || 0} pts</div>
      </div>
      <button onClick={onLogout} style={{
        background: 'none', border: 'none', color: t.textDim,
        fontSize: 11, cursor: 'pointer',
      }}>Déco</button>
    </div>
  );
}
