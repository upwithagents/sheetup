import { describe, it, expect } from "vitest";
import { serializeContent, parseContent, emptyContent, InvalidContentError } from "./content";
import type { DocumentContent } from "./model";

const sample: DocumentContent = {
  meta: { key: "F", tempo: 120, timeSignature: "4/4", style: "Ballad" },
  sections: [
    {
      id: "s1",
      label: "A",
      lines: [
        { kind: "bars", bars: [{ chords: ["Fmaj7", "Em7"], markers: ["repeat-start"] }] },
        { kind: "lyric", text: "Blue skies ahead", chords: [{ symbol: "F", charIndex: 0 }] },
      ],
    },
  ],
  annotations: [{ id: "a1", anchor: { sectionId: "s1", lineIndex: 0 }, text: "lay back here" }],
};

describe("content round trip", () => {
  it("serializes and parses back to an equal structure", () => {
    expect(parseContent(serializeContent(sample))).toEqual(sample);
  });
  it("emptyContent parses as valid", () => {
    expect(parseContent(serializeContent(emptyContent()))).toEqual(emptyContent());
  });
});

describe("parseContent validation", () => {
  it("throws InvalidContentError on non-JSON", () => {
    expect(() => parseContent("not json")).toThrow(InvalidContentError);
  });
  it("throws InvalidContentError on missing sections", () => {
    expect(() => parseContent(JSON.stringify({ meta: {} }))).toThrow(InvalidContentError);
  });
  it("throws InvalidContentError on a line with unknown kind", () => {
    const bad = { meta: {}, annotations: [], sections: [{ id: "s", label: "A", lines: [{ kind: "wat" }] }] };
    expect(() => parseContent(JSON.stringify(bad))).toThrow(InvalidContentError);
  });
});
