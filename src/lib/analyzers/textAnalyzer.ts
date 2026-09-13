import type { Finding } from "../types";

const rules: Array<{ pattern: RegExp; finding: Finding }> = [
  {
    pattern: /urgent|immediately|within\s+\d+\s*(minute|hour|day)|today/i,
    finding: {
      category: "Urgency",
      severity: "high",
      explanation: "The message creates urgent pressure to act quickly.",
      signal: "urgent_threat",
    },
  },
  {
    pattern: /block|suspend|deactivate|legal action|disconnected|penalty/i,
    finding: {
      category: "Threat",
      severity: "high",
      explanation: "The message uses threats or fear to force immediate action.",
      signal: "urgent_threat",
    },
  },
  {
    pattern: /pay|payment|upi|transfer|processing fee|send money|₹|rs\.?\s?\d+/i,
    finding: {
      category: "Payment Request",
      severity: "high",
      explanation: "The message requests money or payment under pressure.",
      signal: "payment_request",
    },
  },
  {
    pattern: /otp|pin|cvv|password|bank details|credential|login/i,
    finding: {
      category: "Sensitive Data Request",
      severity: "critical",
      explanation: "The message asks for sensitive information that should never be shared.",
      signal: "credential_request",
    },
  },
  {
    pattern: /congratulations|won|lottery|reward|prize|gift/i,
    finding: {
      category: "Unrealistic Reward",
      severity: "medium",
      explanation: "The message promises rewards often used in scam campaigns.",
      signal: "unrealistic_reward",
    },
  },
  {
    pattern: /bank|kyc|government|income tax|electricity board|courier|police/i,
    finding: {
      category: "Possible Impersonation",
      severity: "high",
      explanation: "The message may be impersonating an organization or authority.",
      signal: "impersonation",
    },
  },
];

const urlRegex = /(https?:\/\/[^\s]+|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;

export function extractUrls(text: string) {
  return Array.from(new Set(text.match(urlRegex) ?? []));
}

export function analyzeTextContent(text: string) {
  const findings: Finding[] = [];

  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      findings.push(rule.finding);
    }
  }

  const urls = extractUrls(text);
  if (urls.length > 0) {
    findings.push({
      category: "Contains Link",
      severity: "medium",
      explanation: "The message includes one or more links that should be verified carefully.",
      signal: "suspicious_url",
    });
  }

  return {
    findings,
    urls,
  };
}
