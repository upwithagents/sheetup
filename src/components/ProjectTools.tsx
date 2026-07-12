"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectTools({
  projectId,
  projectName,
  documentCount,
}: {
  projectId: string;
  projectName: string;
  documentCount: number;
}) {
  const router = useRouter();
  const [name, setName] = useState(projectName);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function rename() {
    if (name.trim() === "" || name.trim() === projectName) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError((await res.json()).error ?? "rename failed");
  }

  async function remove() {
    if (!confirm(`Delete project "${projectName}"?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError((await res.json()).error ?? "delete failed");
    }
  }

  return (
    <div className="project-tools">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && rename()}
        disabled={busy}
        aria-label="Project name"
      />
      <button type="button" onClick={rename} disabled={busy || name.trim() === projectName}>
        Rename
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy || documentCount > 0}
        title={documentCount > 0 ? "Delete or move its documents first" : "Delete project"}
      >
        Delete
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
