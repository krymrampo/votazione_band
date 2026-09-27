'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ListMusic, Plus, X } from 'lucide-react';
import { dataService } from '@/lib/dataService';
import { SetlistConflictError } from '@/lib/workspaceData';
import { BandSetlist, Song } from '@/types';
import {
  ErrorNotice,
  Loading,
  PageHeading,
  errorMessage,
} from '@/components/WorkspaceUI';

export default function SetlistPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlist, setSetlist] = useState<BandSetlist | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    try {
      const [nextSongs, nextSetlist] = await Promise.all([
        dataService.getSongs(),
        dataService.getSetlist(),
      ]);
      setSongs(nextSongs);
      setSetlist(nextSetlist);
      setConflict(false);
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

  const listedSongs = (setlist?.song_ids || []).flatMap((id) => {
    const song = songs.find((item) => item.id === id);
    return song ? [song] : [];
  });
  const ids = listedSongs.map((song) => song.id);
  const available = songs.filter(
    (song) =>
      !ids.includes(song.id) &&
      `${song.title} ${song.artist || ''}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );

  async function save(nextIds: string[]) {
    if (!setlist || busy.current || conflict) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      setSetlist(await dataService.saveSetlist(nextIds, setlist.revision));
    } catch (err) {
      setError(errorMessage(err));
      setConflict(err instanceof SetlistConflictError);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  function move(index: number, direction: number) {
    const next = [...ids];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    void save(next);
  }
  const disabled = saving || conflict || loading || !setlist;

  return (
    <main className="workspace">
      <PageHeading
        title="Scaletta"
        onRefresh={() => void load()}
        disabled={loading || saving}
      />
      <ErrorNotice message={error} retry={() => void load()} />
      {loading ? (
        <Loading />
      ) : (
        setlist && (
          <>
            <div
              className="mb-2 flex justify-between gap-3 text-xs text-[#617086]"
              aria-live="polite"
            >
              <span>{ids.length} brani</span>
              <span>
                {saving
                  ? 'Salvataggio...'
                  : conflict
                    ? 'Da ricaricare'
                    : 'Salvata'}
              </span>
            </div>
            {listedSongs.length ? (
              <ol className="divide-y divide-[#e5eaf2] border-y border-[#e5eaf2]">
                {listedSongs.map((song, index) => (
                  <li key={song.id} className="flex items-center gap-3 py-3">
                    <span className="w-5 shrink-0 text-right text-sm tabular-nums text-[#718099]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{song.title}</p>
                      <p className="text-xs text-[#617086]">{song.artist}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        className="icon-button"
                        title="Sposta su"
                        aria-label={`Sposta su ${song.title}`}
                        disabled={disabled || index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        className="icon-button"
                        title="Sposta giù"
                        aria-label={`Sposta giù ${song.title}`}
                        disabled={disabled || index === ids.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        className="icon-button"
                        title="Rimuovi dalla scaletta"
                        aria-label={`Rimuovi ${song.title} dalla scaletta`}
                        disabled={disabled}
                        onClick={() =>
                          void save(ids.filter((id) => id !== song.id))
                        }
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="border-y border-[#e5eaf2] py-10 text-center text-[#617086]">
                <ListMusic className="mx-auto mb-3 h-7 w-7" />
                <p className="text-sm">La scaletta è vuota.</p>
              </div>
            )}
            <section className="mt-8">
              <h2 className="mb-3 text-base font-semibold">Aggiungi brani</h2>
              <input
                className="field mb-3"
                type="search"
                aria-label="Cerca brani da aggiungere"
                placeholder="Titolo o artista"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {available.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 border-b border-[#edf0f4] py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{song.title}</p>
                    <p className="text-xs text-[#617086]">{song.artist}</p>
                  </div>
                  <button
                    className="icon-button"
                    title="Aggiungi alla scaletta"
                    aria-label={`Aggiungi ${song.title} alla scaletta`}
                    disabled={disabled}
                    onClick={() => void save([...ids, song.id])}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {!available.length && (
                <p className="py-5 text-sm text-[#617086]">
                  {query
                    ? 'Nessun risultato.'
                    : songs.length
                      ? 'Tutti i brani sono in scaletta.'
                      : 'Nessun brano proposto.'}
                </p>
              )}
              <Link
                href="/votazione"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4"
              >
                <Plus className="h-4 w-4" />
                Proponi un nuovo brano
              </Link>
            </section>
          </>
        )
      )}
    </main>
  );
}
