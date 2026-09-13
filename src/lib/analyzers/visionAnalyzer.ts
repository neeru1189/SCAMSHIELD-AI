import { getVisionExtraction } from "../ai/provider";
import { analyzeTextContent } from "./textAnalyzer";

export async function analyzeScreenshot(imageBuffer: Buffer, mimeType: string) {
  const base64 = imageBuffer.toString("base64");
  const extraction = await getVisionExtraction(base64, mimeType);

  const textSignals = extraction.extracted_text
    ? analyzeTextContent(extraction.extracted_text).findings
    : [];

  return {
    extraction,
    findings: textSignals,
  };
}
