'use client';
import { useState } from 'react';
import { auth } from '../data/firebase';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!displayName.trim()) { setError('Choisis un pseudo !'); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
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
    }} onClick={onClose}>
      <div style={{
        background: t.gradient, borderRadius: 24, padding: 28, width: '100%', maxWidth: 380,
        border: `1px solid ${t.border}`, boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏟️</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: t.text }}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p style={{ fontSize: 13, color: t.textDim, marginTop: 4 }}>
            {mode === 'login' ? 'Content de te revoir, Siffleur !' : 'Rejoins la communauté LeSifflet'}
          </p>
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: '100%', padding: '12px 0', borderRadius: 12, border: `1px solid ${t.border}`,
          background: t.card, color: t.text, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>G</span> Continuer avec Google
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span style={{ fontSize: 12, color: t.textDim }}>ou</span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>

        {/* Form */}
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

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
            color: '#e74c3c', fontSize: 12,
          }}>{error}</div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
          background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
          color: '#0a0e17', fontSize: 15, fontWeight: 800, cursor: 'pointer',
          marginTop: 16, opacity: loading ? 0.6 : 1,
        }}>
          {loading ? '⏳ Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>

        {/* Switch mode */}
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
