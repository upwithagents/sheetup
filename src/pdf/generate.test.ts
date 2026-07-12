import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateChartPdf } from "./generate";
import { parseIRealUrl } from "@/core/ireal";
import { parseOcrText } from "@/core/ocr";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../core/ireal/fixtures", `${name}.txt`), "utf8");

describe("generateChartPdf", () => {
  it("renders an iReal chart (repeats, endings, sections) to a PDF buffer", async () => {
    const song = parseIRealUrl(fixture("django")).find((s) =>
      s.title.startsWith("Ain't Misbehavin'")
    )!;
    const pdf = await generateChartPdf({
      title: song.title,
      artist: song.artist,
      content: song.content,
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(2000);
  });

  it("renders an OCR chords+lyrics document", async () => {
    const { content } = parseOcrText(
      "[Verse]\nAm7 D7\nHello darkness my old friend\n\nG\nI've come to talk\n"
    );
    const pdf = await generateChartPdf({ title: "Test Song", content });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("renders an empty notes document without throwing", async () => {
    const pdf = await generateChartPdf({
      title: "Empty",
      content: { meta: {}, sections: [], annotations: [] },
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
