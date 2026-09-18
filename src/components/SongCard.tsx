'use client';

import React from 'react';
import { Song, MemberName } from '@/types';
import { calculateSongStats } from '@/lib/utils';
import { StarRating } from './StarRating';
import { Users, Star, Trash2, Info, CheckCircle2 } from 'lucide-react';

interface SongCardProps {
  song: Song;
  currentMember: MemberName | null;
  onVote: (songId: string, rating: number) => void;
  onOpenDetails: (song: Song) => void;
  onDelete?: (songId: string) => void;
  rankIndex?: number;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  currentMember,
  onVote,
  onOpenDetails,
  onDelete,
  rankIndex,
}) => {
  const stats = calculateSongStats(song, currentMember);
  const hasVoted = stats.userVote !== undefined;

  return (
    <article className="mb-2.5 rounded-[17px] border border-[#e4e9f1] bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgba(20,31,48,0.025)] transition hover:border-[#d8e0eb] hover:shadow-[0_4px_12px_rgba(33,49,73,0.045)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex h-5 items-center gap-1.5">
            {rankIndex !== undefined && (
              <span className="rounded-full bg-[#eef2f8] px-2 py-0.5 text-[10px] font-semibold text-[#52617a] tabular-nums">
                #{rankIndex}
              </span>
            )}

            {currentMember && hasVoted && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#c8f1dd] bg-[#e9fbf2] px-2 py-0.5 text-[10px] font-medium text-[#248a4b]">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                {stats.userVote}★
              </span>
            )}

            {currentMember && !hasVoted && (
              <span className="rounded-full bg-[#eef2f8] px-2 py-0.5 text-[10px] font-medium text-[#5e6d84]">
                Da votare
              </span>
            )}
          </div>

          <h3 className="truncate text-[17px] font-semibold leading-5 tracking-[-0.025em] text-[#171b26]">{song.title}</h3>
          {song.artist ? (
            <p className="mt-0.5 truncate text-[14px] leading-5 text-[#718099]">{song.artist}</p>
          ) : (
            <p className="mt-0.5 text-[14px] italic leading-5 text-[#9aa4b4]">Artista non specificato</p>
          )}
        </div>

        <button
          onClick={() => onOpenDetails(song)}
          title="Vedi dettagli"
          className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-[#e0e6ee] bg-[#f6f8fc] px-3 text-[13px] font-medium text-[#2d384d] transition hover:bg-[#eef3fa] active:scale-[0.98]"
        >
          <Star className="h-4 w-4 fill-[#ffb21a] text-[#ffb21a]" />
          <span className="tabular-nums">{stats.totalVotes > 0 ? stats.averageRating : '-'}</span>
          <span className="text-[#718099]">/ 4</span>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <StarRating
            currentRating={stats.userVote}
            onRate={(rating) => onVote(song.id, rating)}
            disabled={!currentMember}
            size="sm"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onOpenDetails(song)}
            title="Dettagli voti"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#52617a] transition hover:bg-[#f1f4f8] hover:text-[#202a3a] active:scale-[0.96]"
          >
            <Info className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>

          <button
            title="Voti totali"
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#e4e9f1] bg-white px-2.5 text-[12px] text-[#52617a] tabular-nums"
          >
            <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
            {stats.totalVotes}
          </button>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Vuoi davvero rimuovere "${song.title}"?`)) {
                  onDelete(song.id);
                }
              }}
              title="Elimina brano"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#52617a] transition hover:bg-[#fdf0f0] hover:text-[#c73838] active:scale-[0.96]"
            >
              <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
