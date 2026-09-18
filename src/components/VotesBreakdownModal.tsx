'use client';

import React from 'react';
import { Song, MemberName } from '@/types';
import { BAND_MEMBERS, STAR_RATINGS } from '@/lib/constants';
import { calculateSongStats } from '@/lib/utils';
import { X, Star, Users, CheckCircle2, Clock } from 'lucide-react';

interface VotesBreakdownModalProps {
  song: Song | null;
  onClose: () => void;
  onVote?: (rating: number) => void;
  currentMember?: MemberName | null;
}

export const VotesBreakdownModal: React.FC<VotesBreakdownModalProps> = ({
  song,
  onClose,
  onVote,
  currentMember,
}) => {
  if (!song) return null;

  const stats = calculateSongStats(song, currentMember);
  const votes = song.votes || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172236]/35 p-0 backdrop-blur-sm animate-fadeIn sm:items-center sm:p-4">
      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-[20px] border border-[#e4e9f1] bg-white p-5 shadow-[0_20px_60px_rgba(25,35,49,0.18)] sm:rounded-[20px] sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#eef1f6] pb-3">
          <div>
            <span className="text-[11px] font-medium text-[#718099]">Dettaglio voti</span>
            <h3 className="text-lg font-semibold leading-snug tracking-[-0.02em] text-[#171b26]">{song.title}</h3>
            {song.artist && <p className="text-xs font-medium text-[#718099]">{song.artist}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-xl p-2 text-[#718099] transition hover:bg-[#f1f4f8] hover:text-[#263044]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Song Score Summary */}
        <div className="my-4 grid grid-cols-3 gap-2 rounded-[14px] border border-[#e4e9f1] bg-[#f7f9fc] p-3 text-center">
          <div>
            <span className="block text-[10px] font-medium text-[#718099]">Media voto</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="text-lg font-semibold text-[#a86b00] tabular-nums">
                {stats.totalVotes > 0 ? stats.averageRating : '-'}
              </span>
              <span className="text-xs font-medium text-[#718099]">/4</span>
              <Star className="inline h-3.5 w-3.5 fill-[#ffb21a] text-[#ffb21a]" />
            </div>
          </div>
          <div>
            <span className="block text-[10px] font-medium text-[#718099]">Votanti</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="text-lg font-semibold text-[#263044] tabular-nums">{stats.totalVotes}</span>
              <span className="text-xs font-medium text-[#718099]">/7</span>
              <Users className="inline h-3.5 w-3.5 text-[#718099]" />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Consenso</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span
                className={`text-lg font-semibold tabular-nums ${
                  stats.percentage >= 75
                    ? 'text-emerald-400'
                    : stats.percentage >= 50
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {stats.totalVotes > 0 ? `${stats.percentage}%` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Members Breakdown List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <h4 className="px-1 text-xs font-semibold text-[#52617a]">
            Voti dei componenti:
          </h4>
          {BAND_MEMBERS.map((member) => {
            const memberVote = votes.find((v) => v.member_name === member.name);
            const isCurrentUser = currentMember === member.name;
            const ratingInfo = memberVote
              ? STAR_RATINGS.find((r) => r.stars === memberVote.rating)
              : null;

            return (
              <div
                key={member.name}
                className={`flex items-center justify-between rounded-xl border p-2.5 transition ${
                  isCurrentUser
                    ? 'border-[#bfcdeb] bg-[#eef3ff]'
                    : 'border-[#e4e9f1] bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${member.color} text-xs font-bold text-white`}
                  >
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#263044]">
                      {member.name}
                      {isCurrentUser && (
                        <span className="rounded-full bg-[#dfeaff] px-1.5 py-0.5 text-[9px] font-medium text-[#2f6fcf]">
                          Tu
                        </span>
                      )}
                    </span>
                    {ratingInfo && (
                      <span className="text-[10px] text-[#718099]">{ratingInfo.label}</span>
                    )}
                  </div>
                </div>

                <div>
                  {memberVote ? (
                    <div className="flex items-center gap-0.5 rounded-lg border border-[#e4e9f1] bg-[#f7f9fc] px-2 py-1">
                      {[1, 2, 3, 4].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= memberVote.rating
                              ? 'fill-[#ffb21a] text-[#ffb21a]'
                              : 'text-[#c4ccda]'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 rounded-lg border border-[#e4e9f1] bg-[#f7f9fc] px-2 py-1 text-[11px] text-[#718099]">
                      <Clock className="h-3 w-3 text-[#8c9aaf]" />
                      In attesa
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick vote if not voted yet */}
        {currentMember && onVote && (
          <div className="mt-4 flex flex-col items-center gap-2 border-t border-[#eef1f6] pt-3">
            <span className="text-xs font-medium text-[#52617a]">
              {stats.userVote ? 'Modifica il tuo voto:' : 'Assegna il tuo voto:'}
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((star) => (
                <button
                  key={star}
                  onClick={() => onVote(star)}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.95] ${
                    stats.userVote === star
                      ? 'border-[#ffc657] bg-[#ffb21a] text-[#243044]'
                      : 'border-[#dfe5ee] bg-white text-[#52617a] hover:bg-[#f7f9fc]'
                  }`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      stats.userVote === star ? 'fill-[#243044] text-[#243044]' : 'text-[#ffb21a]'
                    }`}
                  />
                  {star}★
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
