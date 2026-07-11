import { importIReal } from "@/lib/import-ireal";
import { IRealParseError } from "@/core/ireal";

export async function POST(request: Request) {
  let body: { url?: string; projectName?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.url || typeof body.url !== "string") {
    return Response.json({ error: "missing url" }, { status: 400 });
  }

  try {
    const result = await importIReal(body.url, body.projectName?.trim() || "Inbox");
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof IRealParseError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
