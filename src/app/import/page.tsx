"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [projectName, setProjectName] = useState("Inbox");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState<false | "upload" | "ireal">(false);
  const [error, setError] = useState<string | null>(null);

  const [irealUrl, setIrealUrl] = useState("");
  const [showIreal, setShowIreal] = useState(false);

  async function uploadFile(file: File) {
    setBusy("upload");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("projectName", projectName);
      const res = await fetch("/api/import/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `upload failed (${res.status})`);
        return;
      }
      router.push(`/documents/${data.documentId}`);
    } catch {
      setError("network error — is the server running?");
    } finally {
      setBusy(false);
    }
  }

  async function submitIreal(event: React.FormEvent) {
    event.preventDefault();
    setBusy("ireal");
    setError(null);
    try {
      const res = await fetch("/api/import/ireal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: irealUrl, projectName }),
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
    <div className="import-page">
      <h1 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Import a sheet</h1>

      <label className="form" style={{ marginBottom: "1.2rem" }}>
        Project / band
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={{ maxWidth: "18rem" }}
        />
      </label>

      <div
        className={`dropzone ${dragOver ? "dropzone-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) uploadFile(file);
        }}
        onClick={() => fileInput.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />
        {busy === "upload" ? (
          <p className="dropzone-busy">Reading your sheet…</p>
        ) : (
          <>
            <p className="dropzone-title">Drop a photo or scan of your sheet here</p>
            <p className="dropzone-hint">JPG, PNG or PDF — or click to choose a file</p>
          </>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="ireal-section">
        {!showIreal ? (
          <button type="button" className="link-button" onClick={() => setShowIreal(true)}>
            Have an iReal Pro chart instead?
          </button>
        ) : (
          <form className="form" onSubmit={submitIreal}>
            <label>
              iReal Pro link or exported playlist HTML
              <textarea
                value={irealUrl}
                onChange={(e) => setIrealUrl(e.target.value)}
                placeholder="irealb://… or paste the contents of an exported .html playlist"
                required
              />
            </label>
            <button type="submit" disabled={busy === "ireal"}>
              {busy === "ireal" ? "Importing…" : "Import iReal chart"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
