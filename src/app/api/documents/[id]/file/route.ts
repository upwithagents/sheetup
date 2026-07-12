import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { db } from "@/lib/db";
import { UPLOADS_DIR } from "@/lib/import-upload";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

export async function GET(_req: Request, ctx: RouteContext<"/api/documents/[id]/file">) {
  const { id } = await ctx.params;
  const doc = await db.document.findUnique({
    where: { id },
    select: { sourceFileRef: true },
  });
  if (!doc?.sourceFileRef) return new Response("not found", { status: 404 });

  // Serve only files that actually live inside the uploads directory.
  const filePath = path.resolve(process.cwd(), doc.sourceFileRef);
  if (!filePath.startsWith(UPLOADS_DIR + path.sep) || !existsSync(filePath)) {
    return new Response("not found", { status: 404 });
  }

  const { size } = await stat(filePath);
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "content-type": CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
      "content-length": String(size),
      "cache-control": "private, max-age=3600",
    },
  });
}
