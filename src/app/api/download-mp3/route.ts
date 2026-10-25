import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { Mp3Error, youtubeUrl } from '@/lib/mp3-input';
import { convertToMp3 } from '@/lib/mp3-server';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

async function proxyToConverter(url: string, request: Request, requestId: string) {
  const serviceUrl = process.env.MP3_BACKEND_URL;
  const apiKey = process.env.MP3_BACKEND_API_KEY;
  if (!serviceUrl || !apiKey)
    throw new Mp3Error(
      'BACKEND_NOT_CONFIGURED',
      'Il servizio MP3 non è configurato.',
      503,
    );

  let endpoint: URL;
  try {
    endpoint = new URL('/download', serviceUrl);
    if (
      endpoint.protocol !== 'https:' &&
      endpoint.hostname !== 'localhost' &&
      endpoint.hostname !== '127.0.0.1'
    ) {
      throw new Error('HTTPS required');
    }
  } catch {
    throw new Mp3Error('BACKEND_CONFIG', 'URL del servizio MP3 non valido.', 503);
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 240000);
  const abort = () => controller.abort();
  request.signal.addEventListener('abort', abort, { once: true });
  const cleanup = () => {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', abort);
  };

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    });

    if (!upstream.ok || !upstream.body) {
      const body = await upstream.json().catch(() => null);
      cleanup();
      throw new Mp3Error(
        'CONVERTER_ERROR',
        body?.error || 'Il servizio di conversione non ha completato il file.',
        upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502,
      );
    }

    const reader = upstream.body.getReader();
    let finished = false;
    async function finish() {
      if (finished) return;
      finished = true;
      cleanup();
    }
    const stream = new ReadableStream<Uint8Array>({
      async pull(target) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            target.close();
            await finish();
          } else target.enqueue(value);
        } catch (error) {
          await finish();
          if (!target.desiredSize) return;
          target.error(error);
        }
      },
      async cancel() {
        controller.abort();
        await reader.cancel().catch(() => undefined);
        await finish();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition':
          upstream.headers.get('content-disposition') ||
          'attachment; filename="audio.mp3"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    cleanup();
    if (error instanceof Mp3Error) throw error;
    throw new Mp3Error(
      timedOut ? 'TIMEOUT' : 'BACKEND_UNAVAILABLE',
      timedOut
        ? 'La conversione ha superato il tempo disponibile.'
        : 'Il servizio di conversione non è raggiungibile.',
      timedOut ? 504 : 502,
    );
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const started = Date.now();
  try {
    const bodyReader = request.body?.getReader();
    if (!bodyReader)
      throw new Mp3Error('INVALID_URL', 'Inserisci un link YouTube.', 400);
    let text = '';
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await bodyReader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        if (text.length > 4096) {
          await bodyReader.cancel();
          throw new Mp3Error('INVALID_URL', 'Richiesta troppo lunga.', 400);
        }
      }
      text += decoder.decode();
    } finally {
      bodyReader.releaseLock();
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Mp3Error('INVALID_URL', 'Richiesta non valida.', 400);
    }
    const url = youtubeUrl(body?.url);
    if (process.env.MP3_BACKEND_URL || process.env.VERCEL)
      return await proxyToConverter(url, request, requestId);

    const result = await convertToMp3(url, request.signal, requestId);
    const file = createReadStream(result.path);
    const reader = (
      Readable.toWeb(file) as ReadableStream<Uint8Array>
    ).getReader();
    let finished = false;
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    async function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      request.signal.removeEventListener('abort', abort);
      try {
        await reader.cancel();
      } catch {
        /* The file stream may already be closed. */
      }
      await result.cleanup();
    }
    function abort() {
      if (finished) return;
      streamController.error(new Error('Download interrotto'));
      void finish();
    }
    const timer = setTimeout(
      abort,
      Math.max(1, 280000 - (Date.now() - started)),
    );
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller;
      },
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (finished) return;
          if (done) {
            controller.close();
            await finish();
          } else controller.enqueue(value);
        } catch (err) {
          if (!finished) {
            console.error('[mp3]', requestId, 'stream', err);
            controller.error(err);
            await finish();
          }
        }
      },
      cancel: finish,
    });
    request.signal.addEventListener('abort', abort, { once: true });
    if (request.signal.aborted) abort();
    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="audio.mp3"; filename*=UTF-8''${encodeURIComponent(result.filename).replace(/['()*]/g, (character) => '%' + character.charCodeAt(0).toString(16))}`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Request-Id': requestId,
      },
    });
  } catch (err) {
    const error =
      err instanceof Mp3Error
        ? err
        : new Mp3Error('INTERNAL', 'Download non riuscito. Riprova.', 500);
    console.error('[mp3]', requestId, error.code, err);
    return Response.json(
      { error: error.message, code: error.code, requestId },
      {
        status: error.status,
        headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId },
      },
    );
  }
}
