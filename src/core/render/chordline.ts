import type { PositionedChord } from "../model";

/**
 * Lay chords out on a monospace row: each symbol starts at its charIndex
 * (the column of the syllable it belongs to), falling back to a single
 * space of separation when symbols would overlap.
 */
export function buildChordRow(chords: PositionedChord[]): string {
  const sorted = [...chords].sort((a, b) => a.charIndex - b.charIndex);
  let row = "";
  for (const { symbol, charIndex } of sorted) {
    const pad = charIndex - row.length;
    row += (pad > 0 ? " ".repeat(pad) : row === "" ? "" : " ") + symbol;
  }
  return row;
}
