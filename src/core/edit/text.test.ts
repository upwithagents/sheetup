import { describe, it, expect } from "vitest";
import { parseChordRowInput, barsToText, parseBarsInput } from "./text";
import { buildChordRow } from "../render/chordline";
import type { Bar } from "../model";

describe("parseChordRowInput", () => {
  it("reads tokens with their column positions", () => {
    expect(parseChordRowInput("C          G")).toEqual([
      { symbol: "C", charIndex: 0 },
      { symbol: "G", charIndex: 11 },
    ]);
  });

  it("is the inverse of buildChordRow", () => {
    const chords = [
      { symbol: "Am7", charIndex: 0 },
      { symbol: "D7", charIndex: 11 },
      { symbol: "G", charIndex: 20 },
    ];
    expect(parseChordRowInput(buildChordRow(chords))).toEqual(chords);
  });

  it("returns empty for blank input", () => {
    expect(parseChordRowInput("   ")).toEqual([]);
  });
});

describe("barsToText / parseBarsInput round trip", () => {
  const bars: Bar[] = [
    { chords: ["C7", "F7"], markers: ["repeat-start"] },
    { chords: ["G7"], markers: [] },
    { chords: [], markers: [], raw: "x" },
    { chords: ["C7"], markers: ["repeat-end"] },
  ];

  it("renders bars as pipe-separated text", () => {
    expect(barsToText(bars)).toBe("C7 F7 | G7 | % | C7");
  });

  it("round trips preserving markers when bar count is unchanged", () => {
    const edited = parseBarsInput("C7 F7 | Gm7 | % | C7", bars);
    expect(edited[1].chords).toEqual(["Gm7"]);
    expect(edited[0].markers).toEqual(["repeat-start"]);
    expect(edited[3].markers).toEqual(["repeat-end"]);
    expect(edited[2].raw).toBe("x");
  });

  it("drops markers when the bar count changes", () => {
    const edited = parseBarsInput("C7 | F7", bars);
    expect(edited).toHaveLength(2);
    expect(edited.every((b) => b.markers.length === 0)).toBe(true);
  });

  it("turns % into a repeat bar even on count change", () => {
    const edited = parseBarsInput("C7 | %", bars);
    expect(edited[1].raw).toBe("x");
    expect(edited[1].chords).toEqual([]);
  });

  it("ignores empty groups from leading/trailing pipes", () => {
    expect(parseBarsInput("| C7 | F7 |", [])).toHaveLength(2);
  });
});
