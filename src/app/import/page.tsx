"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [projectName, setProjectName] = useState("Inbox");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import/ireal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, projectName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `import failed (${res.status})`);
        return;
      }
      if (data.documents.length === 1) {
        router.push(`/documents/${data.documents[0].id}`);
      } else {
        router.push(`/?project=${data.projectId}`);
      }
    } catch {
      setError("network error — is the server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Import</h1>
      <form className="form" onSubmit={submit}>
        <label>
          iReal Pro link or exported playlist HTML
          <textarea
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="irealb://… or paste the contents of an exported .html playlist"
            required
          />
        </label>
        <label>
          Project / band
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Importing…" : "Import"}
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
}
