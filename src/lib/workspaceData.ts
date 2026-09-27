import { BandNote, BandNoteInput, BandSetlist } from '@/types';
import { isSupabaseConfigured, supabase } from './supabase';

const SETLIST_KEY = 'band_setlist_v1';
const NOTES_KEY = 'band_notes_v1';
const EMPTY_SETLIST: BandSetlist = { song_ids: [], revision: 0 };

export class SetlistConflictError extends Error {
  constructor() {
    super(
      'La scaletta è stata modificata da un altro membro. Ricarica prima di continuare.',
    );
  }
}

function readLocal<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(
      'I dati locali non sono leggibili. Non sono stati sovrascritti.',
    );
  }
}

export function cloudError(error: { message: string; code?: string }): Error {
  console.error('Supabase:', error.code, error.message);
  return new Error(
    'Salvataggio o caricamento condiviso non riuscito. Controlla la connessione e la configurazione del database.',
  );
}

export const workspaceData = {
  async getSetlist(): Promise<BandSetlist> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('band_setlist')
        .select('song_ids,revision')
        .eq('id', 1)
        .single();
      if (error) throw cloudError(error);
      return data as BandSetlist;
    }
    return readLocal(SETLIST_KEY, EMPTY_SETLIST);
  },

  async saveSetlist(songIds: string[], revision: number): Promise<BandSetlist> {
    const song_ids = [...new Set(songIds)];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('band_setlist')
        .update({ song_ids, revision: revision + 1 })
        .eq('id', 1)
        .eq('revision', revision)
        .select('song_ids,revision')
        .maybeSingle();
      if (error) throw cloudError(error);
      if (!data) throw new SetlistConflictError();
      return data as BandSetlist;
    }
    const save = () => {
      const current = readLocal(SETLIST_KEY, EMPTY_SETLIST);
      if (current.revision !== revision) throw new SetlistConflictError();
      const updated = { song_ids, revision: revision + 1 };
      localStorage.setItem(SETLIST_KEY, JSON.stringify(updated));
      return updated;
    };
    return navigator.locks
      ? navigator.locks.request(SETLIST_KEY, save)
      : save();
  },

  async getNotes(): Promise<BandNote[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('band_notes')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw cloudError(error);
      return data as BandNote[];
    }
    return readLocal<BandNote[]>(NOTES_KEY, []).sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    );
  },

  async saveNote(input: BandNoteInput, id?: string): Promise<BandNote> {
    const values = {
      title: input.title.trim(),
      body: input.body.trim(),
      song_id: input.song_id || null,
      updated_at: new Date().toISOString(),
    };
    if (!values.title || !values.body)
      throw new Error('Inserisci titolo e testo.');
    if (values.title.length > 200 || values.body.length > 20000)
      throw new Error('Titolo o testo troppo lungo.');
    if (isSupabaseConfigured && supabase) {
      const query = id
        ? supabase.from('band_notes').update(values).eq('id', id)
        : supabase.from('band_notes').insert(values);
      const { data, error } = await query.select('*').single();
      if (error) throw cloudError(error);
      return data as BandNote;
    }
    const save = () => {
      const notes = readLocal<BandNote[]>(NOTES_KEY, []);
      const existing = id ? notes.find((note) => note.id === id) : undefined;
      if (id && !existing)
        throw new Error('La nota è stata eliminata. Ricarica la pagina.');
      const note: BandNote = {
        id: id || crypto.randomUUID(),
        created_at: existing?.created_at || values.updated_at,
        ...values,
      };
      localStorage.setItem(
        NOTES_KEY,
        JSON.stringify([note, ...notes.filter((item) => item.id !== note.id)]),
      );
      return note;
    };
    return navigator.locks ? navigator.locks.request(NOTES_KEY, save) : save();
  },

  async deleteNote(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('band_notes').delete().eq('id', id);
      if (error) throw cloudError(error);
      return;
    }
    const remove = () =>
      localStorage.setItem(
        NOTES_KEY,
        JSON.stringify(
          readLocal<BandNote[]>(NOTES_KEY, []).filter((note) => note.id !== id),
        ),
      );
    if (navigator.locks) await navigator.locks.request(NOTES_KEY, remove);
    else remove();
  },
};

export async function detachLocalSong(songId: string) {
  const detach = () => {
    const notes = readLocal<BandNote[]>(NOTES_KEY, []);
    localStorage.setItem(
      NOTES_KEY,
      JSON.stringify(
        notes.map((note) =>
          note.song_id === songId ? { ...note, song_id: null } : note,
        ),
      ),
    );
  };
  if (navigator.locks) await navigator.locks.request(NOTES_KEY, detach);
  else detach();
}
