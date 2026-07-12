import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseContent } from "@/core/content";
import ChartView from "@/components/ChartView";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await db.document.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true } } },
  });
  if (!doc) notFound();

  const content = parseContent(doc.content);
  const { meta } = content;

  return (
    <article>
      <div className="doc-meta">
        <h1>{doc.title}</h1>
        {doc.artist && <span className="doc-meta-item">{doc.artist}</span>}
        <span className="badge">{doc.kind}</span>
        <span className="badge">{doc.sourceFormat}</span>
        {meta.key && <span className="doc-meta-item">key {meta.key}</span>}
        {meta.timeSignature && <span className="doc-meta-item">{meta.timeSignature}</span>}
        {meta.tempo && <span className="doc-meta-item">{meta.tempo} bpm</span>}
        {meta.style && <span className="doc-meta-item">{meta.style}</span>}
        <span className="doc-meta-item">
          in <Link href={`/?project=${doc.project.id}`}>{doc.project.name}</Link>
        </span>
      </div>

      {doc.sourceFileRef?.startsWith("data/uploads/") && !doc.sourceFileRef.endsWith(".pdf") && (
        // eslint-disable-next-line @next/next/no-img-element -- served from our own file route
        <img
          src={`/api/documents/${doc.id}/file`}
          alt={`Original scan of ${doc.title}`}
          className="doc-source-image"
        />
      )}
      {doc.sourceFileRef?.endsWith(".pdf") && (
        <p className="doc-meta-item">
          <a href={`/api/documents/${doc.id}/file`} target="_blank">
            View original PDF →
          </a>
        </p>
      )}

      <ChartView content={content} />

      {(doc.sourceText || doc.sourceFileRef) && (
        <details className="source-block">
          <summary>Source</summary>
          <pre>{doc.sourceText ?? doc.sourceFileRef}</pre>
        </details>
      )}
    </article>
  );
}
