import { createHash } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const target =
  process.env.MEDIA_TARGET || `${process.platform}-${process.arch}`;
const ytVersion = '2026.08.19';
const ffVersion = 'b6.1.1';
const targets = {
  'linux-x64': [
    'yt-dlp_linux',
    '58162f9bfdc27458ea47bfcb311cf47028f17d8154a8bf7d689861d46399230a',
    'e7e7fb30477f717e6f55f9180a70386c62677ef8a4d4d1a5d948f4098aa3eb99',
    '4f231a1960d83e403d08f7971e271707bec278a9ae18e21b8b5b03186668450d',
  ],
  'darwin-arm64': [
    'yt-dlp_macos',
    '0f192b7ec147ab6288885d6351d9ab67367640029b4377576ef46dd79cf7b202',
    'a90e3db6a3fd35f6074b013f948b1aa45b31c6375489d39e572bea3f18336584',
    'bb2db6f5d8cef919da12fbf592119a987202a8c060a886f3cab091f9cab90b64',
  ],
  'darwin-x64': [
    'yt-dlp_macos',
    '0f192b7ec147ab6288885d6351d9ab67367640029b4377576ef46dd79cf7b202',
    'ebdddc936f61e14049a2d4b549a412b8a40deeff6540e58a9f2a2da9e6b18894',
    'fa3add0ce901f7241abe0dfc0155d958fc834aca3f8ce61f87cc712ae669c1e0',
  ],
};
if (!targets[target]) throw new Error(`Unsupported media platform: ${target}`);
const [ytAsset, ytHash, ffHash, probeHash] = targets[target];
const directory = path.resolve('.media-bin', target);
await mkdir(directory, { recursive: true });
const assets = [
  [
    'yt-dlp',
    `https://github.com/yt-dlp/yt-dlp/releases/download/${ytVersion}/${ytAsset}`,
    ytHash,
  ],
  [
    'ffmpeg',
    `https://github.com/eugeneware/ffmpeg-static/releases/download/${ffVersion}/ffmpeg-${target}`,
    ffHash,
  ],
  [
    'ffprobe',
    `https://github.com/eugeneware/ffmpeg-static/releases/download/${ffVersion}/ffprobe-${target}`,
    probeHash,
  ],
];
const hash = (data) => createHash('sha256').update(data).digest('hex');
for (const [name, url, expected] of assets) {
  const destination = path.join(directory, name);
  const cached = await readFile(destination).catch(() => null);
  if (!cached || hash(cached) !== expected) {
    console.log(`Downloading ${name} for ${target}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    const content = Buffer.from(await response.arrayBuffer());
    if (hash(content) !== expected)
      throw new Error(`${name}: checksum mismatch`);
    await writeFile(`${destination}.download`, content);
    await rename(`${destination}.download`, destination);
  }
  await chmod(destination, 0o755);
}
console.log(
  `Media binaries ready: ${target}, yt-dlp ${ytVersion}, FFmpeg ${ffVersion}`,
);
