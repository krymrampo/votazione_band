'use client';

import React from 'react';
import { MemberName } from '@/types';
import { BAND_MEMBERS } from '@/lib/constants';
import { ChevronDown, Cloud, CloudOff, Music2 } from 'lucide-react';

interface HeaderProps {
  currentMember: MemberName | null;
  onOpenMemberSelect: () => void;
  isCloud: boolean;
  totalSongs: number;
  userVotedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMember,
  onOpenMemberSelect,
  isCloud,
  totalSongs,
  userVotedCount,
}) => {
  const memberInfo = BAND_MEMBERS.find((m) => m.name === currentMember);

  return (
    <header className="sticky top-0 z-30 bg-white/95 px-4 pt-5 backdrop-blur-md">
      <div className="mx-auto flex max-w-[520px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e5eaf2] bg-[#f3f6fb] text-[#1a2435] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
            <Music2 className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[21px] font-semibold leading-6 tracking-[-0.035em] text-[#171b26]">Repertorio</h1>
              <span
                title={isCloud ? 'Connesso a Supabase Cloud' : 'Modalità Locale'}
                className="inline-flex items-center"
              >
                {isCloud ? (
                  <Cloud className="h-3.5 w-3.5 text-[#4b9b68]" />
                ) : (
                  <CloudOff className="h-3.5 w-3.5 text-[#9aa4b4]" />
                )}
              </span>
            </div>

            <p className="truncate text-[13px] leading-5 text-[#718099] tabular-nums">
              {currentMember ? (
                <>
                  {userVotedCount}/{totalSongs} brani votati
                </>
              ) : (
                'Seleziona il tuo nome'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenMemberSelect}
          className={`inline-flex h-11 items-center gap-2 rounded-full border px-2.5 pr-3 text-[13px] font-medium transition active:scale-[0.98] ${
            memberInfo
              ? `${memberInfo.bgLight} border-[#e1e6ee] text-[#263044]`
              : 'border-[#e1e6ee] bg-[#f7f9fc] text-[#263044]'
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-semibold uppercase text-[#30394a] shadow-sm">
            {currentMember ? currentMember.substring(0, 2) : '?'}
          </span>
          <span className="truncate">{currentMember || 'Chi sei?'}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-75" />
        </button>
      </div>
      <div className="mx-auto mt-4 h-px max-w-[520px] bg-[#eef1f6]" />
    </header>
  );
};
