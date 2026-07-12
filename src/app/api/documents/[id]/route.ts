import { db } from "@/lib/db";
import { parseContent, serializeContent, InvalidContentError } from "@/core/content";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  let body: { title?: string; artist?: string | null; content?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const data: { title?: string; artist?: string | null; content?: string } = {};
  if (typeof body.title === "string" && body.title.trim() !== "") data.title = body.title.trim();
  if (body.artist !== undefined) data.artist = body.artist === null ? null : String(body.artist).trim() || null;
  if (body.content !== undefined) {
    try {
      // Round trip through the validator so malformed structures never land in the db.
      data.content = serializeContent(parseContent(JSON.stringify(body.content)));
    } catch (error) {
      if (error instanceof InvalidContentError) {
        return Response.json({ error: `invalid content: ${error.message}` }, { status: 422 });
      }
      throw error;
    }
  }
  if (Object.keys(data).length === 0) {
    return Response.json({ error: "nothing to update" }, { status: 400 });
  }

  const exists = await db.document.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return Response.json({ error: "not found" }, { status: 404 });

  const doc = await db.document.update({
    where: { id },
    data,
    select: { id: true, title: true, artist: true, updatedAt: true },
  });
  return Response.json(doc);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const exists = await db.document.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return Response.json({ error: "not found" }, { status: 404 });
  await db.document.delete({ where: { id } });
  return Response.json({ deleted: true });
}
