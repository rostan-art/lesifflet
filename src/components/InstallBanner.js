'use client';
import { useState, useEffect } from 'react';

export function InstallBanner({ t }) {
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState('unknown'); // 'ios', 'android', 'desktop'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return;

    // Check if already dismissed this session
    try {
      if (sessionStorage.getItem('installBannerDismissed')) return;
    } catch (e) {}

    // Detect platform
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios');
      setShowBanner(true);
    } else if (/Android/.test(ua)) {
      setPlatform('android');
      // Wait for beforeinstallprompt
      setShowBanner(true);
    } else {
      setPlatform('desktop');
      // Don't show on desktop
    }

    // Listen for the native install prompt (Android/Chrome)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    try {
      sessionStorage.setItem('installBannerDismissed', 'true');
    } catch (e) {}
  };

  if (!showBanner || dismissed) return null;

  return (
    <div style={{
      margin: '0 24px 16px',
      padding: '14px 16px',
      borderRadius: 16,
      background: `linear-gradient(135deg, ${t.accent}15, ${t.accent}08)`,
      border: `1px solid ${t.accent}33`,
      animation: 'slideUp 0.4s ease',
      position: 'relative',
    }}>
      {/* Close button */}
      <button onClick={dismiss} style={{
        position: 'absolute', top: 8, right: 10,
        background: 'none', border: 'none', color: t.textDim,
        fontSize: 16, cursor: 'pointer', padding: 4,
      }}>✕</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>📲</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Installe l'app !</span>
      </div>

      {platform === 'ios' && (
        <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.6 }}>
          Clique sur <span style={{ 
            display: 'inline-flex', alignItems: 'center', 
            background: t.toggleBg, padding: '1px 6px', borderRadius: 4,
            fontWeight: 700, color: t.text, fontSize: 11,
          }}>↑ Partager</span> en bas de Safari, puis <span style={{
            display: 'inline-flex', alignItems: 'center',
            background: t.toggleBg, padding: '1px 6px', borderRadius: 4,
            fontWeight: 700, color: t.text, fontSize: 11,
          }}>☐ Sur l'écran d'accueil</span>
        </div>
      )}

      {platform === 'android' && !deferredPrompt && (
        <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.6 }}>
          Clique sur <span style={{
            display: 'inline-flex', alignItems: 'center',
            background: t.toggleBg, padding: '1px 6px', borderRadius: 4,
            fontWeight: 700, color: t.text, fontSize: 11,
          }}>⋮ Menu</span> de Chrome, puis <span style={{
            display: 'inline-flex', alignItems: 'center',
            background: t.toggleBg, padding: '1px 6px', borderRadius: 4,
            fontWeight: 700, color: t.text, fontSize: 11,
          }}>Ajouter à l'écran d'accueil</span>
        </div>
      )}

      {platform === 'android' && deferredPrompt && (
        <div>
          <div style={{ fontSize: 12, color: t.textDim, marginBottom: 10 }}>
            Ajoute LeSifflet sur ton écran d'accueil pour y accéder en un clic !
          </div>
          <button onClick={handleInstallClick} style={{
            background: `linear-gradient(135deg, ${t.accent}, #00b0ff)`,
            border: 'none', borderRadius: 10, padding: '10px 20px',
            color: '#0a0e17', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            width: '100%',
          }}>
            📲 Installer LeSifflet
          </button>
        </div>
      )}
    </div>
  );
}
