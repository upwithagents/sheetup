import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitEnvelope } from "./envelope";
import { descramble } from "./descramble";
import { parseChart } from "./chart";
import type { BarLine } from "../model";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", `${name}.txt`), "utf8");

function barsOf(result: ReturnType<typeof parseChart>, sectionIndex: number) {
  const line = result.sections[sectionIndex].lines[0] as BarLine;
  return line.bars;
}

describe("parseChart on the tiny fixture", () => {
  const chart = () => {
    const [song] = splitEnvelope(fixture("tiny"));
    return parseChart(descramble(song.rawChart));
  };

  it("produces one implicit section with 5 bars", () => {
    const result = chart();
    expect(result.sections).toHaveLength(1);
    expect(barsOf(result, 0)).toHaveLength(5);
  });

  it("reads chords bar by bar", () => {
    const bars = barsOf(chart(), 0);
    expect(bars[0].chords).toEqual(["C", "D", "F#-", "B7"]);
    expect(bars[1].chords).toEqual(["E-", "E", "A-", "D7"]);
    expect(bars[4].chords).toEqual(["F", "G7", "C"]);
  });

  it("reads the time signature", () => {
    expect(chart().timeSignature).toBe("3/4");
  });

  it("ignores blank comments", () => {
    expect(chart().annotations).toHaveLength(0);
  });
});

describe("parseChart on Ain't Misbehavin' (repeats, endings, multiple sections)", () => {
  const chart = () => {
    const song = splitEnvelope(fixture("django")).find((s) =>
      s.title.startsWith("Ain't Misbehavin'")
    )!;
    return parseChart(descramble(song.rawChart));
  };

  it("splits into sections A, B, A", () => {
    expect(chart().sections.map((s) => s.label)).toEqual(["A", "B", "A"]);
  });

  it("keeps repeat and ending markers instead of unrolling", () => {
    const bars = barsOf(chart(), 0);
    expect(bars).toHaveLength(10);
    expect(bars[0].chords).toEqual(["C", "C#o"]);
    expect(bars[0].markers).toContain("repeat-start");
    expect(bars[6].markers).toContain("ending-1");
    expect(bars[7].markers).toContain("repeat-end");
    expect(bars[8].markers).toContain("ending-2");
  });

  it("parses the B section bars", () => {
    const bars = barsOf(chart(), 1);
    expect(bars).toHaveLength(8);
    expect(bars[0].chords).toEqual(["A-"]);
    expect(bars[4].chords).toEqual(["G", "G#o"]);
  });

  it("parses slash chords", () => {
    const bars = barsOf(chart(), 0);
    expect(bars[2].chords).toEqual(["C", "C7/E"]);
  });
});

describe("parseChart annotations and edge cases", () => {
  it("turns non-empty comments into annotations anchored to the current bar", () => {
    const result = parseChart("|T44<Solo break>C |D |");
    expect(result.annotations).toHaveLength(1);
    expect(result.annotations[0].text).toBe("Solo break");
    expect(result.annotations[0].anchor.sectionId).toBe(result.sections[0].id);
  });

  it("represents single-measure repeats as raw 'x' bars", () => {
    const result = parseChart("[*AT44C7XyQKcl LZF7 |");
    const bars = barsOf(result, 0);
    expect(bars[0].chords).toEqual(["C7"]);
    expect(bars[1].raw).toBe("x");
    expect(bars[2].chords).toEqual(["F7"]);
  });

  it("expands W slash chords using the previous chord root", () => {
    const result = parseChart("|T44C7 W/E |");
    expect(barsOf(result, 0)[0].chords).toEqual(["C7", "C7/E"]);
  });

  it("maps *i sections to Intro", () => {
    const result = parseChart("[*iT44C |D ][*AE |F |");
    expect(result.sections.map((s) => s.label)).toEqual(["Intro", "A"]);
  });

  it("never returns zero sections for a non-empty chart", () => {
    expect(parseChart("|C |").sections.length).toBeGreaterThan(0);
  });
});
