import '../styles/globals.css';

export const metadata = {
  title: 'LeSifflet — Le verdict des supporters',
  description: 'Note les joueurs, commente les matchs, compare ton verdict avec la communauté foot.',
  keywords: 'football, notation, joueurs, ligue 1, premier league, champions league, fans, communauté',
  openGraph: {
    title: 'LeSifflet — Le verdict des supporters',
    description: 'Note les joueurs, commente les matchs, compare ton verdict avec des milliers de fans.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeSifflet — Le verdict des supporters',
    description: 'Note les joueurs, commente les matchs, compare ton verdict avec la communauté.',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#0a0e17',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
