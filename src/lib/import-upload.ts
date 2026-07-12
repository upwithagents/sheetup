import { mkdir, writeFile } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { parseOcrText } from "@/core/ocr";
import { emptyContent, serializeContent } from "@/core/content";
import { db } from "./db";

export class UnsupportedFileError extends Error {}

// Overridable so tests never touch the real uploads directory.
export const UPLOADS_DIR = process.env.SHEETUP_UPLOADS_DIR
  ? join(process.cwd(), process.env.SHEETUP_UPLOADS_DIR)
  : join(process.cwd(), "data", "uploads");

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png" };
const PDF_TYPE = "application/pdf";

export interface UploadInput {
  data: Buffer;
  filename: string;
  mimeType: string;
  projectName: string;
  /** OCR engine; defaults to tesseract.js. Injectable for tests. */
  ocr?: (data: Buffer) => Promise<string>;
}

export interface UploadResult {
  projectId: string;
  documentId: string;
  title: string;
}

async function tesseractOcr(data: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(data);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

export async function importUpload(
  input: UploadInput,
  client: PrismaClient = db
): Promise<UploadResult> {
  const { data, filename, mimeType, projectName } = input;
  const isImage = mimeType in IMAGE_TYPES;
  const isPdf = mimeType === PDF_TYPE;
  if (!isImage && !isPdf) {
    throw new UnsupportedFileError(`unsupported file type: ${mimeType}`);
  }

  const ext = isPdf ? ".pdf" : IMAGE_TYPES[mimeType];
  const storedName = `${randomUUID()}${ext}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  const storedPath = join(UPLOADS_DIR, storedName);
  await writeFile(storedPath, data);
  const sourceFileRef = relative(process.cwd(), storedPath);

  let kind = "notes";
  let sourceFormat = "scan";
  let sourceText: string | null = null;
  let content = emptyContent();

  if (isImage) {
    sourceFormat = "ocr-chords";
    const ocr = input.ocr ?? tesseractOcr;
    sourceText = await ocr(data);
    const parsed = parseOcrText(sourceText);
    kind = parsed.kind;
    content = parsed.content;
  }

  const title = filename.replace(new RegExp(`${extname(filename)}$`), "") || filename;

  const project = await client.project.upsert({
    where: { name: projectName },
    update: {},
    create: { name: projectName },
  });

  const doc = await client.document.create({
    data: {
      projectId: project.id,
      title,
      kind,
      sourceFormat,
      sourceFileRef,
      sourceText,
      content: serializeContent(content),
    },
    select: { id: true, title: true },
  });

  return { projectId: project.id, documentId: doc.id, title: doc.title };
}
