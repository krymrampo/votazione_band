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
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="min-h-[100dvh] bg-white text-[#171b26] antialiased flex flex-col selection:bg-[#dce8fc] selection:text-[#171b26]">
        {children}
      </body>
    </html>
  );
}
