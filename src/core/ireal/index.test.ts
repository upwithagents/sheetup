import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseIRealUrl } from "./index";
import { parseContent, serializeContent } from "../content";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", `${name}.txt`), "utf8");

describe("parseIRealUrl", () => {
  it("assembles a full document from the tiny fixture", () => {
    const [doc] = parseIRealUrl(fixture("tiny"));
    expect(doc.title).toBe("T");
    expect(doc.artist).toBe("f");
    expect(doc.content.meta).toEqual({ key: "C", tempo: 140, timeSignature: "3/4", style: "Afro" });
    expect(doc.content.sections).toHaveLength(1);
  });

  it("parses a whole playlist", () => {
    const docs = parseIRealUrl(fixture("django"));
    expect(docs).toHaveLength(205);
    for (const doc of docs) {
      expect(doc.content.sections.length, doc.title).toBeGreaterThan(0);
    }
  });

  it("exposes the descrambled source chart per document", () => {
    const [doc] = parseIRealUrl(fixture("tiny"));
    expect(doc.sourceChart.trim()).toBe(
      "|T34< >C,D,F#-,B7,|E-,E,A-,D7,|G,F#-,B7,E-,|D-,G7,C,D-7,|F,G7,C |"
    );
  });

  it("produces content that survives the model round trip", () => {
    const [doc] = parseIRealUrl(fixture("twoSongsInHTML"));
    expect(parseContent(serializeContent(doc.content))).toEqual(doc.content);
  });
});
