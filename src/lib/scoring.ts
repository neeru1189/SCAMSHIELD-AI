import type { Finding, RiskLevel } from "./types";

const signalWeights: Record<string, number> = {
  credential_request: 30,
  payment_request: 20,
  suspicious_url: 25,
  impersonation: 20,
  urgent_threat: 15,
  unrealistic_reward: 15,
  suspicious_domain: 25,
  qr_payment_lure: 20,
  otp_request: 30,
};

const severityWeights: Record<string, number> = {
  low: 5,
  medium: 10,
  high: 15,
  critical: 20,
};

function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) {
    return "critical";
  }
  if (score >= 50) {
    return "high";
  }
  if (score >= 25) {
    return "medium";
  }
  return "low";
}

export function scoreFindings(findings: Finding[]) {
  const seenSignals = new Set<string>();
  let total = 0;

  for (const finding of findings) {
    if (finding.signal && !seenSignals.has(finding.signal)) {
      total += signalWeights[finding.signal] ?? 0;
      seenSignals.add(finding.signal);
    }
    total += severityWeights[finding.severity] ?? 0;
  }

  const riskScore = Math.max(0, Math.min(100, total));
  return {
    riskScore,
    riskLevel: getRiskLevel(riskScore),
  };
}
