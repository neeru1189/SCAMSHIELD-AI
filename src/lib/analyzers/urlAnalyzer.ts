import type { Finding } from "../types";

const suspiciousKeywords = [
  "verify",
  "kyc",
  "wallet",
  "upi",
  "gift",
  "reward",
  "lottery",
  "urgent",
  "secure-login",
  "account-update",
];

const knownShorteners = ["bit.ly", "tinyurl.com", "t.co", "rb.gy", "cutt.ly", "is.gd"];

export function analyzeUrl(urlValue: string): { findings: Finding[] } {
  const findings: Finding[] = [];

  let parsed: URL;
  try {
    parsed = new URL(urlValue);
  } catch {
    return {
      findings: [
        {
          category: "Invalid URL",
          severity: "high" as const,
          explanation: "The provided link is not a valid URL.",
          signal: "suspicious_url",
        },
      ],
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const path = `${parsed.pathname}${parsed.search}`.toLowerCase();

  if (parsed.protocol !== "https:") {
    findings.push({
      category: "No HTTPS",
      severity: "medium",
      explanation: "The link does not use HTTPS, so data can be exposed or manipulated.",
      signal: "suspicious_url",
    });
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    findings.push({
      category: "IP-based Link",
      severity: "high",
      explanation: "The link uses an IP address instead of a recognizable domain.",
      signal: "suspicious_domain",
    });
  }

  if (knownShorteners.includes(hostname)) {
    findings.push({
      category: "URL Shortener",
      severity: "medium",
      explanation: "Shortened links can hide their final destination.",
      signal: "suspicious_url",
    });
  }

  const labels = hostname.split(".");
  if (labels.length > 4 || hostname.includes("--")) {
    findings.push({
      category: "Suspicious Domain Pattern",
      severity: "medium",
      explanation: "The website address looks unusual and may be impersonating a legitimate organization.",
      signal: "suspicious_domain",
    });
  }

  if (parsed.searchParams.size > 6) {
    findings.push({
      category: "Excessive Query Parameters",
      severity: "medium",
      explanation: "The link includes many tracking or redirection parameters.",
      signal: "suspicious_url",
    });
  }

  if (suspiciousKeywords.some((keyword) => hostname.includes(keyword) || path.includes(keyword))) {
    findings.push({
      category: "Suspicious Keywords",
      severity: "high",
      explanation: "The link contains terms commonly used in phishing or scam pages.",
      signal: "suspicious_domain",
    });
  }

  if (/bank|sbi|hdfc|icici|axis|paytm|phonepe|gpay/i.test(hostname) && !/\.com$|\.in$/.test(hostname)) {
    findings.push({
      category: "Possible Brand Impersonation",
      severity: "high",
      explanation: "The domain uses financial brand terms in an unusual address format.",
      signal: "impersonation",
    });
  }

  return { findings };
}
