// Turns raw OCR text into document content: section headings split
// sections, chord lines merge onto the lyric line below them (chord column
// position → charIndex), standalone chord lines become bars, everything
// else stays as plain lyric lines. Any chord line found makes the document
// kind "music"; otherwise it's "notes" (the arbitrary-document outcome).

import type { DocumentContent, DocumentKind, Line, PositionedChord, Section } from "../model";
import { classifyLine, chordTokens, isAllChordTokens, isChordToken } from "./chords";

const HEADING_BRACKET_RE = /^\s*\[(.+)\]\s*$/;
const HEADING_WORD_RE =
  /^\s*(intro|verse|chorus|bridge|outro|solo|refrain|pre-chorus|interlude|coda|ending)(\s+\d+)?\s*:?\s*$/i;

function headingLabel(line: string): string | null {
  const bracket = line.match(HEADING_BRACKET_RE);
  if (bracket) return bracket[1].trim();
  const word = line.match(HEADING_WORD_RE);
  if (word) return line.trim().replace(/:$/, "").trim();
  // Short ALL-CAPS line that isn't chords → heading (e.g. "BRIDGE").
  const trimmed = line.trim();
  if (
    trimmed.length >= 3 &&
    trimmed.split(/\s+/).length <= 4 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]{3,}/.test(trimmed) &&
    classifyLine(trimmed) !== "chords"
  ) {
    return trimmed;
  }
  return null;
}

/** Chord tokens with their column positions in the raw line. */
function positionedChords(line: string): PositionedChord[] {
  const chords: PositionedChord[] = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (isChordToken(match[0])) chords.push({ symbol: match[0], charIndex: match.index });
  }
  return chords;
}

function barsFromChordLine(line: string): Line {
  const groups = line.includes("|")
    ? line.split("|").map((g) => chordTokens(g).filter(isChordToken)).filter((g) => g.length > 0)
    : chordTokens(line).filter(isChordToken).map((chord) => [chord]);
  return { kind: "bars", bars: groups.map((chords) => ({ chords, markers: [] })) };
}

export function parseOcrText(text: string): { kind: DocumentKind; content: DocumentContent } {
  const rawLines = text.split(/\r?\n/);
  const sections: Section[] = [];
  let ids = 0;
  let sawChords = false;

  const currentSection = (): Section => {
    if (sections.length === 0) {
      ids += 1;
      sections.push({ id: `s${ids}`, label: "", lines: [] });
    }
    return sections[sections.length - 1];
  };

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const kind = classifyLine(line);

    if (kind === "blank") {
      i += 1;
      continue;
    }

    const label = headingLabel(line);
    if (label !== null) {
      ids += 1;
      sections.push({ id: `s${ids}`, label, lines: [] });
      i += 1;
      continue;
    }

    // Look ahead to the lyric candidate, skipping at most one blank line —
    // OCR output is often double-spaced, which would otherwise break the
    // chord-over-lyric pairing.
    let nextIndex = i + 1;
    if (nextIndex < rawLines.length && classifyLine(rawLines[nextIndex]) === "blank") {
      nextIndex += 1;
    }
    const next = rawLines[nextIndex];
    const nextIsLyric =
      next !== undefined &&
      classifyLine(next) === "text" &&
      !isAllChordTokens(next) &&
      headingLabel(next) === null;

    // A line of bare chord letters ("C   G") isn't confidently chords on its
    // own, but directly above a lyric line the pairing is evidence enough.
    if (kind === "chords" || (kind === "text" && isAllChordTokens(line) && nextIsLyric)) {
      sawChords = true;
      if (nextIsLyric) {
        const chords = positionedChords(line).map((c) => ({
          ...c,
          charIndex: Math.min(c.charIndex, Math.max(next.trimEnd().length - 1, 0)),
        }));
        currentSection().lines.push({ kind: "lyric", text: next.trimEnd(), chords });
        i = nextIndex + 1;
      } else {
        currentSection().lines.push(barsFromChordLine(line));
        i += 1;
      }
      continue;
    }

    currentSection().lines.push({ kind: "lyric", text: line.trimEnd(), chords: [] });
    i += 1;
  }

  return {
    kind: sawChords ? "music" : "notes",
    content: { meta: {}, sections: sections.filter((s) => s.lines.length > 0), annotations: [] },
  };
}
