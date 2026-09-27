import { spawn } from 'node:child_process';
import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  MAX_SOURCE_BYTES,
  Mp3Error,
  safeFilename,
  validateVideo,
} from './mp3-input';

let activeConversions = 0;
const mediaDirectory = () =>
  path.join(process.cwd(), '.media-bin', `${process.platform}-${process.arch}`);

export function runProcess(
  binary: string,
  args: string[],
  signal: AbortSignal,
  cwd: string,
): Promise<string> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      cwd,
      shell: false,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, TMPDIR: cwd },
    });
    let stdout = '';
    let stderr = '';
    let overflow = false;
    const stop = () => {
      if (child.pid) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          child.kill('SIGKILL');
        }
      }
    };
    const onAbort = () => stop();
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) stop();
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (Buffer.byteLength(stdout) > 4 * 1024 * 1024) {
        overflow = true;
        stop();
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-8000);
    });
    child.once('error', (err) => {
      signal.removeEventListener('abort', onAbort);
      reject(err);
    });
    child.once('close', (code) => {
      signal.removeEventListener('abort', onAbort);
      if (signal.aborted) reject(signal.reason);
      else if (overflow) reject(new Error('Process output exceeded limit'));
      else if (code !== 0)
        reject(new Error(`${path.basename(binary)} exited ${code}: ${stderr}`));
      else resolve(stdout);
    });
  });
}

export async function convertToMp3(
  url: string,
  requestSignal: AbortSignal,
  requestId: string,
) {
  if (activeConversions >= 1)
    throw new Mp3Error(
      'BUSY',
      'Il convertitore è occupato. Riprova tra poco.',
      503,
    );
  activeConversions += 1;
  const controller = new AbortController();
  const abort = () =>
    controller.abort(new Mp3Error('CANCELLED', 'Conversione annullata.', 499));
  requestSignal.addEventListener('abort', abort, { once: true });
  if (requestSignal.aborted) abort();
  const timeout = setTimeout(
    () =>
      controller.abort(
        new Mp3Error(
          'TIMEOUT',
          'La conversione ha superato il tempo disponibile. Riprova con un video più breve.',
          504,
        ),
      ),
    240000,
  );
  let directory: string | undefined;
  let watcher: ReturnType<typeof setInterval> | undefined;
  let cleaned = false;
  async function cleanup() {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(timeout);
    if (watcher) clearInterval(watcher);
    requestSignal.removeEventListener('abort', abort);
    try {
      if (directory) await rm(directory, { recursive: true, force: true });
    } finally {
      activeConversions -= 1;
    }
  }
  let phase = 'metadata';
  try {
    directory = await mkdtemp(path.join(tmpdir(), 'band-mp3-'));
    const workdir = directory;
    const bin = mediaDirectory();
    const yt = path.join(bin, 'yt-dlp');
    const common = [
      '--ignore-config',
      '--no-cache-dir',
      '--no-playlist',
      '--js-runtimes',
      `node:${process.execPath}`,
      '--socket-timeout',
      '20',
      '--retries',
      '1',
    ];
    const raw = await runProcess(
      yt,
      [...common, '--skip-download', '--dump-single-json', '--', url],
      controller.signal,
      workdir,
    );
    const info = JSON.parse(raw);
    validateVideo(info);
    await writeFile(path.join(workdir, 'info.json'), raw);
    phase = 'download';

    // Enforce the byte limit even when the upstream reports no Content-Length.
    let checking = false;
    watcher = setInterval(async () => {
      if (checking || controller.signal.aborted) return;
      checking = true;
      try {
        const files = (await readdir(workdir)).filter((name) =>
          name.startsWith('source.'),
        );
        const sizes = await Promise.all(
          files.map((name) =>
            stat(path.join(workdir, name))
              .then((file) => file.size)
              .catch(() => 0),
          ),
        );
        if (sizes.reduce((sum, size) => sum + size, 0) > MAX_SOURCE_BYTES)
          controller.abort(
            new Mp3Error('TOO_LARGE', 'L’audio supera il limite di 50 MB.'),
          );
      } catch {
        /* The directory may be removed during cancellation. */
      } finally {
        checking = false;
      }
    }, 200);

    await runProcess(
      yt,
      [
        ...common,
        '--load-info-json',
        path.join(workdir, 'info.json'),
        '-f',
        'bestaudio/best',
        '--no-part',
        '--no-progress',
        '--max-filesize',
        String(MAX_SOURCE_BYTES),
        '--fragment-retries',
        '1',
        '--abort-on-unavailable-fragments',
        '--ffmpeg-location',
        bin,
        '-o',
        path.join(workdir, 'source.%(ext)s'),
      ],
      controller.signal,
      workdir,
    );
    clearInterval(watcher);
    const sources = (await readdir(workdir)).filter((name) =>
      /^source\.[a-zA-Z0-9]+$/.test(name),
    );
    if (sources.length !== 1)
      throw new Mp3Error(
        'TOO_LARGE',
        'Audio non scaricato: il file potrebbe superare il limite di 50 MB.',
      );
    const source = path.join(workdir, sources[0]);
    if ((await stat(source)).size > MAX_SOURCE_BYTES)
      throw new Mp3Error('TOO_LARGE', 'L’audio supera il limite di 50 MB.');
    phase = 'conversion';
    const probe = JSON.parse(
      await runProcess(
        path.join(bin, 'ffprobe'),
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'json',
          source,
        ],
        controller.signal,
        workdir,
      ),
    );
    validateVideo({ duration: Number(probe.format?.duration) });
    const output = path.join(workdir, 'audio.mp3');
    await runProcess(
      path.join(bin, 'ffmpeg'),
      [
        '-nostdin',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        source,
        '-map',
        '0:a:0',
        '-vn',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '192k',
        '-threads',
        '1',
        '-y',
        output,
      ],
      controller.signal,
      workdir,
    );
    const size = (await stat(output)).size;
    if (!size) throw new Error('Empty MP3 output');
    controller.signal.throwIfAborted();
    clearTimeout(timeout);
    console.info('[mp3]', requestId, 'ready', { bytes: size });
    return {
      path: output,
      filename: safeFilename(
        typeof info.title === 'string' ? info.title : 'audio',
      ),
      cleanup,
    };
  } catch (err) {
    console.error('[mp3]', requestId, phase, err);
    await cleanup();
    if (err instanceof Mp3Error) throw err;
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      ['ENOENT', 'EACCES'].includes(String(err.code))
    )
      throw new Mp3Error(
        'CONFIGURATION',
        'Il convertitore non è disponibile su questo server.',
        503,
      );
    if (phase === 'metadata' || phase === 'download')
      throw new Mp3Error(
        'UNAVAILABLE',
        'YouTube non ha reso disponibile questo audio al server. Prova un altro video.',
        502,
      );
    throw new Mp3Error(
      'CONVERSION_FAILED',
      'Non è stato possibile convertire questo audio in MP3.',
      500,
    );
  }
}
