import { AnalyzeClient } from "@/components/AnalyzeClient";

export default function AnalyzeUrlPage() {
  return (
    <AnalyzeClient
      type="url"
      title="Check a suspicious link"
      description="We analyze URL structure, suspicious patterns, and safety indicators without opening unknown pages automatically."
      placeholder="https://example.com"
    />
  );
}
