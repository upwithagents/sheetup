import { describe, it, expect } from "vitest";
import { parseOcrText } from "./parse";
import type { BarLine, LyricLine } from "../model";

const VERSE_CHORUS_SHEET = `[Verse 1]
C          G
Hello darkness my old friend
Am         F
I've come to talk with you again

[Chorus]
| C | Am | F | G |
`;

const CHORDS_ONLY_SHEET = `Bb7 Eb7 Bb7 Bb7
Eb7 Eo7 Bb7 G7
`;

const PLAIN_NOTES = `Rehearsal Monday 7pm
Bring capo and tuner
`;

describe("parseOcrText on a verse/chorus chord sheet", () => {
  const result = () => parseOcrText(VERSE_CHORUS_SHEET);

  it("detects music and section labels", () => {
    expect(result().kind).toBe("music");
    expect(result().content.sections.map((s) => s.label)).toEqual(["Verse 1", "Chorus"]);
  });

  it("merges chord lines onto the lyric line below", () => {
    const [verse] = result().content.sections;
    expect(verse.lines).toHaveLength(2);
    const line1 = verse.lines[0] as LyricLine;
    expect(line1.kind).toBe("lyric");
    expect(line1.text).toBe("Hello darkness my old friend");
    expect(line1.chords).toEqual([
      { symbol: "C", charIndex: 0 },
      { symbol: "G", charIndex: 11 },
    ]);
    const line2 = verse.lines[1] as LyricLine;
    expect(line2.chords.map((c) => c.symbol)).toEqual(["Am", "F"]);
  });

  it("turns a standalone piped chord line into bars", () => {
    const [, chorus] = result().content.sections;
    const line = chorus.lines[0] as BarLine;
    expect(line.kind).toBe("bars");
    expect(line.bars.map((b) => b.chords)).toEqual([["C"], ["Am"], ["F"], ["G"]]);
  });
});

describe("parseOcrText on a chords-only sheet", () => {
  it("produces bar lines, one bar per chord without pipes", () => {
    const { kind, content } = parseOcrText(CHORDS_ONLY_SHEET);
    expect(kind).toBe("music");
    expect(content.sections).toHaveLength(1);
    const [line1, line2] = content.sections[0].lines as BarLine[];
    expect(line1.bars.map((b) => b.chords)).toEqual([["Bb7"], ["Eb7"], ["Bb7"], ["Bb7"]]);
    expect(line2.bars.map((b) => b.chords)).toEqual([["Eb7"], ["Eo7"], ["Bb7"], ["G7"]]);
  });
});

describe("parseOcrText on arbitrary notes", () => {
  it("falls back to a notes document with plain lines", () => {
    const { kind, content } = parseOcrText(PLAIN_NOTES);
    expect(kind).toBe("notes");
    expect(content.sections).toHaveLength(1);
    const lines = content.sections[0].lines as LyricLine[];
    expect(lines.map((l) => l.text)).toEqual(["Rehearsal Monday 7pm", "Bring capo and tuner"]);
    expect(lines.every((l) => l.chords.length === 0)).toBe(true);
  });

  it("returns empty content for empty text", () => {
    const { kind, content } = parseOcrText("   \n \n");
    expect(kind).toBe("notes");
    expect(content.sections).toHaveLength(0);
  });
});

describe("parseOcrText section heading variants", () => {
  it("recognizes bracketed, colon and ALL-CAPS headings", () => {
    const { content } = parseOcrText(
      "[Intro]\nA7 D7\n\nChorus:\nE7 A7\n\nBRIDGE\nB7 E7\n"
    );
    expect(content.sections.map((s) => s.label)).toEqual(["Intro", "Chorus", "BRIDGE"]);
  });
});
