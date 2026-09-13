import { AnalyzeClient } from "@/components/AnalyzeClient";

export default function AnalyzeMessagePage() {
  return (
    <AnalyzeClient
      type="message"
      title="Analyze a suspicious message"
      description="Paste a suspicious SMS, WhatsApp message, email, or payment request for scam-risk analysis."
      placeholder="Paste the suspicious SMS, WhatsApp message, email, or payment request here..."
    />
  );
}
