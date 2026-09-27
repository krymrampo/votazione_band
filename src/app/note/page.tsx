'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  Music2,
  NotebookPen,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { dataService } from '@/lib/dataService';
import { BandNote, BandNoteInput, Song } from '@/types';
import {
  ErrorNotice,
  Loading,
  PageHeading,
  errorMessage,
} from '@/components/WorkspaceUI';

const emptyNote: BandNoteInput = { title: '', body: '', song_id: null };

export default function NotesPage() {
  const [notes, setNotes] = useState<BandNote[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<BandNoteInput>(emptyNote);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const editorRef = useRef<HTMLFormElement>(null);
  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    try {
      const [nextNotes, nextSongs] = await Promise.all([
        dataService.getNotes(),
        dataService.getSongs(),
      ]);
      setNotes(nextNotes);
      setSongs(nextSongs);
      setReady(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (editing !== null)
      editorRef.current?.scrollIntoView({ block: 'nearest' });
  }, [editing]);

  function closeEditor() {
    if (
      (form.title.trim() || form.body.trim()) &&
      !window.confirm('Chiudere senza salvare le modifiche?')
    )
      return;
    setEditing(null);
    setForm(emptyNote);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const note = await dataService.saveNote(form, editing || undefined);
      setNotes((current) => [
        note,
        ...current.filter((item) => item.id !== note.id),
      ]);
      setEditing(null);
      setForm(emptyNote);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function remove(id: string) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      await dataService.deleteNote(id);
      setNotes((current) => current.filter((note) => note.id !== id));
      setDeleting(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  const visible = notes.filter((note) => {
    const song = songs.find((song) => song.id === note.song_id);
    return (
      (filter === 'all' ||
        (filter === 'general' ? !song : song?.id === filter)) &&
      `${note.title} ${note.body} ${song?.title || ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    );
  });

  return (
    <main className="workspace">
      <PageHeading
        title="Note"
        onRefresh={() => void load()}
        disabled={loading || saving || editing !== null}
      >
        <button
          className="button-primary"
          disabled={!ready || loading || saving || editing !== null}
          onClick={() => {
            setEditing('');
            setForm(emptyNote);
          }}
        >
          <Plus className="h-4 w-4" />
          Nuova nota
        </button>
      </PageHeading>
      <ErrorNotice
        message={error}
        retry={editing === null ? () => void load() : undefined}
      />
      {editing !== null && (
        <form
          ref={editorRef}
          onSubmit={save}
          className="mb-7 space-y-4 border-y border-[#e5eaf2] py-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {editing ? 'Modifica nota' : 'Nuova nota'}
            </h2>
            <button
              type="button"
              className="icon-button"
              aria-label="Chiudi modifica"
              title="Chiudi modifica"
              disabled={saving}
              onClick={closeEditor}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label htmlFor="note-title" className="block text-xs font-medium">
              Titolo
            </label>
            <input
              id="note-title"
              autoFocus
              required
              maxLength={200}
              className="field mt-1.5"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="note-song" className="block text-xs font-medium">
              Brano
            </label>
            <select
              id="note-song"
              className="field mt-1.5"
              value={form.song_id || ''}
              onChange={(event) =>
                setForm({ ...form, song_id: event.target.value || null })
              }
              disabled={saving}
            >
              <option value="">Nota generale</option>
              {songs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title}
                  {song.artist ? ` · ${song.artist}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="note-body" className="block text-xs font-medium">
              Testo
            </label>
            <textarea
              id="note-body"
              required
              maxLength={20000}
              rows={7}
              className="field mt-1.5 resize-y"
              value={form.body}
              onChange={(event) =>
                setForm({ ...form, body: event.target.value })
              }
              disabled={saving}
            />
          </div>
          <button
            className="button-primary"
            disabled={saving || !form.title.trim() || !form.body.trim()}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvataggio...' : 'Salva nota'}
          </button>
        </form>
      )}
      {loading ? (
        <Loading />
      ) : (
        ready && (
          <>
            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              <input
                className="field"
                type="search"
                aria-label="Cerca note"
                placeholder="Cerca nelle note"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select
                className="field"
                aria-label="Filtra note"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">Tutte le note</option>
                <option value="general">Note generali</option>
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {visible.map((note) => {
                const song = songs.find((song) => song.id === note.song_id);
                return (
                  <article
                    key={note.id}
                    className="rounded-lg border border-[#e5eaf2] p-4"
                  >
                    <div className="mb-3 flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold">{note.title}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#617086]">
                          {song && <Music2 className="h-3 w-3 shrink-0" />}
                          {song?.title || 'Generale'}
                        </p>
                      </div>
                      <button
                        className="icon-button"
                        title="Modifica nota"
                        aria-label={`Modifica ${note.title}`}
                        disabled={saving || editing !== null}
                        onClick={() => {
                          setEditing(note.id);
                          setForm({
                            title: note.title,
                            body: note.body,
                            song_id: song?.id || null,
                          });
                          setDeleting(null);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="icon-button"
                        title="Elimina nota"
                        aria-label={`Elimina ${note.title}`}
                        disabled={saving || editing !== null}
                        onClick={() => setDeleting(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="note-body whitespace-pre-wrap text-sm leading-6 text-[#38455b]">
                      {note.body}
                    </p>
                    <time
                      className="mt-4 block text-xs text-[#617086]"
                      dateTime={note.updated_at}
                    >
                      {new Date(note.updated_at).toLocaleString('it-IT')}
                    </time>
                    {deleting === note.id && (
                      <div className="mt-4 border-t border-[#e5eaf2] pt-3">
                        <p className="mb-3 text-sm">Eliminare questa nota?</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="button text-[#b32b2b]"
                            disabled={saving}
                            onClick={() => void remove(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Conferma eliminazione
                          </button>
                          <button
                            className="button"
                            disabled={saving}
                            onClick={() => setDeleting(null)}
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            {!visible.length && (
              <div className="py-12 text-center text-[#617086]">
                <NotebookPen className="mx-auto mb-3 h-7 w-7" />
                <p className="text-sm">
                  {notes.length
                    ? 'Nessuna nota corrisponde ai filtri.'
                    : 'Nessuna nota ancora.'}
                </p>
              </div>
            )}
          </>
        )
      )}
    </main>
  );
}
