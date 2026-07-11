import type { PrismaClient } from "@/generated/prisma/client";
import { parseIRealUrl } from "@/core/ireal";
import { serializeContent } from "@/core/content";
import { db } from "./db";

export interface ImportResult {
  projectId: string;
  documents: { id: string; title: string }[];
}

/**
 * Parse an iReal Pro link (or exported HTML playlist) and persist one
 * Document per song under the named project (created on first use).
 * Throws IRealParseError on unparseable input — nothing is written then.
 */
export async function importIReal(
  input: string,
  projectName: string,
  client: PrismaClient = db
): Promise<ImportResult> {
  const songs = parseIRealUrl(input); // throws before any db writes

  const project = await client.project.upsert({
    where: { name: projectName },
    update: {},
    create: { name: projectName },
  });

  const documents = [];
  for (const song of songs) {
    const doc = await client.document.create({
      data: {
        projectId: project.id,
        title: song.title,
        artist: song.artist || null,
        kind: "music",
        sourceFormat: "ireal",
        sourceFileRef: input,
        sourceText: song.sourceChart,
        content: serializeContent(song.content),
      },
      select: { id: true, title: true },
    });
    documents.push(doc);
  }

  return { projectId: project.id, documents };
}
