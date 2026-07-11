// Chart tokenizer for descrambled iReal Pro chart syntax. Token grammar
// follows the MIT-licensed `ireal-reader` package
// (github.com/pianosnake/ireal-reader, Parser.js) with one deliberate
// difference: repeats, numbered endings, coda and segno are kept as bar
// markers for chart display instead of being unrolled into a flat measure
// list. Unrecognized syntax is preserved on the containing bar's `raw`
// field, never dropped silently.

import type { Annotation, Bar, BarMarker, Section } from "../model";

export interface ParsedChart {
  sections: Section[];
  annotations: Annotation[];
  timeSignature?: string;
}

const SECTION_LABELS: Record<string, string> = { i: "Intro", v: "Verse" };

// Chord: root A-G or W (inherits previous chord's root), quality characters,
// optional /bass. Same character class as the reference implementation.
const CHORD_RE = /^[A-GW][+\-^\dhob#suadlt]*(?:\/[A-G][#b]?)?/;
const SECTION_RE = /^\*(\w)/;
const COMMENT_RE = /^<(.*?)>/;
const TIME_RE = /^T(\d{2})/;
const ENDING_RE = /^N(\d)/;

class ChartBuilder {
  sections: Section[] = [];
  annotations: Annotation[] = [];
  timeSignature?: string;
  private bars: Bar[] = [];
  private barOpen = false;
  private lastChordRoot: string | null = null;
  private ids = 0;

  private currentSection(): Section {
    if (this.sections.length === 0) this.startSection("");
    return this.sections[this.sections.length - 1];
  }

  startSection(label: string): void {
    const current = this.sections[this.sections.length - 1];
    const hasContent = this.bars.some(
      (bar) => bar.chords.length > 0 || bar.raw !== undefined
    );
    if (current && !hasContent && current.label === "") {
      current.label = label; // marker arrived right after the section opened
      return;
    }
    this.finishSection();
    this.ids += 1;
    this.bars = [];
    this.barOpen = false;
    this.sections.push({ id: `s${this.ids}`, label, lines: [] });
  }

  private finishSection(): void {
    const section = this.sections[this.sections.length - 1];
    if (!section) return;
    this.closeBar();
    const bars = this.bars.filter(
      (bar) => bar.chords.length > 0 || bar.markers.length > 0 || bar.raw !== undefined
    );
    if (bars.length > 0) section.lines.push({ kind: "bars", bars });
    else this.sections.pop(); // drop empty trailing section
  }

  private openBar(): Bar {
    const section = this.currentSection();
    void section;
    if (!this.barOpen) {
      this.bars.push({ chords: [], markers: [] });
      this.barOpen = true;
    }
    return this.bars[this.bars.length - 1];
  }

  closeBar(): void {
    this.barOpen = false;
  }

  newBar(): void {
    this.closeBar();
  }

  pushChord(symbol: string): void {
    let chord = symbol;
    if (chord.startsWith("W") && this.lastChordRoot) {
      chord = chord.replace("W", this.lastChordRoot);
    } else {
      this.lastChordRoot = chord.split("/")[0];
    }
    this.openBar().chords.push(chord);
  }

  addMarker(marker: BarMarker): void {
    // Markers attach to the open bar, or open the next bar when they arrive
    // right after a bar line (endings, coda, segno lead their bar).
    this.openBar().markers.push(marker);
  }

  markLastBar(marker: BarMarker): void {
    const bar = this.bars[this.bars.length - 1];
    if (bar) bar.markers.push(marker);
    else this.openBar().markers.push(marker);
  }

  addRawBar(raw: string): void {
    this.closeBar();
    this.bars.push({ chords: [], markers: [], raw });
    this.closeBar();
  }

  appendRaw(text: string): void {
    const bar = this.openBar();
    bar.raw = (bar.raw ?? "") + text;
  }

  addAnnotation(text: string): void {
    const section = this.currentSection();
    this.ids += 1;
    this.annotations.push({
      id: `a${this.ids}`,
      anchor: {
        sectionId: section.id,
        lineIndex: 0,
        barIndex: Math.max(this.bars.length - 1, 0),
      },
      text,
    });
  }

  build(): ParsedChart {
    this.finishSection();
    return {
      sections: this.sections,
      annotations: this.annotations,
      timeSignature: this.timeSignature,
    };
  }
}

export function parseChart(input: string): ParsedChart {
  const builder = new ChartBuilder();
  let rest = input;

  const eat = (length: number) => {
    rest = rest.slice(length).replace(/^[ ,]+/, "");
  };

  while (rest.length > 0) {
    let match: RegExpMatchArray | null;

    if (rest.startsWith("XyQ")) {
      eat(3);
    } else if ((match = rest.match(/^Y+/))) {
      eat(match[0].length);
    } else if ((match = rest.match(SECTION_RE))) {
      const code = match[1];
      builder.startSection(SECTION_LABELS[code.toLowerCase()] ?? code.toUpperCase());
      eat(match[0].length);
    } else if ((match = rest.match(COMMENT_RE))) {
      const text = match[1].trim();
      if (text !== "") builder.addAnnotation(text);
      eat(match[0].length);
    } else if ((match = rest.match(TIME_RE))) {
      const digits = match[1];
      builder.timeSignature = digits === "12" ? "12/8" : `${digits[0]}/${digits[1]}`;
      eat(match[0].length);
    } else if (rest.startsWith("Kcl") || rest.startsWith("x")) {
      builder.addRawBar("x");
      eat(rest.startsWith("Kcl") ? 3 : 1);
    } else if (rest.startsWith("r")) {
      builder.addRawBar("r");
      eat(1);
    } else if (rest.startsWith("n")) {
      builder.pushChord("N.C.");
      eat(1);
    } else if (rest.startsWith("p") || rest.startsWith("U")) {
      eat(1);
    } else if (rest.startsWith("S")) {
      builder.addMarker("segno");
      eat(1);
    } else if (rest.startsWith("Q")) {
      builder.addMarker("coda");
      eat(1);
    } else if (rest.startsWith("{")) {
      builder.closeBar();
      builder.addMarker("repeat-start");
      eat(1);
    } else if (rest.startsWith("}")) {
      builder.markLastBar("repeat-end");
      builder.closeBar();
      eat(1);
    } else if ((match = rest.match(ENDING_RE))) {
      const ending = match[1];
      if (ending === "1" || ending === "2") {
        builder.addMarker(`ending-${ending}` as BarMarker);
      } else {
        builder.appendRaw(`N${ending}`);
      }
      eat(match[0].length);
    } else if (rest.startsWith("LZ|")) {
      builder.newBar();
      eat(3);
    } else if (rest.startsWith("LZ")) {
      builder.newBar();
      eat(2);
    } else if (rest.startsWith("|") || rest.startsWith("[")) {
      builder.newBar();
      eat(1);
    } else if (rest.startsWith("]") || rest.startsWith("Z")) {
      builder.closeBar();
      eat(1);
    } else if ((match = rest.match(CHORD_RE))) {
      builder.pushChord(match[0]);
      eat(match[0].length);
    } else {
      builder.appendRaw(rest[0]);
      eat(1);
    }
  }

  return builder.build();
}
