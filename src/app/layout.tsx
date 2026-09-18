import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Votazione Repertorio Band',
  description: 'App di votazione brani per la scelta del repertorio musicale del gruppo.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Voti Band',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
