import { describe, it, expect } from "vitest";
import { isChordToken, classifyLine } from "./chords";

describe("isChordToken", () => {
  const chords = [
    "A", "A7", "Am", "Am7", "Bb", "F#", "F#dim", "Csus4", "Dmaj7", "G/B",
    "C/G", "Ebm7b5", "N.C.", "Aadd9", "Baug", "Dm", "E-7", "Gmin7",
  ];
  for (const token of chords) {
    it(`accepts ${token}`, () => expect(isChordToken(token)).toBe(true));
  }

  const words = ["Hello", "and", "the", "Amsterdam", "Feel", "Go", "Ah", "Ba", "Doo", "42"];
  for (const token of words) {
    it(`rejects ${token}`, () => expect(isChordToken(token)).toBe(false));
  }
});

describe("classifyLine", () => {
  const cases: [string, "chords" | "text" | "blank"][] = [
    ["Am F C G", "chords"],
    ["G  D/F#  Em", "chords"],
    ["| C | Am | F | G |", "chords"],
    ["A7", "chords"],
    ["C", "text"],
    ["Bb  Eb  Bb  F7", "chords"],
    ["Am7 x2", "chords"],
    ["Hello darkness my old friend", "text"],
    ["A", "text"],
    ["Amsterdam by night", "text"],
    ["Go down to the river", "text"],
    ["A B C D E F G", "text"],
    ["", "blank"],
    ["   ", "blank"],
  ];
  for (const [line, expected] of cases) {
    it(`classifies ${JSON.stringify(line)} as ${expected}`, () =>
      expect(classifyLine(line)).toBe(expected));
  }
});
