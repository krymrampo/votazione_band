import { timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

const port = Number(process.env.PORT || 8080);
const ydlsPort = Number(process.env.YDLS_PORT || 8081);
const apiKey = process.env.CONVERTER_API_KEY;
let activeDownload = false;

if (!apiKey || apiKey.length < 32) {
  throw new Error('CONVERTER_API_KEY must contain at least 32 characters');
}

const ydls = spawn(
  'ydls',
  ['-server', '-config', '/etc/ydls.json'],
  {
    env: { ...process.env, LISTEN: `127.0.0.1:${ydlsPort}` },
    stdio: ['ignore', 'inherit', 'inherit'],
  },
);

ydls.once('error', (error) => {
  console.error('Could not start ydls:', error.message);
  process.exitCode = 1;
});

function safeFilename(title) {
  const safe = (title || '')
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, '')
    .trim()
    .slice(0, 120)
    .trim();
  return `${safe || 'audio'}.mp3`;
}

function authorized(value = '') {
  const supplied = Buffer.from(value.replace(/^Bearer\s+/i, ''));
  const expected = Buffer.from(apiKey);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

function getVideoInfo(url, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'yt-dlp',
      [
        '--ignore-config',
        '--no-playlist',
        '--js-runtimes',
        'node:/usr/bin/node',
        '--socket-timeout',
        '15',
        '--retries',
        '1',
        '--skip-download',
        '--dump-single-json',
        '--',
        url,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    const stop = () => child.kill('SIGKILL');
    const timeout = setTimeout(stop, 45000);
    signal.addEventListener('abort', stop, { once: true });
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (Buffer.byteLength(stdout) > 4 * 1024 * 1024) stop();
    });
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-3000);
    });
    child.once('error', (error) => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', stop);
      reject(error);
    });
    child.once('close', (code) => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', stop);
      if (signal.aborted) return reject(new Error('Conversion aborted'));
      if (code !== 0)
        return reject(new Error(`Video metadata unavailable: ${stderr}`));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Invalid video metadata'));
      }
    });
  });
}

async function readBody(request) {
  let text = '';
  for await (const chunk of request) {
    text += chunk.toString();
    if (Buffer.byteLength(text) > 4096) throw new Error('BODY_TOO_LARGE');
  }
  return JSON.parse(text);
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    return json(response, ydls.exitCode === null ? 200 : 503, {
      status: ydls.exitCode === null ? 'ok' : 'unavailable',
    });
  }

  if (request.method !== 'POST' || request.url !== '/download')
    return json(response, 404, { error: 'Endpoint non trovato.' });
  if (!authorized(request.headers.authorization))
    return json(response, 401, { error: 'Autenticazione richiesta.' });
  if (activeDownload)
    return json(response, 503, { error: 'Il convertitore è occupato.' });

  let body;
  try {
    body = await readBody(request);
  } catch {
    return json(response, 400, { error: 'Richiesta non valida.' });
  }

  let video;
  try {
    const url = new URL(body?.url);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(
        url.hostname,
      )
    )
      throw new Error('invalid');
    const id =
      url.hostname === 'youtu.be'
        ? url.pathname.slice(1)
        : url.searchParams.get('v') ||
          /^\/(?:shorts|embed)\/([\w-]{11})/.exec(url.pathname)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) throw new Error('invalid');
    video = `https://www.youtube.com/watch?v=${id}`;
  } catch {
    return json(response, 400, { error: 'Inserisci un link YouTube valido.' });
  }

  activeDownload = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240000);
  request.once('aborted', () => controller.abort());
  response.once('close', () => {
    if (!response.writableEnded) controller.abort();
  });

  try {
    const info = await getVideoInfo(video, controller.signal);
    if (
      info.is_live ||
      ['is_live', 'is_upcoming', 'post_live'].includes(info.live_status)
    )
      return json(response, 422, { error: 'Le dirette non sono supportate.' });
    if (!Number.isFinite(info.duration) || info.duration <= 0)
      return json(response, 422, {
        error: 'Non è possibile verificare la durata del video.',
      });
    if (info.duration > 600)
      return json(response, 422, { error: 'Il video supera il limite di 10 minuti.' });
    if (info.availability && !['public', 'unlisted'].includes(info.availability))
      return json(response, 422, {
        error: 'Questo video richiede accesso o non è disponibile.',
      });

    const upstreamUrl = new URL('/', `http://127.0.0.1:${ydlsPort}`);
    upstreamUrl.searchParams.set('format', 'mp3');
    upstreamUrl.searchParams.set('url', video);
    const upstream = await fetch(upstreamUrl, { signal: controller.signal });
    if (!upstream.ok || !upstream.body) {
      return json(response, 502, {
        error: 'Il servizio non è riuscito a convertire questo video.',
      });
    }

    const filename = safeFilename(info.title);
    const encodedFilename = encodeURIComponent(filename).replace(
      /['()*]/g,
      (c) => '%' + c.charCodeAt(0).toString(16),
    );
    response.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="audio.mp3"; filename*=UTF-8''${encodedFilename}`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    let sent = 0;
    const outputLimit = new Transform({
      transform(chunk, _encoding, callback) {
        sent += chunk.length;
        if (sent > 50 * 1024 * 1024) {
          controller.abort();
          callback(new Error('MP3 output exceeded 50 MiB'));
        } else callback(null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(upstream.body), outputLimit, response);
  } catch (error) {
    if (!response.headersSent)
      json(response, 502, {
        error: 'Il servizio di conversione non è raggiungibile.',
      });
    if (error instanceof Error && error.name !== 'AbortError')
      console.error('Conversion request failed:', error.message);
  } finally {
    clearTimeout(timeout);
    activeDownload = false;
  }
});

server.listen(port, '0.0.0.0');

function stop() {
  server.close();
  ydls.kill('SIGTERM');
}

process.once('SIGTERM', stop);
process.once('SIGINT', stop);
