import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import ChartPdf, { type ChartPdfProps } from "./ChartPdf";

export async function generateChartPdf(props: ChartPdfProps): Promise<Buffer> {
  return renderToBuffer(createElement(ChartPdf, props));
}
