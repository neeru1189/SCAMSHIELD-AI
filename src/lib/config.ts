export const APP_NAME = "ScamShield AI";
export const TAGLINE = "Stop. Check. Stay Safe.";

export const MAX_TEXT_LENGTH = 4000;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const COOKIE_NAME = "scamshield_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export const RISK_LEVEL_LABELS = {
  low: "Low Risk",
  medium: "Medium Risk",
  high: "High Risk",
  critical: "Critical Risk",
} as const;

export const DEMO_EXAMPLES = [
  {
    id: "electricity-scam",
    label: "Demo: Fake electricity disconnection message",
    type: "message",
    input:
      "URGENT: Your electricity connection will be disconnected today. Pay ₹2,499 immediately using the link below to avoid service interruption.",
  },
  {
    id: "bank-kyc-scam",
    label: "Demo: Fake bank KYC warning",
    type: "message",
    input:
      "Dear Customer, your bank KYC is expired. Update now or account will be blocked in 2 hours: http://verify-kyc-now-example.com",
  },
  {
    id: "lottery-scam",
    label: "Demo: Fake lottery reward",
    type: "message",
    input:
      "Congratulations! You won ₹25,00,000 in our lucky draw. Pay processing fee of ₹4,999 to claim now.",
  },
  {
    id: "short-url",
    label: "Demo: Suspicious shortened URL",
    type: "url",
    input: "https://bit.ly/4XyZa12",
  },
  {
    id: "gov-scam",
    label: "Demo: Fake government notice",
    type: "message",
    input:
      "Govt subsidy suspended. Confirm Aadhaar and bank account immediately to avoid legal action.",
  },
  {
    id: "legit-delivery",
    label: "Demo: Legitimate delivery notification",
    type: "message",
    input: "Your package from Example Store will arrive tomorrow between 2 PM and 5 PM. Track it in our official app.",
  },
  {
    id: "legit-education",
    label: "Demo: Legitimate educational notification",
    type: "message",
    input:
      "Reminder: Your online class starts at 10:00 AM tomorrow. Join through your school portal.",
  },
] as const;
