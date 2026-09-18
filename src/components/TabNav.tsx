'use client';

import React, { useState } from 'react';
import { TabType } from '@/types';
import { CheckCircle2, ListMusic, Search, SlidersHorizontal, X } from 'lucide-react';
import { SortOption } from './SearchBar';

interface TabNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unvotedCount: number;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
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
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(searchQuery));
  const activeClass = 'bg-[#192331] text-white shadow-[0_2px_6px_rgba(20,31,48,0.2)]';
  const inactiveClass = 'text-[#52617a] hover:bg-white hover:text-[#202a3a]';

  return (
    <div className="sticky top-[92px] z-20 bg-white px-4 pb-3 pt-1">
      <div className="mx-auto max-w-[520px] rounded-[18px] border border-[#dfe5ee] bg-[#f7f9fc] p-1 shadow-[0_3px_10px_rgba(39,52,74,0.05)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeTab('all')}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[13px] font-medium transition active:scale-[0.98] ${activeTab === 'all' ? activeClass : inactiveClass}`}
          >
            <ListMusic className="h-4 w-4" strokeWidth={1.8} />
            <span>Tutti</span>
            <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] tabular-nums ${activeTab === 'all' ? 'bg-white text-[#182231]' : 'bg-[#e8edf5] text-[#4e5d73]'}`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => onChangeTab('unvoted')}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[13px] font-medium transition active:scale-[0.98] ${activeTab === 'unvoted' ? activeClass : inactiveClass}`}
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
            <span>Da votare</span>
            <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] tabular-nums ${activeTab === 'unvoted' ? 'bg-white text-[#182231]' : 'bg-[#e8edf5] text-[#4e5d73]'}`}>
              {unvotedCount}
            </span>
          </button>

          <button
            aria-label={isSearchOpen ? 'Chiudi ricerca' : 'Cerca brano o artista'}
            title={isSearchOpen ? 'Chiudi ricerca' : 'Cerca brano o artista'}
            onClick={() => {
              if (isSearchOpen) onSearchChange('');
              setIsSearchOpen((open) => !open);
            }}
            className={`flex h-10 w-11 shrink-0 items-center justify-center rounded-[14px] text-[#52617a] transition active:scale-[0.96] ${isSearchOpen || searchQuery ? 'bg-white text-[#192331] shadow-sm' : 'hover:bg-white hover:text-[#202a3a]'}`}
          >
            {isSearchOpen ? <X className="h-4 w-4" strokeWidth={1.8} /> : <Search className="h-4 w-4" strokeWidth={1.8} />}
          </button>
        </div>

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
                value={sortOption}
                onChange={(event) => onSortChange(event.target.value as SortOption)}
                aria-label="Ordina brani"
                className="h-10 w-[112px] cursor-pointer appearance-none rounded-[12px] border border-[#dfe5ee] bg-white px-3 pr-8 text-[12px] font-medium text-[#38455b] outline-none focus:border-[#a7b8d5] focus:ring-4 focus:ring-[#dce8fc]"
              >
                <option value="recent">Recenti</option>
                <option value="az">Alfabetico</option>
                <option value="votes_count">Più voti</option>
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#61718a]" strokeWidth={1.8} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
