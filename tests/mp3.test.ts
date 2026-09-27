import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  youtubeUrl,
  validateVideo,
  Mp3Error,
  safeFilename,
} from '../src/lib/mp3-input';
import { runProcess } from '../src/lib/mp3-server';

test('normalizes supported YouTube URLs and rejects alternate destinations', () => {
  const canonical = 'https://www.youtube.com/watch?v=BaW_jenozKc';
  for (const url of [
    canonical,
    'https://youtu.be/BaW_jenozKc?t=3',
    'https://m.youtube.com/shorts/BaW_jenozKc',
    'https://music.youtube.com/watch?v=BaW_jenozKc',
  ])
    assert.equal(youtubeUrl(url), canonical);
  for (const url of [
    'file:///etc/passwd',
    'https://youtube.com.attacker.test/watch?v=BaW_jenozKc',
    'https://youtube.com@localhost/watch?v=BaW_jenozKc',
    'https://youtube.com:8443/watch?v=BaW_jenozKc',
    'https://youtu.be/BaW_jenozKc/extra',
    'https://youtube.com/watch?v=BaW_jenozKc&list=abc',
    'https://youtube.com/watch?v=x;ls',
    null,
  ])
    assert.throws(() => youtubeUrl(url), Mp3Error);
});

test('duration and availability are checked before downloading', () => {
  validateVideo({ duration: 600, availability: 'public' });
  for (const info of [
    { duration: 601 },
    { duration: 0 },
    {},
    { duration: NaN },
    { duration: 60, is_live: true },
    { duration: 60, live_status: 'is_upcoming' },
    { duration: 60, availability: 'private' },
  ])
    assert.throws(() => validateVideo(info), Mp3Error);
  assert.equal(safeFilename(' a/b\n"c '), 'abc.mp3');
});

test('cancellation terminates the process instead of leaving it running', async () => {
  const controller = new AbortController();
  const directory = await mkdtemp(path.join(tmpdir(), 'band-process-test-'));
  const timer = setTimeout(
    () => controller.abort(new Error('test cancellation')),
    100,
  );
  try {
    await assert.rejects(
      runProcess(
        process.execPath,
        ['-e', 'setInterval(() => {}, 1000)'],
        controller.signal,
        directory,
      ),
      /test cancellation/,
    );
  } finally {
    clearTimeout(timer);
    await rm(directory, { recursive: true, force: true });
  }
});

test('packaged FFmpeg generates a playable MP3 larger than the buffered response limit', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'band-codec-test-'));
  const binaries = path.resolve(
    '.media-bin',
    `${process.platform}-${process.arch}`,
  );
  const signal = AbortSignal.timeout(30000);
  const output = path.join(directory, 'audio.mp3');
  try {
    await runProcess(
      path.join(binaries, 'ffmpeg'),
      [
        '-nostdin',
        '-v',
        'error',
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=440:duration=210',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '192k',
        output,
      ],
      signal,
      directory,
    );
    assert.ok((await stat(output)).size > 4.5 * 1024 * 1024);
    const metadata = JSON.parse(
      await runProcess(
        path.join(binaries, 'ffprobe'),
        [
          '-v',
          'error',
          '-show_entries',
          'stream=codec_name:format=duration',
          '-of',
          'json',
          output,
        ],
        signal,
        directory,
      ),
    );
    assert.equal(metadata.streams[0].codec_name, 'mp3');
    assert.ok(Number(metadata.format.duration) >= 210);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
