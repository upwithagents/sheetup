import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { importUpload, UnsupportedFileError, UPLOADS_DIR } from "./import-upload";
import { parseContent } from "@/core/content";

const client = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: "file:./data/test.db" }),
});

const CHORD_SHEET_TEXT = "[Verse]\nAm7 D7\nHello darkness my old friend\n";
const fakeOcr = async () => CHORD_SHEET_TEXT;
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const pdf = Buffer.from("%PDF-1.4 fake");

beforeEach(async () => {
  await client.document.deleteMany();
  await client.project.deleteMany();
});

afterAll(async () => {
  await client.$disconnect();
  rmSync(UPLOADS_DIR, { recursive: true, force: true });
});

describe("importUpload", () => {
  it("OCRs an image into a music document and stores the file", async () => {
    const result = await importUpload(
      { data: jpeg, filename: "my-song.jpg", mimeType: "image/jpeg", projectName: "Band", ocr: fakeOcr },
      client
    );
    expect(result.title).toBe("my-song");

    const doc = await client.document.findUniqueOrThrow({
      where: { id: result.documentId },
      include: { project: true },
    });
    expect(doc.project.name).toBe("Band");
    expect(doc.kind).toBe("music");
    expect(doc.sourceFormat).toBe("ocr-chords");
    expect(doc.sourceText).toBe(CHORD_SHEET_TEXT);
    expect(parseContent(doc.content).sections[0].label).toBe("Verse");

    expect(doc.sourceFileRef).toMatch(/^data\/uploads\/.+\.jpg$/);
    const stored = join(process.cwd(), doc.sourceFileRef!);
    expect(existsSync(stored)).toBe(true);
    expect(readFileSync(stored)).toEqual(jpeg);
  });

  it("stores a PDF as a scan document without OCR", async () => {
    let ocrCalled = false;
    const result = await importUpload(
      {
        data: pdf,
        filename: "setlist.pdf",
        mimeType: "application/pdf",
        projectName: "Band",
        ocr: async () => {
          ocrCalled = true;
          return "";
        },
      },
      client
    );
    const doc = await client.document.findUniqueOrThrow({ where: { id: result.documentId } });
    expect(ocrCalled).toBe(false);
    expect(doc.kind).toBe("notes");
    expect(doc.sourceFormat).toBe("scan");
    expect(doc.sourceFileRef).toMatch(/\.pdf$/);
    expect(parseContent(doc.content).sections).toHaveLength(0);
  });

  it("creates a notes document when OCR finds no chords", async () => {
    const result = await importUpload(
      { data: jpeg, filename: "todo.png", mimeType: "image/png", projectName: "Band", ocr: async () => "buy strings\n" },
      client
    );
    const doc = await client.document.findUniqueOrThrow({ where: { id: result.documentId } });
    expect(doc.kind).toBe("notes");
    expect(doc.sourceFormat).toBe("ocr-chords");
  });

  it("rejects unsupported file types", async () => {
    await expect(
      importUpload(
        { data: jpeg, filename: "song.gif", mimeType: "image/gif", projectName: "X", ocr: fakeOcr },
        client
      )
    ).rejects.toThrow(UnsupportedFileError);
    expect(await client.document.count()).toBe(0);
  });

  it("reuses an existing project by name", async () => {
    const a = await importUpload(
      { data: jpeg, filename: "a.jpg", mimeType: "image/jpeg", projectName: "Band", ocr: fakeOcr },
      client
    );
    const b = await importUpload(
      { data: jpeg, filename: "b.jpg", mimeType: "image/jpeg", projectName: "Band", ocr: fakeOcr },
      client
    );
    expect(a.projectId).toBe(b.projectId);
  });
});
