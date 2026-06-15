'use client';
import { useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════
// CONFETTI — burst of falling confetti for celebratory moments
// ═══════════════════════════════════════════════════════════════
export function Confetti({ duration = 3000, onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Football-themed festive colors: gold, green, white, blue, red
    const colors = ['#f1c40f', '#00e676', '#ffffff', '#00b0ff', '#e74c3c', '#ff6b35'];
    const W = canvas.width;
    const H = canvas.height;

    // Create particles bursting from top
    const particles = [];
    const count = Math.min(160, Math.floor(W / 8));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * -H * 0.5,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: 2 + Math.random() * 4,
        speedX: (Math.random() - 0.5) * 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.05,
      });
    }

    let startTime = Date.now();
    let animId;

    const draw = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, W, H);

      // Fade out near the end
      const fadeStart = duration - 800;
      const globalAlpha = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / 800) : 1;

      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.wobble) * 1.5;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        // Recycle particles that fall off screen (during active phase)
        if (p.y > H + 20 && elapsed < fadeStart) {
          p.y = -20;
          p.x = Math.random() * W;
        }

        ctx.save();
        ctx.globalAlpha = globalAlpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (elapsed < duration) {
        animId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
        if (onDone) onDone();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [duration, onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: 9999,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// WORLD CUP BANNER — festive animated header with trophy + shine
// ═══════════════════════════════════════════════════════════════
export function WorldCupBanner({ t }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      margin: '0 24px 18px', padding: '20px 22px', borderRadius: 20,
      background: 'linear-gradient(135deg, #1a1205 0%, #3d2c0a 50%, #1a1205 100%)',
      border: '1px solid rgba(241,196,15,0.4)',
    }}>
      {/* Animated shine sweep */}
      <div style={{
        position: 'absolute', top: 0, left: '-60%', width: '50%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(241,196,15,0.25), transparent)',
        transform: 'skewX(-20deg)',
        animation: 'shine 3.5s ease-in-out infinite',
      }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          fontSize: 44, animation: 'trophyBounce 2s ease-in-out infinite',
          filter: 'drop-shadow(0 2px 8px rgba(241,196,15,0.5))',
        }}>🏆</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
            color: '#f1c40f', marginBottom: 4,
          }}>
            🌍 Coupe du Monde 2026
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
            Le monde entier note les matchs
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            48 équipes · Donne ton verdict sur chaque rencontre
          </div>
        </div>
      </div>
    </div>
  );
}
