import type { DocumentContent } from "../model";
import { splitEnvelope } from "./envelope";
import { descramble } from "./descramble";
import { parseChart } from "./chart";

export { IRealParseError } from "./envelope";

export interface ParsedIRealDocument {
  title: string;
  artist: string;
  content: DocumentContent;
}

/**
 * Parse an iReal Pro link (irealb:// / irealbook://) or the contents of an
 * exported .html playlist file into Sheetup documents.
 */
export function parseIRealUrl(input: string): ParsedIRealDocument[] {
  return splitEnvelope(input).map((song) => {
    const chart = parseChart(descramble(song.rawChart));
    return {
      title: song.title,
      artist: song.composer,
      content: {
        meta: {
          key: song.key || undefined,
          tempo: song.bpm ?? undefined,
          timeSignature: chart.timeSignature,
          style: song.style || undefined,
        },
        sections: chart.sections,
        annotations: chart.annotations,
      },
    };
  });
}
