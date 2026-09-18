import { MemberName } from '@/types';

export const BAND_MEMBERS: { name: MemberName; role?: string; color: string; bgLight: string }[] = [
  { name: 'Chiara', color: 'from-pink-500 to-rose-500', bgLight: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  { name: 'Elisa', color: 'from-purple-500 to-violet-500', bgLight: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { name: 'Matteo', color: 'from-blue-500 to-cyan-500', bgLight: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { name: 'Frarampo', color: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { name: 'Frabergo', color: 'from-emerald-500 to-teal-500', bgLight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { name: 'Fracocò', color: 'from-indigo-500 to-blue-600', bgLight: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { name: 'GianTheManager', role: 'Manager', color: 'from-yellow-400 to-amber-600', bgLight: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
];

export const STAR_RATINGS = [
  { stars: 1, label: 'Poco / No', description: 'Non mi convince', color: 'text-amber-200' },
  { stars: 2, label: 'Sufficiente', description: 'Se proprio serve', color: 'text-amber-300' },
  { stars: 3, label: 'Mi piace', description: 'Molto favorevole', color: 'text-amber-400' },
  { stars: 4, label: 'Top / Scaletta', description: 'Assolutamente sì!', color: 'text-amber-400' },
];

export const INITIAL_DEMO_SONGS = [
  {
    id: 'demo-1',
    title: 'Superstition',
    artist: 'Stevie Wonder',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    votes: [
      { song_id: 'demo-1', member_name: 'Chiara' as MemberName, rating: 4 },
      { song_id: 'demo-1', member_name: 'Matteo' as MemberName, rating: 4 },
      { song_id: 'demo-1', member_name: 'Frarampo' as MemberName, rating: 4 },
      { song_id: 'demo-1', member_name: 'GianTheManager' as MemberName, rating: 3 },
    ]
  },
  {
    id: 'demo-2',
    title: 'Sweet Child O\' Mine',
    artist: 'Guns N\' Roses',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    votes: [
      { song_id: 'demo-2', member_name: 'Elisa' as MemberName, rating: 4 },
      { song_id: 'demo-2', member_name: 'Frabergo' as MemberName, rating: 3 },
      { song_id: 'demo-2', member_name: 'Fracocò' as MemberName, rating: 4 },
    ]
  },
  {
    id: 'demo-3',
    title: 'Beggin\'',
    artist: 'Måneskin',
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    votes: [
      { song_id: 'demo-3', member_name: 'Chiara' as MemberName, rating: 3 },
      { song_id: 'demo-3', member_name: 'Elisa' as MemberName, rating: 2 },
    ]
  },
  {
    id: 'demo-4',
    title: 'Certe Notti',
    artist: 'Ligabue',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    votes: [
      { song_id: 'demo-4', member_name: 'Frarampo' as MemberName, rating: 2 },
      { song_id: 'demo-4', member_name: 'Matteo' as MemberName, rating: 1 },
    ]
  },
  {
    id: 'demo-5',
    title: 'Seven Nation Army',
    artist: 'The White Stripes',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    votes: []
  }
];
