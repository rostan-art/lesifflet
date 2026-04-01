import '../styles/globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'LeSifflet — Le verdict des supporters',
  description: 'Note les joueurs, commente les matchs, compare ton verdict avec la communauté foot.',
  keywords: 'football, notation, joueurs, ligue 1, premier league, champions league, fans, communauté',
  manifest: '/manifest.json',
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LeSifflet',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          }
        `}</Script>
      </body>
    </html>
  );
}
