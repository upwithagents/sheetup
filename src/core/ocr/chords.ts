// Chord grammar for OCR'd text lines. Token-level matching is permissive
// (a bare "A" is a valid chord token); line-level classification requires at
// least one *qualified* token (digit, #/b, quality suffix, or slash bass) so
// lyric lines like "A" or "A B C D E F G" don't read as chords.

const CHORD_RE =
  /^[A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M|[-+°ø])*\d*(?:[#b]\d+)*(?:(?:maj|min|dim|aug|sus|add)\d*)*(?:\/[A-G][#b]?)?$/;

/** Decorations that may ride along on a chord line without disqualifying it. */
const DECORATION_RE = /^(?:x\d+|X\d+|\/+|%|-|–|\.+)$/;

export function isChordToken(token: string): boolean {
  if (token === "N.C." || token === "NC" || token === "N.C") return true;
  return CHORD_RE.test(token);
}

function isQualified(token: string): boolean {
  return isChordToken(token) && /[#b\d\/+°ø]|m|maj|min|dim|aug|sus|add|-/.test(token.slice(1));
}

/** Split a line into candidate tokens, dropping bar pipes and decorations. */
export function chordTokens(line: string): string[] {
  return line
    .split(/[\s|(),]+/)
    .filter((t) => t !== "" && !DECORATION_RE.test(t));
}

export function classifyLine(line: string): "chords" | "text" | "blank" {
  if (line.trim() === "") return "blank";
  const tokens = chordTokens(line);
  if (tokens.length === 0) return "blank";
  if (!tokens.every(isChordToken)) return "text";
  return tokens.some(isQualified) ? "chords" : "text";
}
