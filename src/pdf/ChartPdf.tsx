import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Annotation, Bar, BarLine, DocumentContent, LyricLine, Section } from "@/core/model";
import { buildChordRow } from "@/core/render/chordline";

const CHORD_COLOR = "#b45309";

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", fontSize: 10 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  metaLine: { fontSize: 9, color: "#555555", marginTop: 3, marginBottom: 14 },
  section: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    backgroundColor: "#eeeeee",
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: "flex-start",
    borderRadius: 2,
    marginBottom: 5,
  },
  barRow: { flexDirection: "row", flexWrap: "wrap" },
  barCell: {
    width: "25%",
    borderLeftWidth: 1.2,
    borderLeftColor: "#444444",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
    paddingVertical: 6,
    paddingHorizontal: 5,
    minHeight: 24,
  },
  barChords: { fontFamily: "Courier-Bold", fontSize: 10, color: CHORD_COLOR },
  barMark: { color: "#444444" },
  barEnding: { fontSize: 6, fontFamily: "Helvetica-Bold", color: "#666666" },
  lyricChords: { fontFamily: "Courier-Bold", fontSize: 9.5, color: CHORD_COLOR },
  lyricText: { fontFamily: "Courier", fontSize: 9.5, marginBottom: 3 },
  annotation: { fontSize: 9, fontFamily: "Helvetica-Oblique", color: "#555555", marginTop: 3 },
});

function barText(bar: Bar): string {
  const marks: string[] = [];
  if (bar.markers.includes("segno")) marks.push("S.");
  if (bar.markers.includes("coda")) marks.push("(coda)");
  if (bar.raw === "x" || bar.raw === "r") marks.push("%");
  const chords = bar.chords.join("  ");
  return [marks.join(" "), chords].filter(Boolean).join(" ") || " ";
}

function BarLinePdf({ line }: { line: BarLine }) {
  return (
    <View style={styles.barRow}>
      {line.bars.map((bar, i) => {
        const ending = bar.markers.includes("ending-1")
          ? "1."
          : bar.markers.includes("ending-2")
            ? "2."
            : null;
        return (
          <View
            key={i}
            style={[
              styles.barCell,
              bar.markers.includes("repeat-start") ? { borderLeftWidth: 3 } : {},
              bar.markers.includes("repeat-end")
                ? { borderRightWidth: 3, borderRightColor: "#444444" }
                : {},
            ]}
          >
            {ending && <Text style={styles.barEnding}>{ending}</Text>}
            <Text style={styles.barChords}>{barText(bar)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function LyricLinePdf({ line }: { line: LyricLine }) {
  const chordRow = buildChordRow(line.chords);
  return (
    <View wrap={false}>
      {chordRow !== "" && <Text style={styles.lyricChords}>{chordRow}</Text>}
      <Text style={styles.lyricText}>{line.text || " "}</Text>
    </View>
  );
}

function SectionPdf({ section, annotations }: { section: Section; annotations: Annotation[] }) {
  const own = annotations.filter((a) => a.anchor.sectionId === section.id);
  return (
    <View style={styles.section}>
      {section.label !== "" && <Text style={styles.sectionLabel}>{section.label}</Text>}
      {section.lines.map((line, i) =>
        line.kind === "bars" ? <BarLinePdf key={i} line={line} /> : <LyricLinePdf key={i} line={line} />
      )}
      {own.map((a) => (
        <Text key={a.id} style={styles.annotation}>
          ✎ {a.text}
        </Text>
      ))}
    </View>
  );
}

export interface ChartPdfProps {
  title: string;
  artist?: string | null;
  content: DocumentContent;
}

export default function ChartPdf({ title, artist, content }: ChartPdfProps) {
  const { meta } = content;
  const metaParts = [
    artist,
    meta.key && `key ${meta.key}`,
    meta.timeSignature,
    meta.tempo && `${meta.tempo} bpm`,
    meta.style,
  ].filter(Boolean);

  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        {metaParts.length > 0 && <Text style={styles.metaLine}>{metaParts.join("  ·  ")}</Text>}
        {content.sections.map((section) => (
          <SectionPdf key={section.id} section={section} annotations={content.annotations} />
        ))}
      </Page>
    </Document>
  );
}
