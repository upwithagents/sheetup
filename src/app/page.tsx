import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectFilter } = await searchParams;

  const [projects, documents] = await Promise.all([
    db.project.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { documents: true } } },
    }),
    db.document.findMany({
      where: projectFilter ? { projectId: projectFilter } : undefined,
      orderBy: { updatedAt: "desc" },
      include: { project: { select: { name: true } } },
    }),
  ]);

  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <p>No documents yet.</p>
        <p>
          <Link href="/import">Import your first sheet →</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="library">
      <aside className="library-sidebar">
        <h2>Projects</h2>
        <ul>
          <li>
            <Link href="/" className={projectFilter ? "" : "active"}>
              All
            </Link>
          </li>
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/?project=${project.id}`}
                className={projectFilter === project.id ? "active" : ""}
              >
                {project.name} ({project._count.documents})
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <section className="library-list">
        <h2>Documents</h2>
        <ul className="doc-list">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link href={`/documents/${doc.id}`} className="doc-row">
                <span className="doc-title">{doc.title}</span>
                {doc.artist && <span className="doc-artist">{doc.artist}</span>}
                <span className="badge">{doc.kind}</span>
                <span className="badge">{doc.sourceFormat}</span>
                <span className="doc-project">{doc.project.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        {documents.length === 0 && (
          <p className="empty-state">No documents in this project.</p>
        )}
      </section>
    </div>
  );
}
