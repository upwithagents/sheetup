// Envelope format (per the MIT-licensed `ireal-reader` package,
// github.com/pianosnake/ireal-reader): an irealb:// URL carries a
// percent-encoded payload of songs separated by `===`, with a trailing
// playlist-name part when more than one part is present. Each song is
// `=`-separated fields: title, composer, style, key, then (optionally
// transpose,) the scrambled chart prefixed with "1r34LbKcu7", (optionally
// comp style,) bpm, and repeat count.

export class IRealParseError extends Error {}

export interface IRealSongRecord {
  title: string;
  composer: string;
  style: string;
  key: string;
  bpm: number | null;
  /** Scrambled chart payload, music prefix already stripped. */
  rawChart: string;
}

const MUSIC_PREFIX = "1r34LbKcu7";
const PROTOCOL_RE = /irealb(?:ook)?:\/\/([^"'\s]*)/;

export function splitEnvelope(input: string): IRealSongRecord[] {
  const match = PROTOCOL_RE.exec(input);
  if (!match) throw new IRealParseError("no irealb:// link found in input");
  const decoded = decodeURIComponent(match[1]);
  const parts = decoded.split("===");
  if (parts.length > 1) parts.pop(); // trailing part is the playlist name
  return parts.filter((part) => part.trim() !== "").map(parseSongRecord);
}

function parseSongRecord(data: string): IRealSongRecord {
  const parts = data.split(/=+/).filter((part) => part !== "");
  const musicIndex = parts.findIndex((part) => part.startsWith(MUSIC_PREFIX));
  if (musicIndex < 0) {
    throw new IRealParseError(`song "${parts[0] ?? "?"}" has no chart data`);
  }
  const [title, composer, style, key] = parts;
  // bpm sits second-to-last in every field layout (repeat count is last).
  const bpm = Number.parseInt(parts[parts.length - 2], 10);
  return {
    title,
    composer,
    style,
    key,
    bpm: Number.isNaN(bpm) || bpm <= 0 ? null : bpm,
    rawChart: parts[musicIndex].slice(MUSIC_PREFIX.length),
  };
}
