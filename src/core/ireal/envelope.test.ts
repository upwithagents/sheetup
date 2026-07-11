import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitEnvelope, IRealParseError } from "./envelope";
import expected from "./fixtures/expected.json";

const FIXTURES = join(__dirname, "fixtures");
const fixture = (name: string) => readFileSync(join(FIXTURES, `${name}.txt`), "utf8");

const cases = ["tiny", "threeSongs", "twoSongsInHTML", "django"] as const;

describe("splitEnvelope", () => {
  for (const name of cases) {
    it(`parses ${name}: song count and first-song fields`, () => {
      const records = splitEnvelope(fixture(name));
      const exp = expected[name];
      expect(records).toHaveLength(exp.songs);
      expect(records[0].title).toBe(exp.first.title);
      expect(records[0].composer).toBe(exp.first.composer);
      expect(records[0].style).toBe(exp.first.style);
      expect(records[0].key).toBe(exp.first.key);
    });
  }

  it("extracts bpm when present", () => {
    const records = splitEnvelope(fixture("tiny"));
    expect(records[0].bpm).toBe(140);
  });

  it("returns a non-empty scrambled chart for every song", () => {
    for (const name of cases) {
      for (const record of splitEnvelope(fixture(name))) {
        expect(record.rawChart.length, `${name}: ${record.title}`).toBeGreaterThan(0);
      }
    }
  });

  it("throws IRealParseError when no irealb:// link is present", () => {
    expect(() => splitEnvelope("<html>nothing here</html>")).toThrow(IRealParseError);
  });
});
