'use client';
import { useState } from 'react';

export function StarRating({ value, onChange, size = 28, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2, cursor: readonly ? 'default' : 'pointer' }}>
      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
        <div key={n}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange(n)}
          style={{
            width: size, height: size, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.48, fontWeight: 800,
            background: n <= (hover || value)
              ? n <= 3 ? '#e74c3c' : n <= 5 ? '#f39c12' : n <= 7 ? '#f1c40f' : '#2ecc71'
              : 'rgba(128,128,128,0.15)',
            color: n <= (hover || value) ? '#fff' : 'rgba(128,128,128,0.4)',
            transition: 'all 0.15s ease',
            transform: n <= (hover || value) ? 'scale(1.1)' : 'scale(1)',
            border: n <= (hover || value) ? 'none' : '1px solid rgba(128,128,128,0.15)',
            userSelect: 'none',
          }}
        >{n}</div>
      ))}
    </div>
  );
}

export function PulsingDot() {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#e74c3c', animation: 'pulse 1.5s infinite', marginRight: 6 }} />;
}

export function ThemeToggle({ isDark, onToggle, t }) {
  return (
    <button onClick={onToggle} style={{
      background: t.toggleBg, border: `1px solid ${t.border}`, borderRadius: 24,
      padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8,
      cursor: 'pointer', transition: 'all 0.3s ease',
    }}>
      <span style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: t.textDim, letterSpacing: 0.5 }}>
        {isDark ? 'Nuit' : 'Jour'}
      </span>
    </button>
  );
}

export function BottomNavBar({ isDark, t, bottomNav, onNavigate }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: isDark ? 'rgba(10,14,23,0.95)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${t.border}`,
      display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px',
      zIndex: 90,
    }}>
      {[
        { id: 'home', icon: '🏟️', label: 'Matchs' },
        { id: 'bestxi', icon: '⭐', label: 'XI Type' },
        { id: 'leaderboard', icon: '🏅', label: 'Classement' },
      ].map(nav => (
        <button key={nav.id} onClick={() => onNavigate(nav.id)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          opacity: bottomNav === nav.id ? 1 : 0.4,
          transition: 'all 0.2s ease',
        }}>
          <span style={{ fontSize: 22 }}>{nav.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            color: bottomNav === nav.id ? t.accent : t.textDim,
          }}>{nav.label}</span>
        </button>
      ))}
    </div>
  );
}

export function PitchView({ players, t }) {
  const positions = [
    { x: 50, y: 90 },
    { x: 18, y: 70 }, { x: 40, y: 72 }, { x: 60, y: 72 }, { x: 82, y: 70 },
    { x: 25, y: 48 }, { x: 50, y: 44 }, { x: 75, y: 48 },
    { x: 20, y: 22 }, { x: 50, y: 18 }, { x: 80, y: 22 },
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', paddingBottom: '130%',
      background: `linear-gradient(180deg, ${t.fieldGreen} 0%, ${t.fieldGreen}dd 50%, ${t.fieldGreen} 100%)`,
      borderRadius: 20, overflow: 'hidden',
    }}>
      <svg viewBox="0 0 100 130" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <rect x="2" y="2" width="96" height="126" rx="2" fill="none" stroke={t.fieldLine} strokeWidth="0.5" />
        <line x1="2" y1="65" x2="98" y2="65" stroke={t.fieldLine} strokeWidth="0.4" />
        <circle cx="50" cy="65" r="12" fill="none" stroke={t.fieldLine} strokeWidth="0.4" />
        <circle cx="50" cy="65" r="1" fill={t.fieldLine} />
        <rect x="22" y="2" width="56" height="18" fill="none" stroke={t.fieldLine} strokeWidth="0.4" />
        <rect x="32" y="2" width="36" height="8" fill="none" stroke={t.fieldLine} strokeWidth="0.3" />
        <rect x="22" y="110" width="56" height="18" fill="none" stroke={t.fieldLine} strokeWidth="0.4" />
        <rect x="32" y="120" width="36" height="8" fill="none" stroke={t.fieldLine} strokeWidth="0.3" />
      </svg>
      {players.map((p, i) => {
        const pos = positions[i];
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${pos.x}%`, top: `${pos.y / 130 * 100}%`,
            transform: 'translate(-50%, -50%)',
            textAlign: 'center', zIndex: 2,
            animation: `slideUp 0.4s ease ${i * 0.06}s both`,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', margin: '0 auto 4px',
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent}aa)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, color: '#fff',
              boxShadow: `0 4px 12px ${t.shadowColor}`,
              border: '2px solid rgba(255,255,255,0.3)',
            }}>{p.avg}</div>
            <div style={{
              fontSize: 9, fontWeight: 700, color: '#fff',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              whiteSpace: 'nowrap', maxWidth: 80,
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{p.name}</div>
            <div style={{
              fontSize: 7, color: 'rgba(255,255,255,0.7)',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}>{p.club}</div>
          </div>
        );
      })}
    </div>
  );
}
