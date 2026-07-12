// Text ↔ model conversions for the structured editor: chords are edited as
// the same monospace row the renderer shows (token column = charIndex), and
// bar lines as pipe-separated chord groups ("%" = repeat-previous bar).

import type { Bar, PositionedChord } from "../model";

export function parseChordRowInput(row: string): PositionedChord[] {
  const chords: PositionedChord[] = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(row)) !== null) {
    chords.push({ symbol: match[0], charIndex: match.index });
  }
  return chords;
}

export function barsToText(bars: Bar[]): string {
  return bars
    .map((bar) => (bar.raw === "x" || bar.raw === "r" ? "%" : bar.chords.join(" ") || " "))
    .join(" | ");
}

export function parseBarsInput(text: string, previous: Bar[]): Bar[] {
  const groups = text
    .split("|")
    .map((g) => g.trim())
    .filter((g) => g !== "");

  const bars: Bar[] = groups.map((group) => {
    if (group === "%") return { chords: [], markers: [], raw: "x" };
    return { chords: group.split(/\s+/), markers: [] };
  });

  // Same shape as before → markers (and raw for non-% bars) carry over.
  if (bars.length === previous.length) {
    for (let i = 0; i < bars.length; i++) {
      bars[i].markers = [...previous[i].markers];
      if (bars[i].raw === undefined && previous[i].raw !== undefined && previous[i].raw !== "x" && previous[i].raw !== "r") {
        bars[i].raw = previous[i].raw;
      }
    }
  }
  return bars;
}
