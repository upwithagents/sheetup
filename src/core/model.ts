export type DocumentKind = "music" | "notes";

export type SourceFormat = "ireal" | "ocr-chords" | "scan";

export interface DocumentMeta {
  key?: string;
  tempo?: number;
  timeSignature?: string;
  style?: string;
}

export interface PositionedChord {
  symbol: string;
  charIndex: number;
}

export interface LyricLine {
  kind: "lyric";
  text: string;
  chords: PositionedChord[];
}

export type BarMarker =
  | "repeat-start"
  | "repeat-end"
  | "ending-1"
  | "ending-2"
  | "coda"
  | "segno";

export interface Bar {
  chords: string[];
  markers: BarMarker[];
  raw?: string;
}

export interface BarLine {
  kind: "bars";
  bars: Bar[];
}

export type Line = BarLine | LyricLine;

export interface Annotation {
  id: string;
  anchor: { sectionId: string; lineIndex?: number; barIndex?: number };
  text: string;
}

export interface Section {
  id: string;
  label: string;
  lines: Line[];
}

export interface DocumentContent {
  meta: DocumentMeta;
  sections: Section[];
  annotations: Annotation[];
}
