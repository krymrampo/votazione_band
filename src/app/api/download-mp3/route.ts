import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { Mp3Error, youtubeUrl } from '@/lib/mp3-input';
import { convertToMp3 } from '@/lib/mp3-server';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

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
