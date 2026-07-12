import { importUpload, UnsupportedFileError } from "@/lib/import-upload";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "missing file" }, { status: 400 });
  }
  const projectName = (form.get("projectName") ?? "").toString().trim() || "Inbox";

  try {
    const result = await importUpload({
      data: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
      mimeType: file.type,
      projectName,
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UnsupportedFileError) {
      return Response.json({ error: error.message }, { status: 415 });
    }
    throw error;
  }
}
