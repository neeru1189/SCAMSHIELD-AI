import { NextRequest } from "next/server";

const memoryRateLimiter = new Map<string, { count: number; resetAt: number }>();

export function redactSensitiveContent(value: string) {
  return value
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, "[REDACTED_CARD]")
    .replace(/\b\d{6}\b/g, "[REDACTED_OTP]")
    .replace(/\b\d{3}\b/g, "[REDACTED_CVV]")
    .replace(/\b\d{10,16}\b/g, "[REDACTED_NUMBER]");
}

export function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return "unknown";
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memoryRateLimiter.get(key);

  if (!entry || now > entry.resetAt) {
    memoryRateLimiter.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  memoryRateLimiter.set(key, entry);
  return true;
}

export function normalizeUrl(input: string) {
  try {
    const value = input.trim();
    const prefixed = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(prefixed);
    return url.toString();
  } catch {
    return null;
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
