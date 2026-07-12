import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseContent } from "@/core/content";
import DocumentEditor from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await db.document.findUnique({
    where: { id },
    select: { id: true, title: true, artist: true, content: true },
  });
  if (!doc) notFound();

  return (
    <DocumentEditor
      documentId={doc.id}
      initialTitle={doc.title}
      initialArtist={doc.artist ?? ""}
      initialContent={parseContent(doc.content)}
    />
  );
}
