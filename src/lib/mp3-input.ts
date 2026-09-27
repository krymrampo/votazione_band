export const MAX_DURATION_SECONDS = 600;
export const MAX_SOURCE_BYTES = 50 * 1024 * 1024;

export class Mp3Error extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}

export function youtubeUrl(value: unknown): string {
  const invalid = () =>
    new Mp3Error(
      'INVALID_URL',
      'Inserisci un link valido a un singolo video YouTube.',
      400,
    );
  if (typeof value !== 'string' || value.length > 2048) throw invalid();
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw invalid();
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port
  )
    throw invalid();
  if (url.searchParams.has('list'))
    throw new Mp3Error(
      'PLAYLIST',
      'Le playlist non sono supportate. Inserisci il link del singolo video.',
      400,
    );
  let id: string | null = null;
  if (url.hostname === 'youtu.be')
    id = /^\/([\w-]{11})\/?$/.exec(url.pathname)?.[1] || null;
  if (
    [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'music.youtube.com',
    ].includes(url.hostname)
  ) {
    id =
      url.pathname === '/watch'
        ? url.searchParams.get('v')
        : /^\/(?:shorts|embed)\/([\w-]{11})\/?$/.exec(url.pathname)?.[1] ||
          null;
  }
  if (!id || !/^[\w-]{11}$/.test(id)) throw invalid();
  return `https://www.youtube.com/watch?v=${id}`;
}

export function validateVideo(info: {
  duration?: number;
  is_live?: boolean;
  live_status?: string;
  availability?: string;
}) {
  if (
    info.is_live ||
    ['is_live', 'is_upcoming', 'post_live'].includes(info.live_status || '')
  )
    throw new Mp3Error('LIVE', 'Le dirette non sono supportate.');
  if (info.availability && !['public', 'unlisted'].includes(info.availability))
    throw new Mp3Error(
      'UNAVAILABLE',
      'Questo video richiede accesso o non è disponibile.',
    );
  if (!Number.isFinite(info.duration) || !info.duration || info.duration <= 0)
    throw new Mp3Error(
      'UNAVAILABLE',
      'Non è possibile verificare la durata del video.',
    );
  if (info.duration > MAX_DURATION_SECONDS)
    throw new Mp3Error('TOO_LONG', 'Il video supera il limite di 10 minuti.');
}

export function safeFilename(title: string): string {
  const safe = title
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, '')
    .trim()
    .slice(0, 120)
    .trim();
  return `${safe || 'audio'}.mp3`;
}
