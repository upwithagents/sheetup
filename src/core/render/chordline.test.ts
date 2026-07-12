import { describe, it, expect } from "vitest";
import { buildChordRow } from "./chordline";

describe("buildChordRow", () => {
  it("returns an empty string for no chords", () => {
    expect(buildChordRow([])).toBe("");
  });

  it("places chords at their character index", () => {
    expect(
      buildChordRow([
        { symbol: "C", charIndex: 0 },
        { symbol: "G", charIndex: 11 },
      ])
    ).toBe("C          G");
  });

  it("keeps at least one space when indexes collide", () => {
    expect(
      buildChordRow([
        { symbol: "Am7", charIndex: 0 },
        { symbol: "D7", charIndex: 2 },
      ])
    ).toBe("Am7 D7");
  });

  it("handles unsorted input", () => {
    expect(
      buildChordRow([
        { symbol: "G", charIndex: 8 },
        { symbol: "C", charIndex: 0 },
      ])
    ).toBe("C       G");
  });
});
