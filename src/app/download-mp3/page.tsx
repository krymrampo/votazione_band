'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Loader2, X } from 'lucide-react';
import { ErrorNotice } from '@/components/WorkspaceUI';
import { youtubeUrl } from '@/lib/mp3-input';

export default function DownloadPage() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  const active = useRef<AbortController | null>(null);
  const objectUrl = useRef<string | null>(null);
  function releaseFile() {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  }
  useEffect(
    () => () => {
      active.current?.abort();
      releaseFile();
    },
    [],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (active.current) return;
    setError('');
    setStatus('');
    let canonical;
    try {
      canonical = youtubeUrl(url);
    } catch (err) {
      setError((err as Error).message);
      return;
    }
    releaseFile();
    setResult(null);
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 290000);
    try {
      const response = await fetch('/api/download-mp3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canonical }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error
            ? `${body.error}${body.requestId ? ` Riferimento: ${body.requestId}` : ''}`
            : 'Il server ha interrotto la conversione. Riprova con un video più breve.',
        );
      }
      if (!response.headers.get('content-type')?.includes('audio/mpeg'))
        throw new Error('Il server non ha restituito un file MP3.');
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      if (!blob.size) throw new Error('Il file ricevuto è vuoto.');
      const encoded = /filename\*=UTF-8''([^;]+)/i.exec(
        response.headers.get('content-disposition') || '',
      )?.[1];
      const filename = encoded ? decodeURIComponent(encoded) : 'audio.mp3';
      objectUrl.current = URL.createObjectURL(blob);
      setResult({ url: objectUrl.current, filename });
    } catch (err) {
      if (controller.signal.aborted) {
        if (timedOut)
          setError(
            'Tempo disponibile esaurito. Riprova con un video più breve.',
          );
        else setStatus('Conversione annullata.');
      } else
        setError(err instanceof Error ? err.message : 'Download non riuscito.');
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <main className="workspace">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Download MP3</h1>
        <p className="mt-2 text-sm text-[#617086]">
          YouTube · MP3 192 kbps · fino a 10 minuti
        </p>
      </header>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium">
          Link YouTube
          <input
            required
            type="url"
            className="field mt-2"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={busy}
            autoComplete="off"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="button-primary" disabled={busy || !url.trim()}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {busy ? 'Preparazione MP3...' : 'Converti in MP3'}
          </button>
          {busy && (
            <button
              type="button"
              className="button"
              onClick={() => active.current?.abort()}
            >
              <X className="h-4 w-4" />
              Annulla
            </button>
          )}
        </div>
      </form>
      <div className="mt-5">
        <ErrorNotice message={error} />
      </div>
      <p role="status" className="text-sm text-[#617086]">
        {busy ? 'Download e conversione in corso...' : status}
      </p>
      {result && (
        <section className="mt-8 border-y border-[#e5eaf2] py-6">
          <div className="mb-3 flex items-center gap-2 text-[#32775a]">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="font-medium">MP3 pronto</h2>
          </div>
          <p className="mb-5 text-sm">{result.filename}</p>
          <a
            className="button-primary"
            href={result.url}
            download={result.filename}
          >
            <Download className="h-4 w-4" />
            Scarica MP3
          </a>
        </section>
      )}
    </main>
  );
}
