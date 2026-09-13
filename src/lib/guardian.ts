import type { AnalysisResult, Finding, GuardianInput } from "./types";
import { analyzeTextContent } from "./analyzers/textAnalyzer";
import { analyzeUrl } from "./analyzers/urlAnalyzer";
import { analyzeScreenshot } from "./analyzers/visionAnalyzer";
import { decodeQrFromImage } from "./analyzers/qrAnalyzer";
import { normalizeUrl } from "./security";
import { scoreFindings } from "./scoring";
import { AiConfigError, getTextAiAssessment } from "./ai/provider";

function dedupeFindings(findings: Finding[]) {
  const map = new Map<string, Finding>();
  for (const finding of findings) {
    const key = `${finding.category}|${finding.explanation}`;
    if (!map.has(key)) {
      map.set(key, finding);
    }
  }
  return Array.from(map.values());
}

function defaultRecommendations(riskScore: number) {
  const base = [
    "Verify through an official website or helpline you find independently.",
    "Preserve evidence such as screenshots and sender details.",
  ];

  if (riskScore >= 50) {
    return [
      "Stop interacting with the sender immediately.",
      "If money or account details were shared, contact your bank or payment provider immediately.",
      ...base,
    ];
  }

  return base;
}

function defaultAvoid() {
  return [
    "Do not click suspicious links.",
    "Do not share OTPs, passwords, PINs, or CVV.",
    "Do not send money to unknown recipients.",
    "Do not call numbers provided in suspicious messages.",
  ];
}

function buildSummary(riskScore: number, findings: Finding[]) {
  if (riskScore >= 75) {
    return "High-risk indicators detected. This content is likely suspicious and needs caution.";
  }
  if (riskScore >= 50) {
    return "Multiple warning signs were detected. This content may be a potential scam.";
  }
  if (riskScore >= 25) {
    return "Some suspicious characteristics were detected. Verify independently before acting.";
  }

  if (findings.length === 0) {
    return "No strong scam signals were detected, but stay cautious and verify independently.";
  }

  return "Limited risk indicators were detected. Continue with caution and verify details.";
}

export async function runGuardian(input: GuardianInput): Promise<AnalysisResult> {
  const findings: Finding[] = [];
  const sources = ["guardian-orchestrator"];
  const detectedUrls: string[] = [];
  let extractedText = "";
  let qrDetected = false;
  let decodedQrPayload: string | undefined;

  if (input.inputType === "message") {
    const text = input.text ?? "";
    const textAnalysis = analyzeTextContent(text);
    findings.push(...textAnalysis.findings);
    detectedUrls.push(...textAnalysis.urls);
    sources.push("text-analyzer-rules");

    try {
      const aiResult = await getTextAiAssessment(text);
      if (aiResult) {
        findings.push(...aiResult.findings);
        sources.push("text-analyzer-ai");
      }
    } catch {
      sources.push("text-ai-fallback");
    }
  }

  if (input.inputType === "url") {
    const url = normalizeUrl(input.url ?? "");
    if (url) {
      detectedUrls.push(url);
      findings.push(...analyzeUrl(url).findings);
    } else {
      findings.push({
        category: "Invalid URL",
        severity: "high" as const,
        explanation: "The URL format appears invalid.",
        signal: "suspicious_url",
      });
    }
    sources.push("url-analyzer-rules");
  }

  if (input.inputType === "screenshot") {
    if (!input.imageBuffer) {
      throw new Error("No screenshot provided.");
    }

    const decodedQr = await decodeQrFromImage(input.imageBuffer);
    if (decodedQr) {
      qrDetected = true;
      decodedQrPayload = decodedQr;
      findings.push({
        category: "QR Detected",
        severity: "medium" as const,
        explanation: "A QR code was detected in the screenshot. Verify destination before acting.",
      });

      const normalized = normalizeUrl(decodedQr);
      if (normalized) {
        detectedUrls.push(normalized);
        findings.push(...analyzeUrl(normalized).findings);
      }
    }

    try {
      const { extraction, findings: visionFindings } = await analyzeScreenshot(
        input.imageBuffer,
        input.imageMimeType ?? "image/png",
      );
      extractedText = extraction.extracted_text;
      qrDetected = qrDetected || extraction.qr_detected;
      detectedUrls.push(...extraction.detected_urls);
      findings.push(...visionFindings);
      sources.push("vision-analyzer-ai");
    } catch (error) {
      if (error instanceof AiConfigError) {
        throw error;
      }
      sources.push("vision-fallback");
    }
  }

  if (input.inputType === "qr") {
    if (!input.imageBuffer) {
      throw new Error("No QR image provided.");
    }

    const decodedQr = await decodeQrFromImage(input.imageBuffer);
    if (!decodedQr) {
      findings.push({
        category: "No QR Found",
        severity: "medium" as const,
        explanation: "No readable QR code was detected in the uploaded image.",
      });
    } else {
      qrDetected = true;
      decodedQrPayload = decodedQr;
      sources.push("qr-analyzer");

      const normalized = normalizeUrl(decodedQr);
      if (normalized) {
        detectedUrls.push(normalized);
        findings.push(...analyzeUrl(normalized).findings);
      } else {
        findings.push({
          category: "Non-URL QR Payload",
          severity: "medium" as const,
          explanation: "The QR code contains non-URL content. Verify the source before acting.",
        });
      }
    }
  }

  const normalizedUrls = Array.from(new Set(detectedUrls))
    .map((url) => normalizeUrl(url))
    .filter((url): url is string => Boolean(url));

  for (const url of normalizedUrls) {
    findings.push(...analyzeUrl(url).findings);
  }

  const uniqueFindings = dedupeFindings(findings);
  const { riskLevel, riskScore } = scoreFindings(uniqueFindings);

  return {
    risk_level: riskLevel,
    risk_score: riskScore,
    summary: buildSummary(riskScore, uniqueFindings),
    findings: uniqueFindings,
    recommendations: defaultRecommendations(riskScore),
    avoid: defaultAvoid(),
    analysis_sources: Array.from(new Set(sources)),
    extracted_text: extractedText || undefined,
    detected_urls: normalizedUrls,
    qr_detected: qrDetected,
    decoded_qr_payload: decodedQrPayload,
  };
}
