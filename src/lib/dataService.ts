import { Song, Vote, MemberName } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_DEMO_SONGS } from './constants';

const LOCAL_STORAGE_KEY = 'band_songs_voting_data_v1';

// Helper per leggere lo storage locale
const getLocalSongs = (): Song[] => {
  if (typeof window === 'undefined') return INITIAL_DEMO_SONGS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_SONGS));
      return INITIAL_DEMO_SONGS;
    }
    return JSON.parse(saved);
  } catch {
    return INITIAL_DEMO_SONGS;
  }
};

// Helper per salvare nello storage locale
const saveLocalSongs = (songs: Song[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(songs));
  } catch (err) {
    console.error('Errore nel salvataggio locale:', err);
  }
};

export const dataService = {
  isCloudConnected: isSupabaseConfigured,

  // Carica l'elenco completo dei brani con i rispettivi voti
  async getSongs(): Promise<Song[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('*, votes(*)')
          .order('created_at', { ascending: false });

        if (songsError) throw songsError;
        return (songsData as Song[]) || [];
      } catch (err) {
        console.warn('Impossibile caricare da Supabase, uso fallback locale:', err);
        return getLocalSongs();
      }
    }
    return getLocalSongs();
  },

  // Aggiunge un nuovo brano (Anonimo per quanto riguarda l'autore)
  async addSong(title: string, artist?: string, initialVote?: { memberName: MemberName; rating: number }): Promise<Song> {
    const trimmedTitle = title.trim();
    const trimmedArtist = artist ? artist.trim() : '';

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: song, error: songErr } = await supabase
          .from('songs')
          .insert([{ title: trimmedTitle, artist: trimmedArtist }])
          .select()
          .single();

        if (songErr) throw songErr;

        let votes: Vote[] = [];
        if (initialVote && initialVote.rating >= 1 && initialVote.rating <= 4) {
          const { data: voteData, error: voteErr } = await supabase
            .from('votes')
            .insert([{
              song_id: song.id,
              member_name: initialVote.memberName,
              rating: initialVote.rating
            }])
            .select()
            .single();

          if (!voteErr && voteData) {
            votes = [voteData];
          }
        }

        return { ...song, votes };
      } catch (err) {
        console.warn('Errore aggiunta brano Supabase, salvo in locale:', err);
      }
    }

    // Fallback locale
    const newSong: Song = {
      id: 'song-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: trimmedTitle,
      artist: trimmedArtist,
      created_at: new Date().toISOString(),
      votes: initialVote
        ? [{
            song_id: 'song-' + Date.now(),
            member_name: initialVote.memberName,
            rating: initialVote.rating,
            updated_at: new Date().toISOString()
          }]
        : []
    };

    const current = getLocalSongs();
    const updated = [newSong, ...current];
    saveLocalSongs(updated);
    return newSong;
  },

  // Salva o aggiorna il voto di un membro per un brano (1-4 stelle)
  async setVote(songId: string, memberName: MemberName, rating: number): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('votes')
          .upsert(
            {
              song_id: songId,
              member_name: memberName,
              rating,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'song_id,member_name' }
          );

        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Errore voto Supabase, salvo in locale:', err);
      }
    }

    // Fallback locale
    const current = getLocalSongs();
    const updated = current.map(s => {
      if (s.id !== songId) return s;
      const votes = s.votes ? [...s.votes] : [];
      const idx = votes.findIndex(v => v.member_name === memberName);
      if (idx >= 0) {
        votes[idx] = { ...votes[idx], rating, updated_at: new Date().toISOString() };
      } else {
        votes.push({
          song_id: songId,
          member_name: memberName,
          rating,
          updated_at: new Date().toISOString()
        });
      }
      return { ...s, votes };
    });
    saveLocalSongs(updated);
  },

  // Elimina un brano (utile per pulizia)
  async deleteSong(songId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('songs').delete().eq('id', songId);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Errore eliminazione Supabase, elimino in locale:', err);
      }
    }

    const current = getLocalSongs();
    const updated = current.filter(s => s.id !== songId);
    saveLocalSongs(updated);
  }
};
