export type MemberName =
  | 'Chiara'
  | 'Elisa'
  | 'Matteo'
  | 'Frarampo'
  | 'Frabergo'
  | 'Fracocò'
  | 'GianTheManager';

export interface Vote {
  id?: string;
  song_id: string;
  member_name: MemberName;
  rating: number; // 1 to 4
  updated_at?: string;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  notes?: string;
  created_at: string;
  votes?: Vote[];
}

export type TabType = 'all' | 'unvoted';

export interface SongStats {
  averageRating: number;
  totalVotes: number;
  percentage: number;
  userVote?: number;
}
