"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Annotation, DocumentContent, Line, Section } from "@/core/model";
import { buildChordRow } from "@/core/render/chordline";
import { parseChordRowInput, barsToText, parseBarsInput } from "@/core/edit/text";
import { withBasePath } from "@/lib/base-path";

interface Props {
  documentId: string;
  initialTitle: string;
  initialArtist: string;
  initialContent: DocumentContent;
}

let nextId = 0;
const freshId = (prefix: string) => `${prefix}-new-${++nextId}`;

export default function DocumentEditor({
  documentId,
  initialTitle,
  initialArtist,
  initialContent,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [artist, setArtist] = useState(initialArtist);
  const [content, setContent] = useState<DocumentContent>(initialContent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSection(index: number, section: Section | null) {
    setContent((c) => {
      const sections = [...c.sections];
      if (section === null) {
        const removed = sections.splice(index, 1)[0];
        return {
          ...c,
          sections,
          annotations: c.annotations.filter((a) => a.anchor.sectionId !== removed.id),
        };
      }
      sections[index] = section;
      return { ...c, sections };
    });
  }

  function moveSection(index: number, delta: -1 | 1) {
    setContent((c) => {
      const target = index + delta;
      if (target < 0 || target >= c.sections.length) return c;
      const sections = [...c.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...c, sections };
    });
  }

  function addSection() {
    setContent((c) => ({
      ...c,
      sections: [...c.sections, { id: freshId("s"), label: "", lines: [] }],
    }));
  }

  function updateLine(section: Section, lineIndex: number, line: Line | null): Section {
    const lines = [...section.lines];
    if (line === null) lines.splice(lineIndex, 1);
    else lines[lineIndex] = line;
    return { ...section, lines };
  }

  function updateAnnotation(id: string, text: string | null) {
    setContent((c) => ({
      ...c,
      annotations:
        text === null
          ? c.annotations.filter((a) => a.id !== id)
          : c.annotations.map((a) => (a.id === id ? { ...a, text } : a)),
    }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(withBasePath(`/api/documents/${documentId}`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, artist: artist.trim() || null, content }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? `save failed (${res.status})`);
        return;
      }
      router.push(`/documents/${documentId}`);
      router.refresh();
    } catch {
      setError("network error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(withBasePath(`/api/documents/${documentId}`), { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setBusy(false);
      setError("delete failed");
    }
  }

  return (
    <div className="editor">
      <div className="editor-head">
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Artist
          <input value={artist} onChange={(e) => setArtist(e.target.value)} />
        </label>
      </div>

      {content.sections.map((section, si) => (
        <fieldset key={section.id} className="editor-section">
          <div className="editor-section-head">
            <input
              className="editor-label-input"
              placeholder="Section label (Verse, A, …)"
              value={section.label}
              onChange={(e) => updateSection(si, { ...section, label: e.target.value })}
            />
            <span className="editor-section-tools">
              <button type="button" onClick={() => moveSection(si, -1)} title="Move up">↑</button>
              <button type="button" onClick={() => moveSection(si, 1)} title="Move down">↓</button>
              <button type="button" onClick={() => updateSection(si, null)} title="Delete section">✕</button>
            </span>
          </div>

          {section.lines.map((line, li) => (
            // Length in the key remounts uncontrolled inputs when lines are
            // added/removed, so defaultValue never shows a deleted neighbor.
            <div key={`${li}/${section.lines.length}`} className="editor-line">
              {line.kind === "lyric" ? (
                <>
                  <input
                    className="editor-mono editor-chord-row"
                    placeholder="chords (align above syllables)"
                    defaultValue={buildChordRow(line.chords)}
                    onChange={(e) =>
                      updateSection(
                        si,
                        updateLine(section, li, {
                          ...line,
                          chords: parseChordRowInput(e.target.value),
                        })
                      )
                    }
                    spellCheck={false}
                  />
                  <input
                    className="editor-mono"
                    placeholder="lyrics"
                    value={line.text}
                    onChange={(e) =>
                      updateSection(si, updateLine(section, li, { ...line, text: e.target.value }))
                    }
                  />
                </>
              ) : (
                <input
                  className="editor-mono editor-chord-row"
                  title="Bars separated by | — use % to repeat the previous bar"
                  defaultValue={barsToText(line.bars)}
                  onChange={(e) =>
                    updateSection(
                      si,
                      updateLine(section, li, {
                        ...line,
                        bars: parseBarsInput(e.target.value, line.bars),
                      })
                    )
                  }
                  spellCheck={false}
                />
              )}
              <button
                type="button"
                className="editor-line-delete"
                onClick={() => updateSection(si, updateLine(section, li, null))}
                title="Delete line"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="editor-add-row">
            <button
              type="button"
              onClick={() =>
                updateSection(si, {
                  ...section,
                  lines: [...section.lines, { kind: "lyric", text: "", chords: [] }],
                })
              }
            >
              + lyric line
            </button>
            <button
              type="button"
              onClick={() =>
                updateSection(si, {
                  ...section,
                  lines: [...section.lines, { kind: "bars", bars: [{ chords: [], markers: [] }] }],
                })
              }
            >
              + bar line
            </button>
            <button
              type="button"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  annotations: [
                    ...c.annotations,
                    { id: freshId("a"), anchor: { sectionId: section.id, lineIndex: 0 }, text: "" },
                  ],
                }))
              }
            >
              + note
            </button>
          </div>

          {content.annotations
            .filter((a) => a.anchor.sectionId === section.id)
            .map((a: Annotation) => (
              <div key={a.id} className="editor-line">
                <input
                  placeholder="annotation"
                  value={a.text}
                  onChange={(e) => updateAnnotation(a.id, e.target.value)}
                />
                <button
                  type="button"
                  className="editor-line-delete"
                  onClick={() => updateAnnotation(a.id, null)}
                  title="Delete annotation"
                >
                  ✕
                </button>
              </div>
            ))}
        </fieldset>
      ))}

      <div className="editor-add-row">
        <button type="button" onClick={addSection}>
          + section
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="editor-actions">
        <button type="button" className="button-primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" className="link-button" onClick={() => router.back()} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="editor-delete" onClick={deleteDocument} disabled={busy}>
          Delete document
        </button>
      </div>
    </div>
  );
}
