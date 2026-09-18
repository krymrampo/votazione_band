import { Song, MemberName, SongStats } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateSongStats(song: Song, currentMember?: MemberName | null): SongStats {
  const votes = song.votes || [];
  const totalVotes = votes.length;

  if (totalVotes === 0) {
    return {
      averageRating: 0,
      totalVotes: 0,
      percentage: 0,
      userVote: undefined
    };
  }

  const sum = votes.reduce((acc, v) => acc + v.rating, 0);
  const averageRating = Number((sum / totalVotes).toFixed(1));
  // 4 stars = 100%, 1 star = 25%
  const percentage = Math.round((averageRating / 4) * 100);

  const userVote = currentMember
    ? votes.find(v => v.member_name === currentMember)?.rating
    : undefined;

  return {
    averageRating,
    totalVotes,
    percentage,
    userVote
  };
}

// Calcolo punteggio classifica: considera sia la media sia il numero di voti raccolti
export function getSongRankingScore(song: Song): number {
  const { averageRating, totalVotes } = calculateSongStats(song);
  if (totalVotes === 0) return 0;
  // Weighted score: average rating with slight weight for more votes
  return averageRating * 10 + Math.min(totalVotes, 7);
}
