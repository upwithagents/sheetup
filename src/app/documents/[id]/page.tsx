import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseContent } from "@/core/content";
import type { Annotation, Bar, Line, Section } from "@/core/model";

export const dynamic = "force-dynamic";

const MARKER_TEXT: Record<string, string> = {
  "repeat-start": "{",
  "repeat-end": "}",
  "ending-1": "N1",
  "ending-2": "N2",
  coda: "◎",
  segno: "𝄋",
};

function barToText(bar: Bar): string {
  const parts: string[] = [];
  for (const marker of bar.markers) parts.push(MARKER_TEXT[marker] ?? marker);
  if (bar.raw === "x") parts.push("𝄎");
  else if (bar.raw === "r") parts.push("𝄎𝄎");
  else {
    parts.push(...bar.chords);
    if (bar.raw) parts.push(`⟨${bar.raw}⟩`);
  }
  return parts.join(" ");
}

function lineToText(line: Line): string {
  if (line.kind === "bars") {
    return `| ${line.bars.map(barToText).join(" | ")} |`;
  }
  return line.text;
}

function sectionAnnotations(section: Section, annotations: Annotation[]) {
  return annotations.filter((a) => a.anchor.sectionId === section.id);
}

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

      {content.sections.map((section) => (
        <section key={section.id} className="chart-section">
          {section.label && <h3>{section.label}</h3>}
          <div className="chart-bars">
            {section.lines.map((line, i) => (
              <div key={i}>{lineToText(line)}</div>
            ))}
          </div>
          {sectionAnnotations(section, content.annotations).map((a) => (
            <p key={a.id} className="annotation">
              ✎ {a.text}
            </p>
          ))}
        </section>
      ))}

      {(doc.sourceText || doc.sourceFileRef) && (
        <details className="source-block">
          <summary>Source</summary>
          <pre>{doc.sourceText ?? doc.sourceFileRef}</pre>
        </details>
      )}
    </article>
  );
}
