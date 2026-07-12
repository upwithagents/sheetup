import { db } from "@/lib/db";
import { parseContent } from "@/core/content";
import { generateChartPdf } from "@/pdf/generate";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const doc = await db.document.findUnique({
    where: { id },
    select: { title: true, artist: true, content: true },
  });
  if (!doc) return new Response("not found", { status: 404 });

  const pdf = await generateChartPdf({
    title: doc.title,
    artist: doc.artist,
    content: parseContent(doc.content),
  });

  const filename = doc.title.replace(/[^\w\d\- ]+/g, "").trim() || "chart";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}
