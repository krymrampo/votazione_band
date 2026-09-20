'use client';

import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export type SortOption = 'recent' | 'az' | 'votes_count' | 'highest_average';
export type MemberSortOption = 'rating_desc' | 'rating_asc' | 'recent' | 'az';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  showSort?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  showSort = true,
}) => {
  return (
    <div className="mx-auto flex max-w-[520px] items-center gap-2 px-4 py-1">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#61718a]" strokeWidth={1.8} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cerca brano o artista"
          className="h-11 w-full rounded-[14px] border border-[#dfe5ee] bg-[#f7f9fc] py-2 pl-11 pr-9 text-[14px] text-[#202a3a] placeholder:text-[#8190a7] outline-none transition focus:border-[#a7b8d5] focus:ring-4 focus:ring-[#dce8fc]"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#718099] hover:bg-[#e9eef6] hover:text-[#263044]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showSort && (
        <div className="relative shrink-0">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="h-11 cursor-pointer appearance-none rounded-[14px] border border-[#dfe5ee] bg-[#f7f9fc] px-3.5 pr-9 text-[13px] font-medium text-[#38455b] outline-none transition focus:border-[#a7b8d5] focus:ring-4 focus:ring-[#dce8fc]"
          >
            <option value="recent">Recenti</option>
            <option value="highest_average">Media più alta</option>
            <option value="votes_count">Votanti</option>
            <option value="az">A-Z</option>
          </select>
          <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#61718a]" strokeWidth={1.8} />
        </div>
      )}
    </div>
  );
};
