import { AnalyzeClient } from "@/components/AnalyzeClient";

export default function AnalyzeScreenshotPage() {
  return (
    <AnalyzeClient
      type="screenshot"
      title="Analyze a screenshot"
      description="Upload a screenshot containing suspicious messages, fake pages, or payment requests."
      acceptsFile
    />
  );
}
