import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const tracePath = path.resolve(
  '.next/server/app/api/download-mp3/route.js.nft.json',
);
const trace = JSON.parse(await readFile(tracePath, 'utf8'));
const files = [
  ...new Set(
    trace.files.map((file) => path.resolve(path.dirname(tracePath), file)),
  ),
];
const media = files.filter((file) =>
  file.includes(`${path.sep}.media-bin${path.sep}`),
);
const platform = `${process.platform}-${process.arch}`;
for (const name of ['yt-dlp', 'ffmpeg', 'ffprobe']) {
  const binary = path.resolve('.media-bin', platform, name);
  if (!media.includes(binary))
    throw new Error(`Missing traced binary: ${name}`);
  if (!((await stat(binary)).mode & 0o111))
    throw new Error(`Binary is not executable: ${name}`);
}
if (media.some((file) => !file.includes(`${path.sep}${platform}${path.sep}`)))
  throw new Error('The route includes binaries for a different platform');
let total = 0;
let binarySize = 0;
for (const file of files) {
  const info = await stat(file);
  if (info.isFile()) {
    total += info.size;
    if (media.includes(file)) binarySize += info.size;
  }
}
// Linux release sizes are fixed alongside the hashes in prepare-media.mjs.
const linuxEstimate = total - binarySize + 40446224 + 79826272 + 79665792;
if (Math.max(total, linuxEstimate) > 240000000)
  throw new Error(
    `MP3 bundle needs review: ${total} bytes, Linux estimate ${linuxEstimate} bytes`,
  );
console.log(
  `MP3 trace: ${(total / 1e6).toFixed(1)} MB; Linux estimate: ${(linuxEstimate / 1e6).toFixed(1)} MB. All three executables included.`,
);
