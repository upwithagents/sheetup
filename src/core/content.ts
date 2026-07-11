import type { DocumentContent, Line } from "./model";

export class InvalidContentError extends Error {}

export function emptyContent(): DocumentContent {
  return { meta: {}, sections: [], annotations: [] };
}

export function serializeContent(content: DocumentContent): string {
  return JSON.stringify(content);
}

function isLine(l: unknown): l is Line {
  if (typeof l !== "object" || l === null) return false;
  const line = l as Record<string, unknown>;
  if (line.kind === "lyric") return typeof line.text === "string" && Array.isArray(line.chords);
  if (line.kind === "bars") return Array.isArray(line.bars);
  return false;
}

export function parseContent(json: string): DocumentContent {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new InvalidContentError("content is not valid JSON");
  }
  if (typeof data !== "object" || data === null) throw new InvalidContentError("content must be an object");
  const c = data as Record<string, unknown>;
  if (typeof c.meta !== "object" || c.meta === null) throw new InvalidContentError("content.meta missing");
  if (!Array.isArray(c.sections)) throw new InvalidContentError("content.sections missing");
  if (!Array.isArray(c.annotations)) throw new InvalidContentError("content.annotations missing");
  for (const s of c.sections) {
    const sec = s as Record<string, unknown>;
    if (typeof sec.id !== "string" || typeof sec.label !== "string" || !Array.isArray(sec.lines))
      throw new InvalidContentError("malformed section");
    if (!sec.lines.every(isLine)) throw new InvalidContentError("malformed line");
  }
  return data as DocumentContent;
}
