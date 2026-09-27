'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListMusic, Vote, Download, NotebookPen } from 'lucide-react';

export const sections = [
  { href: '/votazione', label: 'Votazione brani', short: 'Voti', icon: Vote },
  { href: '/scaletta', label: 'Scaletta', short: 'Scaletta', icon: ListMusic },
  {
    href: '/download-mp3',
    label: 'Download MP3',
    short: 'MP3',
    icon: Download,
  },
  { href: '/note', label: 'Note', short: 'Note', icon: NotebookPen },
];

export function WorkspaceNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigazione principale"
      className="border-b border-[#e5eaf2] bg-white"
    >
      <div className="mx-auto grid max-w-[680px] grid-cols-5 gap-1 px-3 py-2">
        {[
          { href: '/', label: 'Home', short: 'Home', icon: Home },
          ...sections,
        ].map(({ href, label, short, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={label}
            aria-label={label}
            aria-current={pathname === href ? 'page' : undefined}
            className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-xs transition hover:bg-[#f3f5f7] ${pathname === href ? 'bg-[#edf1f5] font-semibold text-[#171b26]' : 'text-[#617086]'}`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
            <span>{short}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
