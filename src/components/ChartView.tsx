import type {
  Annotation,
  Bar,
  BarLine,
  DocumentContent,
  LyricLine,
  Section,
} from "@/core/model";
import { buildChordRow } from "@/core/render/chordline";

function BarCell({ bar }: { bar: Bar }) {
  const repeatStart = bar.markers.includes("repeat-start");
  const repeatEnd = bar.markers.includes("repeat-end");
  const ending = bar.markers.includes("ending-1") ? "1." : bar.markers.includes("ending-2") ? "2." : null;
  const prefix = [
    bar.markers.includes("segno") ? "𝄋" : null,
    bar.markers.includes("coda") ? "◎" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`bar-cell ${repeatStart ? "bar-repeat-start" : ""} ${repeatEnd ? "bar-repeat-end" : ""}`}
    >
      {ending && <span className="bar-ending">{ending}</span>}
      <span className="bar-chords">
        {prefix && <span className="bar-mark">{prefix} </span>}
        {bar.raw === "x" || bar.raw === "r" ? (
          <span className="bar-repeat-sign">𝄎</span>
        ) : (
          bar.chords.join("  ") || " "
        )}
        {bar.raw && bar.raw !== "x" && bar.raw !== "r" && (
          <span className="bar-raw" title="unrecognized source syntax">
            {" "}
            {bar.raw}
          </span>
        )}
      </span>
    </div>
  );
}

function BarLineView({ line }: { line: BarLine }) {
  return (
    <div className="bar-grid">
      {line.bars.map((bar, i) => (
        <BarCell key={i} bar={bar} />
      ))}
    </div>
  );
}

function LyricLineView({ line }: { line: LyricLine }) {
  const chordRow = buildChordRow(line.chords);
  return (
    <div className="lyric-line">
      {chordRow && <div className="lyric-chords">{chordRow}</div>}
      <div className="lyric-text">{line.text || " "}</div>
    </div>
  );
}

function SectionView({
  section,
  annotations,
}: {
  section: Section;
  annotations: Annotation[];
}) {
  const own = annotations.filter((a) => a.anchor.sectionId === section.id);
  return (
    <section className="chart-section">
      {section.label && <span className="section-chip">{section.label}</span>}
      {section.lines.map((line, i) =>
        line.kind === "bars" ? (
          <BarLineView key={i} line={line} />
        ) : (
          <LyricLineView key={i} line={line} />
        )
      )}
      {own.map((a) => (
        <p key={a.id} className="annotation">
          ✎ {a.text}
        </p>
      ))}
    </section>
  );
}

export default function ChartView({ content }: { content: DocumentContent }) {
  return (
    <div className="chart">
      {content.sections.map((section) => (
        <SectionView key={section.id} section={section} annotations={content.annotations} />
      ))}
    </div>
  );
}
