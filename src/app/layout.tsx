import type { Metadata, Viewport } from 'next';
import './globals.css';
import { WorkspaceNav } from '@/components/WorkspaceNav';

export const metadata: Metadata = {
  title: 'Repertorio Band',
  description: 'Brani, scaletta e appunti della band.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Voti Band',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
        <WorkspaceNav />
        {children}
      </body>
    </html>
  );
}
