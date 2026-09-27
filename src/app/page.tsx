'use client';

import Link from 'next/link';
import { ArrowUpRight, Music2 } from 'lucide-react';
import { sections } from '@/components/WorkspaceNav';
import { StorageStatus } from '@/components/WorkspaceUI';

export default function Home() {
  return (
    <main className="workspace">
      <header className="mb-8 mt-4">
        <Music2 className="mb-5 h-9 w-9 text-[#32775a]" strokeWidth={1.5} />
        <h1 className="text-3xl font-semibold leading-tight">
          Repertorio Band
        </h1>
        <div className="mt-3">
          <StorageStatus />
        </div>
      </header>
      <div className="divide-y divide-[#e5eaf2] border-y border-[#e5eaf2]">
        {sections.map(({ href, label, icon: Icon }, index) => (
          <Link
            href={href}
            key={href}
            className="group flex min-h-[104px] items-center gap-4 py-5 transition hover:bg-[#fafbfc]"
          >
            <span className="text-xs tabular-nums text-[#718099]">
              0{index + 1}
            </span>
            <Icon
              className={`h-6 w-6 shrink-0 ${['text-[#32775a]', 'text-[#9a721b]', 'text-[#396bb0]', 'text-[#986075]'][index]}`}
              strokeWidth={1.6}
            />
            <h2 className="min-w-0 flex-1 break-words text-lg font-medium">
              {label}
            </h2>
            <ArrowUpRight className="mr-2 h-5 w-5 shrink-0 text-[#718099] transition group-hover:text-[#171b26]" />
          </Link>
        ))}
      </div>
    </main>
  );
}
