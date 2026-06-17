// ═══════════════════════════════════════════════════════════════
// PALETTE LESIFFLET — "Tribune" — direction éditoriale sport chaleureuse
// ═══════════════════════════════════════════════════════════════
// Fond crème "papier" (esprit magazine sportif premium) au lieu du
// dark-tech générique. Vert pelouse vif, corail pour le live, doré pour
// les récompenses. Mode nuit "stade nocturne" chaud (pas bleu froid).

export const themes = {
  // ── MODE JOUR (par défaut) — crème éditorial chaleureux ──
  light: {
    bg: "#FBF6EC",
    card: "#FFFFFF",
    cardHover: "#FCF9F1",
    accent: "#0CA15E",              // vert pelouse vif
    accentDim: "rgba(12,161,94,0.12)",
    live: "#F0412E",               // corail / carton rouge
    text: "#1A2B20",               // encre vert-sombre chaude
    textDim: "rgba(26,43,32,0.55)",
    border: "rgba(26,43,32,0.10)",
    gradient: "linear-gradient(165deg, #FBF6EC 0%, #F3E9D6 100%)",
    inputBg: "#F4EEE0",
    gold: "#E8A317",
    silver: "#9a9a9a",
    bronze: "#b06a30",
    fieldGreen: "#0CA15E",
    fieldLine: "rgba(255,255,255,0.5)",
    toggleBg: "rgba(26,43,32,0.06)",
    toggleActive: "#0CA15E",
    shadowColor: "rgba(120,90,30,0.10)",   // ombre chaude
    btnText: "#ffffff",
    heroGradient: "linear-gradient(135deg, #0CA15E 0%, #08857C 60%, #0E6E9E 100%)",
    isDark: false,
  },

  // ── MODE NUIT — "stade nocturne" chaud (pas bleu froid) ──
  dark: {
    bg: "#14110C",                 // presque noir chaud (brun-noir)
    card: "#1F1B14",
    cardHover: "#2A2418",
    accent: "#1FD17E",             // vert vif qui claque sur le sombre chaud
    accentDim: "rgba(31,209,126,0.15)",
    live: "#FF5A45",
    text: "#F5EFE2",               // blanc cassé chaud
    textDim: "rgba(245,239,226,0.55)",
    border: "rgba(245,239,226,0.08)",
    gradient: "linear-gradient(165deg, #14110C 0%, #1C2417 100%)",
    inputBg: "transparent",
    gold: "#FFC53D",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
    fieldGreen: "#1a472a",
    fieldLine: "rgba(255,255,255,0.25)",
    toggleBg: "rgba(245,239,226,0.08)",
    toggleActive: "#1FD17E",
    shadowColor: "rgba(0,0,0,0.35)",
    btnText: "#14110C",
    heroGradient: "linear-gradient(135deg, #1FD17E 0%, #0FA89A 60%, #1488C2 100%)",
    isDark: true,
  },
};
