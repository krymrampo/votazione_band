'use client';

import React, { useState } from 'react';
import { MemberName, TabType } from '@/types';
import { BAND_MEMBERS } from '@/lib/constants';
import { CheckCircle2, ChevronDown, ListMusic, Search, SlidersHorizontal, Users, X } from 'lucide-react';
import { MemberSortOption, SortOption } from './SearchBar';

interface TabNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unvotedCount: number;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  memberSortOption: MemberSortOption;
  onMemberSortChange: (sort: MemberSortOption) => void;
  viewedMember: MemberName | null;
  viewedMemberVoteCount: number;
  onOpenViewedMemberSelect: () => void;
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onChangeTab,
  unvotedCount,
  totalCount,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  memberSortOption,
  onMemberSortChange,
  viewedMember,
  viewedMemberVoteCount,
  onOpenViewedMemberSelect,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(searchQuery));
  const viewedMemberInfo = BAND_MEMBERS.find((member) => member.name === viewedMember);
  const activeClass = 'bg-[#192331] text-white shadow-[0_2px_6px_rgba(20,31,48,0.2)]';
  const inactiveClass = 'text-[#52617a] hover:bg-white hover:text-[#202a3a]';

  return (
    <div className="sticky top-[92px] z-20 bg-white px-4 pb-3 pt-1">
      <div className="mx-auto max-w-[520px] rounded-[18px] border border-[#dfe5ee] bg-[#f7f9fc] p-1 shadow-[0_3px_10px_rgba(39,52,74,0.05)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeTab('all')}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-[14px] px-1 text-[12px] font-medium transition active:scale-[0.98] ${activeTab === 'all' ? activeClass : inactiveClass}`}
          >
            <ListMusic className="h-4 w-4 max-[360px]:hidden" strokeWidth={1.8} />
            <span className="whitespace-nowrap">Tutti</span>
            <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] tabular-nums max-[390px]:hidden ${activeTab === 'all' ? 'bg-white text-[#182231]' : 'bg-[#e8edf5] text-[#4e5d73]'}`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => onChangeTab('unvoted')}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-[14px] px-1 text-[12px] font-medium transition active:scale-[0.98] ${activeTab === 'unvoted' ? activeClass : inactiveClass}`}
          >
            <CheckCircle2 className="h-4 w-4 max-[360px]:hidden" strokeWidth={1.8} />
            <span className="whitespace-nowrap">Da votare</span>
            <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] tabular-nums max-[390px]:hidden ${activeTab === 'unvoted' ? 'bg-white text-[#182231]' : 'bg-[#e8edf5] text-[#4e5d73]'}`}>
              {unvotedCount}
            </span>
          </button>

          <button
            onClick={() => onChangeTab('by_member')}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-[14px] px-1 text-[12px] font-medium transition active:scale-[0.98] ${activeTab === 'by_member' ? activeClass : inactiveClass}`}
          >
            <Users className="h-4 w-4 max-[360px]:hidden" strokeWidth={1.8} />
            <span className="whitespace-nowrap">Per membro</span>
          </button>

          <button
            aria-label={isSearchOpen ? 'Chiudi ricerca e filtri' : 'Cerca, filtra e ordina'}
            title={isSearchOpen ? 'Chiudi ricerca e filtri' : 'Cerca, filtra e ordina'}
            onClick={() => {
              if (isSearchOpen) onSearchChange('');
              setIsSearchOpen((open) => !open);
            }}
            className={`flex h-10 w-11 shrink-0 items-center justify-center rounded-[14px] text-[#52617a] transition active:scale-[0.96] ${isSearchOpen || searchQuery ? 'bg-white text-[#192331] shadow-sm' : 'hover:bg-white hover:text-[#202a3a]'}`}
          >
            {isSearchOpen ? (
              <X className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <span className="flex items-center gap-0.5" aria-hidden="true">
                <Search className="h-4 w-4" strokeWidth={1.8} />
                <SlidersHorizontal className="h-3 w-3" strokeWidth={1.8} />
              </span>
            )}
          </button>
        </div>

        {activeTab === 'by_member' && (
          <button
            type="button"
            onClick={onOpenViewedMemberSelect}
            className="mt-1 flex h-12 w-full items-center justify-between gap-3 border-t border-[#e7ebf2] px-2 pt-1 text-left transition hover:bg-white/70"
            aria-label={viewedMember ? `Cambia membro, attualmente ${viewedMember}` : 'Seleziona un membro'}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br text-[10px] font-bold text-white shadow-sm ${viewedMemberInfo?.color || 'from-slate-400 to-slate-500'}`}
              >
                {viewedMember ? viewedMember.substring(0, 2).toUpperCase() : '?'}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-medium uppercase tracking-[0.08em] text-[#8190a7]">
                  Voti di
                </span>
                <span className="block truncate text-[13px] font-semibold text-[#263044]">
                  {viewedMember || 'Seleziona un membro'}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {viewedMember && (
                <span className="rounded-full bg-[#e8edf5] px-2 py-1 text-[10px] font-medium text-[#52617a] tabular-nums">
                  {viewedMemberVoteCount} {viewedMemberVoteCount === 1 ? 'brano' : 'brani'}
                </span>
              )}
              <span className="text-[11px] font-medium text-[#52617a]">Cambia</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#718099]" strokeWidth={1.8} />
            </span>
          </button>
        )}

        {isSearchOpen && (
          <div className="mt-1 flex items-center gap-1 border-t border-[#e7ebf2] pt-1">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718099]" strokeWidth={1.8} />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Cerca titolo o artista"
                aria-label="Cerca titolo o artista"
                className="h-10 w-full rounded-[12px] border border-[#dfe5ee] bg-white pl-9 pr-3 text-[13px] text-[#202a3a] outline-none placeholder:text-[#8190a7] focus:border-[#a7b8d5] focus:ring-4 focus:ring-[#dce8fc]"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={activeTab === 'by_member' ? memberSortOption : sortOption}
                onChange={(event) => {
                  if (activeTab === 'by_member') {
                    onMemberSortChange(event.target.value as MemberSortOption);
                  } else {
                    onSortChange(event.target.value as SortOption);
                  }
                }}
                aria-label="Ordina brani"
                className="h-10 w-[124px] cursor-pointer appearance-none rounded-[12px] border border-[#dfe5ee] bg-white px-3 pr-8 text-[12px] font-medium text-[#38455b] outline-none focus:border-[#a7b8d5] focus:ring-4 focus:ring-[#dce8fc]"
              >
                {activeTab === 'by_member' ? (
                  <>
                    <option value="rating_desc">Voto più alto</option>
                    <option value="rating_asc">Voto più basso</option>
                    <option value="recent">Più recenti</option>
                    <option value="az">A-Z</option>
                  </>
                ) : (
                  <>
                    <option value="recent">Recenti</option>
                    <option value="highest_average">Media più alta</option>
                    <option value="az">Alfabetico</option>
                    <option value="votes_count">Più voti</option>
                  </>
                )}
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#61718a]" strokeWidth={1.8} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
