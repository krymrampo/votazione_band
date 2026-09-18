'use client';

import React from 'react';
import { TabType } from '@/types';
import { ListMusic, CheckCircle2, Trophy } from 'lucide-react';

interface TabNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unvotedCount: number;
  totalCount: number;
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onChangeTab,
  unvotedCount,
  totalCount,
}) => {
  return (
    <div className="sticky top-[101px] z-20 bg-white/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-[520px] items-center rounded-[18px] border border-[#dfe5ee] bg-[#f7f9fc] p-1 shadow-[0_3px_10px_rgba(39,52,74,0.05)]">
        <button
          onClick={() => onChangeTab('all')}
          className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[13px] font-medium transition active:scale-[0.98] ${
            activeTab === 'all'
              ? 'bg-[#192331] text-white shadow-[0_2px_6px_rgba(20,31,48,0.2)]'
              : 'text-[#52617a] hover:bg-white hover:text-[#202a3a]'
          }`}
        >
          <ListMusic className="h-4 w-4" strokeWidth={1.8} />
          <span>Tutti</span>
          <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] tabular-nums ${activeTab === 'all' ? 'bg-white text-[#182231]' : 'bg-[#e8edf5] text-[#4e5d73]'}`}>
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => onChangeTab('unvoted')}
          className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[13px] font-medium transition active:scale-[0.98] ${
            activeTab === 'unvoted'
              ? 'bg-[#192331] text-white shadow-[0_2px_6px_rgba(20,31,48,0.2)]'
              : 'text-[#52617a] hover:bg-white hover:text-[#202a3a]'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
          <span>Da votare</span>
          {unvotedCount > 0 ? (
            <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] tabular-nums ${activeTab === 'unvoted' ? 'bg-white text-[#182231]' : 'bg-[#e8edf5] text-[#4e5d73]'}`}>
              {unvotedCount}
            </span>
          ) : (
            <span className="text-[10px] text-[#7d899c]">0</span>
          )}
        </button>

        <button
          onClick={() => onChangeTab('top')}
          className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[13px] font-medium transition active:scale-[0.98] ${
            activeTab === 'top'
              ? 'bg-[#192331] text-white shadow-[0_2px_6px_rgba(20,31,48,0.2)]'
              : 'text-[#52617a] hover:bg-white hover:text-[#202a3a]'
          }`}
        >
          <Trophy className="h-4 w-4" strokeWidth={1.8} />
          <span>Top</span>
        </button>
      </div>
    </div>
  );
};
