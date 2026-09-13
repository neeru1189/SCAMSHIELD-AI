import { AnalyzeClient } from "@/components/AnalyzeClient";

export default function AnalyzeQrPage() {
  return (
    <AnalyzeClient
      type="qr"
      title="Scan a QR code"
      description="Upload a QR image to decode destination and assess risk. We never initiate payments."
      acceptsFile
    />
  );
}
