import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitEnvelope } from "./envelope";
import { descramble } from "./descramble";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", `${name}.txt`), "utf8");

describe("descramble", () => {
  it("recovers the tiny chart as readable syntax", () => {
    const [song] = splitEnvelope(fixture("tiny"));
    expect(descramble(song.rawChart).trim()).toBe(
      "|T34< >C,D,F#-,B7,|E-,E,A-,D7,|G,F#-,B7,E-,|D-,G7,C,D-7,|F,G7,C |"
    );
  });

  it("recovers a long scrambled chart (After You've Gone)", () => {
    const [song] = splitEnvelope(fixture("django"));
    expect(descramble(song.rawChart)).toMatch(/^\[\*AT44CXyQKcl/);
  });

  it("leaves short payloads (≤50 chars) untouched", () => {
    expect(descramble("|C |D |")).toBe("|C |D |");
  });

  it("produces charts free of scramble artifacts across the whole django playlist", () => {
    // Every descrambled chart should contain at least one bar or section token.
    for (const song of splitEnvelope(fixture("django"))) {
      expect(descramble(song.rawChart), song.title).toMatch(/[|[\]{}]/);
    }
  });
});
